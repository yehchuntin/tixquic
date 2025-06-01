import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, User } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// // 驗證必要的環境變數
// const requiredEnvVars = [
//   'NEXT_PUBLIC_FIREBASE_API_KEY',
//   'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
//   'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
//   'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
//   'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
//   'NEXT_PUBLIC_FIREBASE_APP_ID'
// ];

// const missingEnvVars = requiredEnvVars.filter(
//   envVar => !process.env[envVar]
// );

// if (missingEnvVars.length > 0) {
//   throw new Error(
//     `Missing required Firebase environment variables: ${missingEnvVars.join(', ')}`
//   );
// }

// Firebase App 初始化
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Firebase 服務初始化
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

import { setPersistence, browserLocalPersistence } from "firebase/auth";


// 🔐 確保登入狀態能跨頁維持
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("❌ 設定登入持久性失敗:", error);
});


// 輔助函數：獲取當前使用者的 ID Token
export const getCurrentUserIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  
  try {
    const idToken = await user.getIdToken();
    return idToken;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

// 輔助函數：獲取認證標頭
export const getAuthHeader = async (): Promise<{ Authorization: string } | null> => {
  const idToken = await getCurrentUserIdToken();
  if (!idToken) {
    return null;
  }
  
  return {
    Authorization: `Bearer ${idToken}`
  };
};

// 輔助函數：檢查使用者是否已登入
export const isUserLoggedIn = (): boolean => {
  return !!auth.currentUser;
};

// 輔助函數：等待身份驗證狀態載入完成
export const waitForAuthReady = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// 輔助函數：呼叫 Cloud Functions 的統一方法
export const callCloudFunction = async (
  functionName: string,
  data: any,
  method: 'POST' | 'GET' = 'POST'
): Promise<any> => {
  const authHeader = await getAuthHeader();
  
  if (!authHeader) {
    throw new Error('User not authenticated');
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
    `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net`;
  
  const url = `${baseUrl}/${functionName}`;
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
  };
  
  if (method === 'POST' && data) {
    requestOptions.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
};

// 專門的 Cloud Functions 呼叫方法
export const cloudFunctions = {
  // 上傳圖片
  uploadImage: async (filename: string, contentType: string, file: string) => {
    return callCloudFunction('uploadImage', {
      filename,
      contentType,
      file
    });
  },
  
  // 驗證並獲取配置
  verifyAndFetchConfig: async (verificationCode: string) => {
    return callCloudFunction('verifyAndFetchConfig', {
      verificationCode
    });
  },
  
  // 綁定拓元帳號
  bindTixcraftAccount: async (verificationCode: string, tixcraftAccount: string, deviceId?: string) => {
    return callCloudFunction('bindTixcraftAccount', {
      verificationCode,
      tixcraftAccount,
      deviceId
    });
  },
  
  // 獲取使用者活動驗證碼列表
  getUserEventVerifications: async () => {
    return callCloudFunction('getUserEventVerifications', null, 'GET');
  }
};

// 導出基本服務
export { app, auth, db, storage };

// 導出類型（供其他檔案使用）
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, User };