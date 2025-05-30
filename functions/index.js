const functions = require('firebase-functions');// 匯入 Firebase Functions 的模組
const admin = require('firebase-admin');// 匯入 Firebase Admin SDK
const cors = require('cors')({ origin: true });
const { Storage } = require('@google-cloud/storage');


// 檢查是否已經初始化，避免重複初始化
if (!admin.apps.length) {
  admin.initializeApp();
}
// 匯入 V2 Firestore 與 Scheduler 的觸發方式
const db = admin.firestore();
const { onDocumentWritten } = require("firebase-functions/v2/firestore");

// ✅ 1. generateSitemap（當 Firestore 中的 events 資料變更時，自動更新 sitemap.xml）
exports.generateSitemap = onDocumentWritten(
  {
    document: "events/{eventId}",
    region: "us-central1",
  },
  async (event) => {
    // 取得所有活動
    const snapshot = await db.collection("events").get();
    const now = new Date();
    // 建立固定的靜態頁面 URL
    const urls = [
      "https://www.tixquic.com/",
      "https://www.tixquic.com/how-to-use",
      "https://www.tixquic.com/download",
      "https://www.tixquic.com/settings",
      "https://www.tixquic.com/events"
    ];

    // 加入未過期的活動頁面 URL
    snapshot.forEach(doc => {
      const data = doc.data();
      const endDate = data.endDate?.toDate?.() || new Date(0);
      if (endDate > now) {
        urls.push(`https://www.tixquic.com/event/${doc.id}`);
      }
    });

     // 產生 sitemap.xml 格式內容（無 lastmod）
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(url => `  <url><loc>${url}</loc></url>`).join("\n") +
      "\n</urlset>";

    // 將 sitemap.xml 存入 Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file("sitemaps/sitemap.xml");

    await file.save(sitemapContent, {
      metadata: { contentType: "application/xml" },
      public: true,
    });

    console.log("✅ Sitemap updated:", urls.length, "URLs");
  }
);

const { onSchedule } = require("firebase-functions/v2/scheduler");

// ✅ 2. refreshSitemapDaily（每天自動執行，定時刷新 sitemap.xml，加入 <lastmod>）
exports.refreshSitemapDaily = onSchedule(
  {
    schedule: "every 24 hours",//每一天刷新一次sitemap
    region: "us-central1",
    timeZone: "Asia/Taipei",
  },
  async () => {
    // 取得所有活動
    const snapshot = await db.collection("events").get();
    const now = new Date();

     // 建立包含 lastmod 的靜態頁面
    const urls = [
      {
        loc: "https://www.tixquic.com/",
        lastmod: now.toISOString().split("T")[0]
      },
      {
        loc: "https://www.tixquic.com/events",
        lastmod: now.toISOString().split("T")[0]
      },
      {
        loc: "https://www.tixquic.com/how-to-use",
        lastmod: now.toISOString().split("T")[0]
      },
      {
        loc: "https://www.tixquic.com/download",
        lastmod: now.toISOString().split("T")[0]
      },
      {
        loc: "https://www.tixquic.com/settings",
        lastmod: now.toISOString().split("T")[0]
      },
    ];

    // 加入活動頁面（僅包含未過期活動）
    snapshot.forEach(doc => {
      const data = doc.data();
      const endDate = data.endDate?.toDate?.() || new Date(0);
      if (endDate > now) {
        urls.push({
          loc: `https://www.tixquic.com/event/${doc.id}`,
          lastmod: now.toISOString().split("T")[0]
        });
      }
    });
    
    // 建立 sitemap.xml 內容（包含 lastmod）
    const sitemapContent =
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(url =>
        `  <url>\n    <loc>${url.loc}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n  </url>`
      ).join("\n") +
      `\n</urlset>`;
    
    // 將 sitemap.xml 存入 Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file("sitemaps/sitemap.xml");

    await file.save(sitemapContent, {
      metadata: { contentType: "application/xml" },
      public: true,
    });

    console.log("✅ Daily sitemap refreshed:", urls.length, "URLs");
  }
);


// ✅ 3. serveSitemap（當瀏覽器請求 /sitemap.xml 時，從 Firebase Storage 中讀取並回傳）
exports.serveSitemap = functions.https.onRequest(async (req, res) => {
  const bucket = admin.storage().bucket();
  const file = bucket.file("sitemaps/sitemap.xml");

  try {
    const [contents] = await file.download();
    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(contents.toString());
  } catch (error) {
    console.error("❌ sitemap.xml 讀取失敗", error);
    res.status(404).send("Sitemap not found");
  }

// 統一的身份驗證輔助函數
async function verifyAuthToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
}

// 統一的請求驗證輔助函數
function validateRequestMethod(req, allowedMethods) {
  if (!allowedMethods.includes(req.method)) {
    throw new Error(`Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`);
  }
}

// 統一的回應格式輔助函數
function sendResponse(res, statusCode, data, message = null) {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    ...(message && { message }),
    ...(data && { data })
  };
  return res.status(statusCode).json(response);
}

// 統一的錯誤處理輔助函數
function handleError(res, error, defaultMessage = '系統錯誤') {
  console.error('Function error:', error);
  const statusCode = error.statusCode || 500;
  const message = error.message || defaultMessage;
  return sendResponse(res, statusCode, null, message);
}

// 1. 圖片上傳函數
exports.uploadImage = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // 驗證請求方法
      validateRequestMethod(req, ['POST']);
      
      // 驗證身份
      const decodedToken = await verifyAuthToken(req.headers.authorization);
      
      // 驗證必要參數
      const { filename, contentType, file } = req.body;
      if (!filename || !contentType || !file) {
        const error = new Error('缺少必要參數：filename, contentType, file');
        error.statusCode = 400;
        throw error;
      }
      
      // 上傳圖片
      const bucket = admin.storage().bucket();
      const fileRef = bucket.file(`events/${Date.now()}_${filename}`);
      
      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: contentType,
        },
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (err) => {
          console.error('Upload stream error:', err);
          reject(err);
        });

        stream.on('finish', async () => {
          try {
            const [url] = await fileRef.getSignedUrl({
              action: 'read',
              expires: '03-09-2491',
            });
            resolve(sendResponse(res, 200, { 
              url,
              filename,
              uploadedBy: decodedToken.uid,
              uploadedAt: new Date().toISOString()
            }, '圖片上傳成功'));
          } catch (error) {
            reject(error);
          }
        });

        stream.end(Buffer.from(file, 'base64'));
      });
      
    } catch (error) {
      return handleError(res, error, '圖片上傳失敗');
    }
  });
});

// 2. 驗證碼驗證並獲取配置
exports.verifyAndFetchConfig = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // 驗證請求方法
      validateRequestMethod(req, ['POST']);
      
      // 驗證身份
      const decodedToken = await verifyAuthToken(req.headers.authorization);
      
      // 驗證必要參數
      const { verificationCode } = req.body;
      if (!verificationCode) {
        const error = new Error('請提供驗證碼');
        error.statusCode = 400;
        throw error;
      }
      
      console.log('Verifying code:', verificationCode, 'for user:', decodedToken.uid);
      
      const db = admin.firestore();
      
      // 1. 查詢驗證碼
      const verificationSnapshot = await db.collection('userEventVerifications')
        .where('verificationCode', '==', verificationCode)
        .where('userId', '==', decodedToken.uid) // 額外驗證使用者身份
        .limit(1)
        .get();
      
      if (verificationSnapshot.empty) {
        console.log('Verification code not found or unauthorized:', verificationCode);
        const error = new Error('無效的驗證碼或無權限存取');
        error.statusCode = 404;
        throw error;
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
        const error = new Error('找不到使用者資訊');
        error.statusCode = 404;
        throw error;
      }
      
      const userData = userDoc.data();
      
      // 檢查是否有 OpenAI API Key
      if (!userData.openaiApiKey) {
        console.log('User has no OpenAI API Key');
        const error = new Error('請先在個人設定中設定 OpenAI API Key');
        error.statusCode = 400;
        throw error;
      }
      
      // 3. 查詢活動資訊
      const eventDoc = await db.collection('events')
        .doc(verification.eventId)
        .get();
      
      if (!eventDoc.exists) {
        console.log('Event not found:', verification.eventId);
        const error = new Error('找不到活動資訊');
        error.statusCode = 404;
        throw error;
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
        const error = new Error('此活動驗證碼已過期');
        error.statusCode = 403;
        throw error;
      }
      
      // 5. 記錄使用日誌
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
      const configData = {
        // 活動資訊
        event: {
          id: event.id || verification.eventId,
          name: event.name || '未命名活動',
          activityUrl: event.activityUrl || '',
          actualTicketTime: actualTicketTime,
          venue: event.venue || ''
        },
        
        // 使用者偏好設定
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
      };
      
      console.log('Returning configuration for event:', event.name);
      return sendResponse(res, 200, configData, '配置獲取成功');
      
    } catch (error) {
      return handleError(res, error, '配置獲取失敗');
    }
  });
});

// 3. 綁定拓元帳號
exports.bindTixcraftAccount = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // 驗證請求方法
      validateRequestMethod(req, ['POST']);
      
      // 驗證身份
      const decodedToken = await verifyAuthToken(req.headers.authorization);
      
      // 驗證必要參數
      const { verificationCode, tixcraftAccount, deviceId } = req.body;
      if (!verificationCode || !tixcraftAccount) {
        const error = new Error('請提供驗證碼和拓元帳號');
        error.statusCode = 400;
        throw error;
      }
      
      const db = admin.firestore();
      
      // 查詢驗證碼
      const verificationSnapshot = await db.collection('userEventVerifications')
        .where('verificationCode', '==', verificationCode)
        .where('userId', '==', decodedToken.uid) // 額外驗證使用者身份
        .limit(1)
        .get();
      
      if (verificationSnapshot.empty) {
        const error = new Error('無效的驗證碼或無權限存取');
        error.statusCode = 404;
        throw error;
      }
      
      const verificationDoc = verificationSnapshot.docs[0];
      const verification = verificationDoc.data();
      
      // 檢查是否已綁定
      if (verification.binding && verification.binding.tixcraftAccount) {
        if (verification.binding.tixcraftAccount !== tixcraftAccount) {
          const error = new Error('此驗證碼已綁定其他帳號');
          error.statusCode = 403;
          throw error;
        }
        
        // 如果綁定相同帳號，返回成功但不重複綁定
        return sendResponse(res, 200, {
          alreadyBound: true,
          boundAccount: verification.binding.tixcraftAccount
        }, '帳號已綁定');
      }
      
      // 更新綁定資訊
      await verificationDoc.ref.update({
        binding: {
          tixcraftAccount: tixcraftAccount,
          deviceId: deviceId || null,
          bindDate: admin.firestore.FieldValue.serverTimestamp(),
          bindIP: req.ip || 'unknown',
          boundBy: decodedToken.uid
        }
      });
      
      return sendResponse(res, 200, {
        boundAccount: tixcraftAccount,
        deviceId: deviceId,
        bindDate: new Date().toISOString()
      }, '綁定成功');
      
    } catch (error) {
      return handleError(res, error, '綁定失敗');
    }
  });
});

// 4. 新增：取得使用者的活動列表
exports.getUserEventVerifications = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // 驗證請求方法
      validateRequestMethod(req, ['GET']);
      
      // 驗證身份
      const decodedToken = await verifyAuthToken(req.headers.authorization);
      
      const db = admin.firestore();
      
      // 查詢使用者的驗證碼列表
      const verificationsSnapshot = await db.collection('userEventVerifications')
        .where('userId', '==', decodedToken.uid)
        .orderBy('createdAt', 'desc')
        .get();
      
      const verifications = [];
      
      for (const doc of verificationsSnapshot.docs) {
        const verification = doc.data();
        
        // 獲取活動資訊
        try {
          const eventDoc = await db.collection('events')
            .doc(verification.eventId)
            .get();
          
          const event = eventDoc.exists ? eventDoc.data() : null;
          
          verifications.push({
            id: doc.id,
            verificationCode: verification.verificationCode,
            eventId: verification.eventId,
            event: event ? {
              name: event.name,
              venue: event.venue,
              endDate: event.endDate?.toDate?.()?.toISOString() || event.endDate
            } : null,
            preferences: {
              seatPreferenceOrder: verification.seatPreferenceOrder,
              sessionPreference: verification.sessionPreference,
              ticketCount: verification.ticketCount
            },
            binding: verification.binding || null,
            usageCount: verification.usageCount || 0,
            lastUsed: verification.lastUsed?.toDate?.()?.toISOString() || verification.lastUsed,
            createdAt: verification.createdAt?.toDate?.()?.toISOString() || verification.createdAt
          });
        } catch (eventError) {
          console.log('Error fetching event for verification:', doc.id, eventError);
          // 即使活動資訊獲取失敗，也保留驗證碼記錄
          verifications.push({
            id: doc.id,
            verificationCode: verification.verificationCode,
            eventId: verification.eventId,
            event: null,
            preferences: {
              seatPreferenceOrder: verification.seatPreferenceOrder,
              sessionPreference: verification.sessionPreference,
              ticketCount: verification.ticketCount
            },
            binding: verification.binding || null,
            usageCount: verification.usageCount || 0,
            lastUsed: verification.lastUsed?.toDate?.()?.toISOString() || verification.lastUsed,
            createdAt: verification.createdAt?.toDate?.()?.toISOString() || verification.createdAt
          });
        }
      }
      
      return sendResponse(res, 200, {
        verifications,
        totalCount: verifications.length
      }, '活動列表獲取成功');
      
    } catch (error) {
      return handleError(res, error, '活動列表獲取失敗');
    }
  });
});



});

