const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// 檢查是否已經初始化，避免重複初始化
if (!admin.apps.length) {
  admin.initializeApp();
}

// 現有的 uploadImage 函數
exports.uploadImage = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(`events/${Date.now()}_${req.body.filename}`);
      
      const stream = file.createWriteStream({
        metadata: {
          contentType: req.body.contentType,
        },
      });

      stream.on('error', (err) => {
        console.error(err);
        res.status(500).send(err);
      });

      stream.on('finish', async () => {
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491',
        });
        res.status(200).send({ url });
      });

      stream.end(Buffer.from(req.body.file, 'base64'));
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  });
});

// 新增：驗證碼驗證並獲取配置
exports.verifyAndFetchConfig = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const { verificationCode } = req.body;
      
      if (!verificationCode) {
        return res.status(400).json({
          success: false,
          message: '請提供驗證碼'
        });
      }
      
      console.log('Verifying code:', verificationCode);
      
      const db = admin.firestore();
      
      // 1. 查詢驗證碼
      const verificationSnapshot = await db.collection('userEventVerifications')
        .where('verificationCode', '==', verificationCode)
        .limit(1)
        .get();
      
      if (verificationSnapshot.empty) {
        console.log('Verification code not found:', verificationCode);
        return res.status(404).json({
          success: false,
          message: '無效的驗證碼'
        });
      }
      
      const verificationDoc = verificationSnapshot.docs[0];
      const verification = verificationDoc.data();
      
      console.log('Found verification for user:', verification.userId);
      
      // 2. 查詢使用者資訊（獲取 OpenAI API Key）
      const userDoc = await db.collection('users')
        .doc(verification.userId)
        .get();
      
      if (!userDoc.exists) {
        console.log('User not found:', verification.userId);
        return res.status(404).json({
          success: false,
          message: '找不到使用者資訊'
        });
      }
      
      const userData = userDoc.data();
      
      // 檢查是否有 OpenAI API Key
      if (!userData.openaiApiKey) {
        console.log('User has no OpenAI API Key');
        return res.status(400).json({
          success: false,
          message: '請先在個人設定中設定 OpenAI API Key'
        });
      }
      
      // 3. 查詢活動資訊
      const eventDoc = await db.collection('events')
        .doc(verification.eventId)
        .get();
      
      if (!eventDoc.exists) {
        console.log('Event not found:', verification.eventId);
        return res.status(404).json({
          success: false,
          message: '找不到活動資訊'
        });
      }
      
      const event = eventDoc.data();
      
      // 4. 檢查活動是否在有效期間內
      const now = new Date();
      let endDate;
      
      // 處理 Firestore Timestamp
      if (event.endDate && event.endDate.toDate) {
        endDate = event.endDate.toDate();
      } else if (event.endDate) {
        endDate = new Date(event.endDate);
      } else {
        endDate = new Date(); // 預設為今天
      }
      
      if (now > endDate) {
        console.log('Event has ended');
        return res.status(403).json({
          success: false,
          message: '此活動驗證碼已過期'
        });
      }
      
      // 5. 記錄使用日誌（選擇性）
      try {
        await verificationDoc.ref.update({
          lastUsed: admin.firestore.FieldValue.serverTimestamp(),
          usageCount: admin.firestore.FieldValue.increment(1)
        });
      } catch (updateError) {
        console.log('Failed to update usage log:', updateError);
        // 不影響主要功能
      }
      
      // 6. 處理 actualTicketTime
      let actualTicketTime = null;
      if (event.actualTicketTime) {
        if (event.actualTicketTime.toDate) {
          actualTicketTime = event.actualTicketTime.toDate().toISOString();
        } else {
          actualTicketTime = event.actualTicketTime;
        }
      }
      // 使用者偏好設定（如果沒有就用預設值）
      // 將原始欄位轉換為前端期待的格式
      const seatList = verification.seatPreferenceOrder
        ? verification.seatPreferenceOrder.split(',').map(s => s.trim()).filter(s => s)
        : ["自動選擇"];

      const sessionIndex = verification.sessionPreference
        ? parseInt(verification.sessionPreference)
        : 1;

      const ticketCount = verification.ticketCount
        ? parseInt(verification.ticketCount)
        : 1;
      
      // 7. 組合並返回配置
      const configuration = {
        success: true,

        data: {
          // 活動資訊
          event: {
            id: event.id || verification.eventId,
            name: event.name || '未命名活動',
            activityUrl: event.activityUrl || '',
            actualTicketTime: actualTicketTime,
            venue: event.venue || ''
          },
          

          preferences: {
            preferredKeywords: seatList,
            preferredIndex: sessionIndex,
            preferredNumbers: ticketCount
          },

          // OpenAI API Key（簡單 base64 編碼）
          apiKey: Buffer.from(userData.openaiApiKey).toString('base64'),
          
          // 其他資訊
          verificationCode: verificationCode,
          userId: verification.userId,
          serverTime: new Date().toISOString()
        }
      };
      
      console.log('Returning configuration for event:', event.name);
      return res.json(configuration);
      
    } catch (error) {
      console.error('Error in verifyAndFetchConfig:', error);
      return res.status(500).json({
        success: false,
        message: '系統錯誤，請稍後再試',
        error: error.message
      });
    }
  });
});

// 新增：綁定拓元帳號（選擇性功能）
exports.bindTixcraftAccount = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const { verificationCode, tixcraftAccount, deviceId } = req.body;
      
      const db = admin.firestore();
      
      // 查詢驗證碼
      const verificationSnapshot = await db.collection('userEventVerifications')
        .where('verificationCode', '==', verificationCode)
        .limit(1)
        .get();
      
      if (verificationSnapshot.empty) {
        return res.status(404).json({
          success: false,
          message: '無效的驗證碼'
        });
      }
      
      const verificationDoc = verificationSnapshot.docs[0];
      const verification = verificationDoc.data();
      
      // 檢查是否已綁定
      if (verification.binding && verification.binding.tixcraftAccount) {
        if (verification.binding.tixcraftAccount !== tixcraftAccount) {
          return res.status(403).json({
            success: false,
            message: '此驗證碼已綁定其他帳號'
          });
        }
      }
      
      // 更新綁定資訊
      await verificationDoc.ref.update({
        binding: {
          tixcraftAccount: tixcraftAccount,
          deviceId: deviceId,
          bindDate: admin.firestore.FieldValue.serverTimestamp(),
          bindIP: req.ip || 'unknown'
        }
      });
      
      return res.json({
        success: true,
        message: '綁定成功'
      });
      
    } catch (error) {
      console.error('Error in bindTixcraftAccount:', error);
      return res.status(500).json({
        success: false,
        message: '系統錯誤',
        error: error.message
      });
    }
  });
});