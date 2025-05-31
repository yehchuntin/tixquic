const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { Storage } = require('@google-cloud/storage');

// 檢查是否已經初始化，避免重複初始化
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");

// ✅ 統一的回應格式輔助函數
function sendResponse(res, statusCode, data, message = null) {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    ...(message && { message }),
    ...(data && { data })
  };
  return res.status(statusCode).json(response);
}

// ✅ 統一的錯誤處理輔助函數
function handleError(res, error, defaultMessage = '系統錯誤') {
  console.error('Function error:', error);
  const statusCode = error.statusCode || 500;
  const message = error.message || defaultMessage;
  return sendResponse(res, statusCode, null, message);
}

// ✅ 生成設備指紋的輔助函數
function generateDeviceFingerprint(req) {
  const userAgent = req.get('User-Agent') || '';
  const acceptLanguage = req.get('Accept-Language') || '';
  const ip = req.ip || req.connection.remoteAddress || '';
  
  const fingerprint = Buffer.from(`${userAgent}-${acceptLanguage}-${ip}`).toString('base64').slice(0, 32);
  return fingerprint;
}

// ✅ 統一的身份驗證輔助函數
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

// ✅ 統一的請求驗證輔助函數
function validateRequestMethod(req, allowedMethods) {
  if (!allowedMethods.includes(req.method)) {
    throw new Error(`Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`);
  }
}

// ✅ 檢查設備綁定策略的函數
function checkDeviceBindingPolicy(verification, clientDeviceId, userDoc) {
  const userData = userDoc.data();
  const currentUsageCount = verification.usageCount || 0;
  const boundDevice = verification.boundDevice;
  
  // 1. 檢查使用者的綁定偏好設定
  const userBindingPolicy = userData.deviceBindingPolicy || 'strict';
  
  // 2. 檢查驗證碼的特殊設定
  const codeBindingPolicy = verification.bindingPolicy || userBindingPolicy;
  
  switch (codeBindingPolicy) {
    case 'strict':
      // 嚴格模式：一個驗證碼只能在一台設備使用
      if (currentUsageCount > 0 && boundDevice && boundDevice !== clientDeviceId) {
        return {
          allowed: false,
          reason: 'strict_binding',
          message: '此驗證碼已在其他設備上使用（嚴格模式）'
        };
      }
      break;
      
    case 'flexible':
      // 彈性模式：允許最多2台設備，但有時間限制
      if (boundDevice && boundDevice !== clientDeviceId) {
        const lastUsed = verification.lastUsed;
        const now = new Date();
        
        // 如果上次使用超過30分鐘，允許在新設備使用
        if (lastUsed && lastUsed.toDate) {
          const timeDiff = now - lastUsed.toDate();
          const minutesDiff = timeDiff / (1000 * 60);
          
          if (minutesDiff < 30) {
            return {
              allowed: false,
              reason: 'time_restriction',
              message: `請等待 ${Math.ceil(30 - minutesDiff)} 分鐘後再在新設備使用`
            };
          }
        }
        
        // 檢查設備數量限制
        const deviceHistory = verification.deviceHistory || [];
        const uniqueDevices = [...new Set([...deviceHistory, clientDeviceId])];
        
        if (uniqueDevices.length > 2) {
          return {
            allowed: false,
            reason: 'device_limit',
            message: '此驗證碼已在超過2台設備上使用'
          };
        }
      }
      break;
      
    case 'unlimited':
      // 無限制模式：可在任意設備使用（但仍有使用次數限制）
      const maxUsageCount = verification.maxUsageCount || 3;
      if (currentUsageCount >= maxUsageCount) {
        return {
          allowed: false,
          reason: 'usage_limit',
          message: `此驗證碼已達到最大使用次數 (${maxUsageCount})`
        };
      }
      break;
      
    default:
      return {
        allowed: false,
        reason: 'unknown_policy',
        message: '未知的綁定策略'
      };
  }
  
  return { allowed: true };
}

// ✅ 輔助函數：根據綁定失敗原因提供建議
function getSuggestions(reason) {
  switch (reason) {
    case 'strict_binding':
      return [
        '請在原設備上使用此驗證碼',
        '或聯繫客服更改為彈性模式'
      ];
      
    case 'time_restriction':
      return [
        '等待30分鐘後重試',
        '或在原設備上先結束使用'
      ];
      
    case 'device_limit':
      return [
        '此驗證碼已在過多設備使用',
        '請聯繫客服重置設備綁定'
      ];
      
    case 'usage_limit':
      return [
        '此驗證碼使用次數已達上限',
        '請購買新的驗證碼'
      ];
      
    default:
      return ['請聯繫客服協助'];
  }
}

// 🔧 修正：驗證碼驗證並獲取配置（無需 Firebase Auth）
exports.verifyAndFetchConfig = onRequest(
  { 
    cors: true,
    region: 'us-central1'
  },
  async (req, res) => {
    // 手動處理 CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    try {
      console.log('Request method:', req.method);
      console.log('Request body:', req.body);
      
      // 驗證請求方法
      if (req.method !== 'POST') {
        const error = new Error(`方法 ${req.method} 不被允許`);
        error.statusCode = 405;
        throw error;
      }
      
      // 驗證必要參數
      const { verificationCode, deviceFingerprint, forceUnbind } = req.body;
      if (!verificationCode) {
        const error = new Error('請提供驗證碼');
        error.statusCode = 400;
        throw error;
      }
      
      console.log('Verifying code:', verificationCode);
      
      // 生成或使用提供的設備指紋
      const clientDeviceId = deviceFingerprint || generateDeviceFingerprint(req);
      console.log('Device fingerprint:', clientDeviceId);
      
      // 1. 查詢驗證碼
      const verificationSnapshot = await db.collection('userEventVerifications')
        .where('verificationCode', '==', verificationCode)
        .limit(1)
        .get();
      
      if (verificationSnapshot.empty) {
        console.log('Verification code not found:', verificationCode);
        const error = new Error('無效的驗證碼');
        error.statusCode = 404;
        throw error;
      }
      
      const verificationDoc = verificationSnapshot.docs[0];
      const verification = verificationDoc.data();
      
      console.log('Found verification for user:', verification.userId);
      
      // 2. 查詢使用者資訊
      const userDoc = await db.collection('users')
        .doc(verification.userId)
        .get();
      
      if (!userDoc.exists) {
        const error = new Error('找不到使用者資訊');
        error.statusCode = 404;
        throw error;
      }
      
      // 3. ✨ 檢查設備綁定策略
      const bindingCheck = checkDeviceBindingPolicy(verification, clientDeviceId, userDoc);
      
      if (!bindingCheck.allowed) {
        // 如果是彈性模式且要求強制解綁
        if (forceUnbind && verification.bindingPolicy === 'flexible') {
          console.log('Force unbinding requested');
          
          // 解綁並重新綁定到當前設備
          await verificationDoc.ref.update({
            boundDevice: clientDeviceId,
            boundAt: admin.firestore.FieldValue.serverTimestamp(),
            boundIP: req.ip || 'unknown',
            deviceHistory: admin.firestore.FieldValue.arrayUnion(clientDeviceId),
            forceUnbindCount: admin.firestore.FieldValue.increment(1)
          });
          
        } else {
          // 返回綁定策略建議
          const error = new Error(bindingCheck.message);
          error.statusCode = 403;
          error.bindingInfo = {
            reason: bindingCheck.reason,
            currentPolicy: verification.bindingPolicy || 'strict',
            canForceUnbind: verification.bindingPolicy === 'flexible',
            suggestions: getSuggestions(bindingCheck.reason)
          };
          throw error;
        }
      }
      
      // 4. 繼續原有的驗證流程
      const userData = userDoc.data();
      
      // 檢查是否有 OpenAI API Key
      if (!userData.openaiApiKey) {
        console.log('User has no OpenAI API Key');
        const error = new Error('使用者未設定 OpenAI API Key');
        error.statusCode = 400;
        throw error;
      }
      
      // 5. 查詢活動資訊
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
      
      // 6. 檢查活動是否在有效期間內
      const now = new Date();
      let endDate;
      
      if (event.endDate && event.endDate.toDate) {
        endDate = event.endDate.toDate();
      } else if (event.endDate) {
        endDate = new Date(event.endDate);
      } else {
        endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      
      if (now > endDate) {
        console.log('Event has ended');
        const error = new Error('此活動驗證碼已過期');
        error.statusCode = 403;
        throw error;
      }
      
      // 7. 更新設備綁定資訊
      const updateData = {
        boundDevice: clientDeviceId,
        boundAt: admin.firestore.FieldValue.serverTimestamp(),
        boundIP: req.ip || 'unknown',
        deviceHistory: admin.firestore.FieldValue.arrayUnion(clientDeviceId)
      };
      
      await verificationDoc.ref.update(updateData);
      
      // 8. 處理活動時間
      let actualTicketTime = null;
      if (event.actualTicketTime) {
        if (event.actualTicketTime.toDate) {
          actualTicketTime = event.actualTicketTime.toDate().toISOString();
        } else {
          actualTicketTime = event.actualTicketTime;
        }
      }
      
      // 9. 處理偏好設定
      const seatList = verification.seatPreferenceOrder
        ? verification.seatPreferenceOrder.split(',').map(s => s.trim()).filter(s => s)
        : ["自動選擇"];

      const sessionIndex = verification.sessionPreference
        ? parseInt(verification.sessionPreference)
        : 1;

      const ticketCount = verification.ticketCount
        ? parseInt(verification.ticketCount)
        : 1;
      
      // 10. 組合並返回配置
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
          preferredNumbers: ticketCount,
          stopRefreshBefore: 3,
          captchaRetryLimit: 10
        },

        // OpenAI API Key（base64 編碼）
        apiKey: Buffer.from(userData.openaiApiKey).toString('base64'),
        
        // 新增：綁定策略資訊
        bindingInfo: {
          policy: verification.bindingPolicy || 'strict',
          deviceId: clientDeviceId,
          isNewDevice: !verification.boundDevice || verification.boundDevice !== clientDeviceId,
          deviceHistory: verification.deviceHistory || []
        },
        
        // 其他資訊
        verificationCode: verificationCode,
        userId: verification.userId,
        serverTime: new Date().toISOString()
      };
      
      console.log('Returning configuration for event:', event.name);
      return sendResponse(res, 200, configData, '配置獲取成功');
      
    } catch (error) {
      // 如果錯誤包含綁定資訊，一併返回
      if (error.bindingInfo) {
        return res.status(error.statusCode || 403).json({
          success: false,
          message: error.message,
          bindingInfo: error.bindingInfo
        });
      }
      
      return handleError(res, error, '配置獲取失敗');
    }
  }
);

// 🔧 標記驗證碼為已使用
exports.markCodeAsUsed = onRequest(
  { 
    cors: true,
    region: 'us-central1'
  },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    try {
      if (req.method !== 'POST') {
        const error = new Error(`方法 ${req.method} 不被允許`);
        error.statusCode = 405;
        throw error;
      }
      
      const { verificationCode, deviceFingerprint, status, details } = req.body;
      if (!verificationCode) {
        const error = new Error('請提供驗證碼');
        error.statusCode = 400;
        throw error;
      }
      
      const clientDeviceId = deviceFingerprint || generateDeviceFingerprint(req);
      
      // 查詢驗證碼
      const verificationSnapshot = await db.collection('userEventVerifications')
        .where('verificationCode', '==', verificationCode)
        .limit(1)
        .get();
      
      if (verificationSnapshot.empty) {
        const error = new Error('無效的驗證碼');
        error.statusCode = 404;
        throw error;
      }
      
      const verificationDoc = verificationSnapshot.docs[0];
      const verification = verificationDoc.data();
      
      // 檢查設備權限
      if (verification.boundDevice && verification.boundDevice !== clientDeviceId) {
        const error = new Error('無權限操作此驗證碼');
        error.statusCode = 403;
        throw error;
      }
      
      // 更新使用狀態
      const updateData = {
        usageCount: admin.firestore.FieldValue.increment(1),
        lastUsed: admin.firestore.FieldValue.serverTimestamp(),
        lastUsedDevice: clientDeviceId
      };
      
      if (status) {
        updateData.lastStatus = status;
      }
      
      if (details) {
        updateData.lastDetails = details;
      }
      
      await verificationDoc.ref.update(updateData);
      
      return sendResponse(res, 200, {
        usageCount: (verification.usageCount || 0) + 1,
        markedAt: new Date().toISOString()
      }, '使用狀態更新成功');
      
    } catch (error) {
      return handleError(res, error, '狀態更新失敗');
    }
  }
);

// ✅ 保留原有的 sitemap 和其他函數
exports.generateSitemap = onDocumentWritten(
  {
    document: "events/{eventId}",
    region: "us-central1",
  },
  async (event) => {
    const snapshot = await db.collection("events").get();
    const now = new Date();
    const urls = [
      "https://www.tixquic.com/",
      "https://www.tixquic.com/how-to-use",
      "https://www.tixquic.com/download",
      "https://www.tixquic.com/settings",
      "https://www.tixquic.com/events"
    ];

    snapshot.forEach(doc => {
      const data = doc.data();
      const endDate = data.endDate?.toDate?.() || new Date(0);
      if (endDate > now) {
        urls.push(`https://www.tixquic.com/event/${doc.id}`);
      }
    });

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(url => `  <url><loc>${url}</loc></url>`).join("\n") +
      "\n</urlset>";

    const bucket = admin.storage().bucket();
    const file = bucket.file("sitemaps/sitemap.xml");

    await file.save(sitemapContent, {
      metadata: { contentType: "application/xml" },
      public: true,
    });

    console.log("✅ Sitemap updated:", urls.length, "URLs");
  }
);

exports.refreshSitemapDaily = onSchedule(
  {
    schedule: "every 24 hours",
    region: "us-central1",
    timeZone: "Asia/Taipei",
  },
  async () => {
    const snapshot = await db.collection("events").get();
    const now = new Date();

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
    
    const sitemapContent =
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(url =>
        `  <url>\n    <loc>${url.loc}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n  </url>`
      ).join("\n") +
      `\n</urlset>`;
    
    const bucket = admin.storage().bucket();
    const file = bucket.file("sitemaps/sitemap.xml");

    await file.save(sitemapContent, {
      metadata: { contentType: "application/xml" },
      public: true,
    });

    console.log("✅ Daily sitemap refreshed:", urls.length, "URLs");
  }
);

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
});

// ✅ 統一的回應格式輔助函數
function sendResponse(res, statusCode, data, message = null) {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    ...(message && { message }),
    ...(data && { data })
  };
  return res.status(statusCode).json(response);
}

// ✅ 統一的錯誤處理輔助函數
function handleError(res, error, defaultMessage = '系統錯誤') {
  console.error('Function error:', error);
  const statusCode = error.statusCode || 500;
  const message = error.message || defaultMessage;
  return sendResponse(res, statusCode, null, message);
}

// ✅ 生成設備指紋的輔助函數
function generateDeviceFingerprint(req) {
  const userAgent = req.get('User-Agent') || '';
  const acceptLanguage = req.get('Accept-Language') || '';
  const ip = req.ip || req.connection.remoteAddress || '';
  
  const fingerprint = Buffer.from(`${userAgent}-${acceptLanguage}-${ip}`).toString('base64').slice(0, 32);
  return fingerprint;
}

// ✅ 統一的身份驗證輔助函數
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

// ✅ 統一的請求驗證輔助函數
function validateRequestMethod(req, allowedMethods) {
  if (!allowedMethods.includes(req.method)) {
    throw new Error(`Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`);
  }
}

// ✅ 檢查設備綁定策略的函數
function checkDeviceBindingPolicy(verification, clientDeviceId, userDoc) {
  const userData = userDoc.data();
  const currentUsageCount = verification.usageCount || 0;
  const boundDevice = verification.boundDevice;
  
  // 1. 檢查使用者的綁定偏好設定
  const userBindingPolicy = userData.deviceBindingPolicy || 'strict';
  
  // 2. 檢查驗證碼的特殊設定
  const codeBindingPolicy = verification.bindingPolicy || userBindingPolicy;
  
  switch (codeBindingPolicy) {
    case 'strict':
      // 嚴格模式：一個驗證碼只能在一台設備使用
      if (currentUsageCount > 0 && boundDevice && boundDevice !== clientDeviceId) {
        return {
          allowed: false,
          reason: 'strict_binding',
          message: '此驗證碼已在其他設備上使用（嚴格模式）'
        };
      }
      break;
      
    case 'flexible':
      // 彈性模式：允許最多2台設備，但有時間限制
      if (boundDevice && boundDevice !== clientDeviceId) {
        const lastUsed = verification.lastUsed;
        const now = new Date();
        
        // 如果上次使用超過30分鐘，允許在新設備使用
        if (lastUsed && lastUsed.toDate) {
          const timeDiff = now - lastUsed.toDate();
          const minutesDiff = timeDiff / (1000 * 60);
          
          if (minutesDiff < 30) {
            return {
              allowed: false,
              reason: 'time_restriction',
              message: `請等待 ${Math.ceil(30 - minutesDiff)} 分鐘後再在新設備使用`
            };
          }
        }
        
        // 檢查設備數量限制
        const deviceHistory = verification.deviceHistory || [];
        const uniqueDevices = [...new Set([...deviceHistory, clientDeviceId])];
        
        if (uniqueDevices.length > 2) {
          return {
            allowed: false,
            reason: 'device_limit',
            message: '此驗證碼已在超過2台設備上使用'
          };
        }
      }
      break;
      
    case 'unlimited':
      // 無限制模式：可在任意設備使用（但仍有使用次數限制）
      const maxUsageCount = verification.maxUsageCount || 3;
      if (currentUsageCount >= maxUsageCount) {
        return {
          allowed: false,
          reason: 'usage_limit',
          message: `此驗證碼已達到最大使用次數 (${maxUsageCount})`
        };
      }
      break;
      
    default:
      return {
        allowed: false,
        reason: 'unknown_policy',
        message: '未知的綁定策略'
      };
  }
  
  return { allowed: true };
}

// ✅ 輔助函數：根據綁定失敗原因提供建議
function getSuggestions(reason) {
  switch (reason) {
    case 'strict_binding':
      return [
        '請在原設備上使用此驗證碼',
        '或聯繫客服更改為彈性模式'
      ];
      
    case 'time_restriction':
      return [
        '等待30分鐘後重試',
        '或在原設備上先結束使用'
      ];
      
    case 'device_limit':
      return [
        '此驗證碼已在過多設備使用',
        '請聯繫客服重置設備綁定'
      ];
      
    case 'usage_limit':
      return [
        '此驗證碼使用次數已達上限',
        '請購買新的驗證碼'
      ];
      
    default:
      return ['請聯繫客服協助'];
  }
}

// 1. 圖片上傳函數
exports.uploadImage = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      validateRequestMethod(req, ['POST']);
      
      const decodedToken = await verifyAuthToken(req.headers.authorization);
      
      const { filename, contentType, file } = req.body;
      if (!filename || !contentType || !file) {
        const error = new Error('缺少必要參數：filename, contentType, file');
        error.statusCode = 400;
        throw error;
      }
      
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

// 2. 綁定拓元帳號
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

// 3. 原本的驗證碼驗證函數（需要 Firebase Auth）
exports.verifyAndFetchConfigWithAuth = functions.https.onRequest((req, res) => {
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

// 4. 取得使用者的活動列表
exports.getUserEventVerifications = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // 驗證請求方法
      validateRequestMethod(req, ['GET']);
      
      // 驗證身份
      const decodedToken = await verifyAuthToken(req.headers.authorization);
      
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