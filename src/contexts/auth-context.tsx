"use client";

import type { User } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth as firebaseAuth, db, getCurrentUserIdToken, getAuthHeader, cloudFunctions } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  loyaltyPoints: number;
  idToken: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserLoyaltyPoints: (pointsToAdd: number) => Promise<void>;
  refreshIdToken: () => Promise<string | null>;
  getAuthenticatedHeaders: () => Promise<{ Authorization: string } | null>;
  // Cloud Functions 快捷方法
  callAuthenticatedFunction: <T = any>(functionName: string, data?: any, method?: 'POST' | 'GET') => Promise<T>;
  uploadImage: (filename: string, contentType: string, file: string) => Promise<any>;
  verifyAndFetchConfig: (verificationCode: string) => Promise<any>;
  bindTixcraftAccount: (verificationCode: string, tixcraftAccount: string, deviceId?: string) => Promise<any>;
  getUserEventVerifications: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ["2017yehchunting@gmail.com"]; 

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [idToken, setIdToken] = useState<string | null>(null);

  // 刷新 ID Token
  const refreshIdToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getCurrentUserIdToken();
      setIdToken(token);
      return token;
    } catch (error) {
      console.error("Error refreshing ID token:", error);
      setIdToken(null);
      return null;
    }
  }, []);

  // 獲取認證標頭
  const getAuthenticatedHeaders = useCallback(async () => {
    return await getAuthHeader();
  }, []);

  // 通用的 Cloud Functions 呼叫方法
  const callAuthenticatedFunction = useCallback(async <T = any>(
    functionName: string,
    data?: any,
    method: 'POST' | 'GET' = 'POST'
  ): Promise<T> => {
    if (!user) {
      throw new Error('使用者未登入');
    }

    try {
      const authHeader = await getAuthenticatedHeaders();
      if (!authHeader) {
        throw new Error('無法取得認證資訊');
      }

      const baseUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
        `https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net`;
      
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
      
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      toast({
        title: "API 呼叫失敗",
        description: error instanceof Error ? error.message : '發生未知錯誤',
        variant: "destructive"
      });
      throw error;
    }
  }, [user, getAuthenticatedHeaders]);

  // Cloud Functions 快捷方法
  const uploadImage = useCallback(async (filename: string, contentType: string, file: string) => {
    return callAuthenticatedFunction('uploadImage', { filename, contentType, file });
  }, [callAuthenticatedFunction]);

  const verifyAndFetchConfig = useCallback(async (verificationCode: string) => {
    return callAuthenticatedFunction('verifyAndFetchConfig', { verificationCode });
  }, [callAuthenticatedFunction]);

  const bindTixcraftAccount = useCallback(async (verificationCode: string, tixcraftAccount: string, deviceId?: string) => {
    return callAuthenticatedFunction('bindTixcraftAccount', { verificationCode, tixcraftAccount, deviceId });
  }, [callAuthenticatedFunction]);

  const getUserEventVerifications = useCallback(async () => {
    return callAuthenticatedFunction('getUserEventVerifications', null, 'GET');
  }, [callAuthenticatedFunction]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && currentUser.email) {
        // 設定管理員權限
        const isAdminByKeyword = currentUser.email.toLowerCase().includes("admin");
        const isAdminBySpecificList = ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
        setIsAdmin(isAdminByKeyword || isAdminBySpecificList);

        // 獲取並設定 ID Token
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
        } catch (error) {
          console.error("Error getting ID token:", error);
          setIdToken(null);
        }

        // 獲取或初始化忠誠度點數
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            
            // 設定忠誠度點數
            if (userData.loyaltyPoints !== undefined) {
              setLoyaltyPoints(userData.loyaltyPoints);
            } else {
              // 忠誠度點數欄位不存在，初始化為 0
              await setDoc(userDocRef, { loyaltyPoints: 0 }, { merge: true });
              setLoyaltyPoints(0);
            }

            // 如果使用者文件中沒有基本資訊，補充完整
            const updateData: any = {};
            if (!userData.email && currentUser.email) {
              updateData.email = currentUser.email;
            }
            if (!userData.displayName && currentUser.displayName) {
              updateData.displayName = currentUser.displayName;
            }
            if (!userData.photoURL && currentUser.photoURL) {
              updateData.photoURL = currentUser.photoURL;
            }
            if (!userData.lastLogin) {
              updateData.lastLogin = new Date().toISOString();
            }
            
            // 如果有需要更新的資料，進行更新
            if (Object.keys(updateData).length > 0) {
              await setDoc(userDocRef, updateData, { merge: true });
            }
          } else {
            // 使用者文件不存在，建立新文件
            const newUserData = {
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              loyaltyPoints: 0,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              isAdmin: isAdminByKeyword || isAdminBySpecificList
            };
            
            await setDoc(userDocRef, newUserData);
            setLoyaltyPoints(0);
          }
        } catch (error) {
          console.error("Error fetching/setting user data:", error);
          toast({ 
            title: "錯誤", 
            description: "無法載入使用者資料", 
            variant: "destructive"
          });
          setLoyaltyPoints(0);
        }
      } else {
        // 使用者未登入，重置所有狀態
        setIsAdmin(false);
        setLoyaltyPoints(0);
        setIdToken(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 定期刷新 ID Token（每 50 分鐘）
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      await refreshIdToken();
    }, 50 * 60 * 1000); // 50 分鐘

    return () => clearInterval(refreshInterval);
  }, [user, refreshIdToken]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    
    // 設定額外的權限範圍（如果需要）
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
      setLoading(true);
      const result = await signInWithPopup(firebaseAuth, provider);
      
      // 登入成功後的額外處理
      if (result.user) {
        toast({
          title: "登入成功",
          description: `歡迎回來，${result.user.displayName || result.user.email}！`,
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error("Error during Google Sign-In:", error);
      
      // 處理特定的登入錯誤
      let errorMessage = "登入時發生錯誤";
      if (error.code === 'auth/popup-blocked') {
        errorMessage = "彈出視窗被封鎖，請允許彈出視窗後重試";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "登入程序被使用者取消";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "網路連線失敗，請檢查網路狀態";
      }
      
      toast({
        title: "登入失敗",
        description: errorMessage,
        variant: "destructive"
      });
      
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(firebaseAuth);
      
      toast({
        title: "登出成功",
        description: "您已成功登出",
        variant: "default"
      });
    } catch (error) {
      console.error("Error during Sign-Out:", error);
      toast({
        title: "登出失敗",
        description: "登出時發生錯誤",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const updateUserLoyaltyPoints = async (pointsToAdd: number) => {
    if (!user) {
      toast({ 
        title: "錯誤", 
        description: "您必須先登入才能更新點數", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const newTotalPoints = loyaltyPoints + pointsToAdd;
      const userDocRef = doc(db, "users", user.uid);
      
      await setDoc(userDocRef, { 
        loyaltyPoints: newTotalPoints,
        lastPointsUpdate: new Date().toISOString()
      }, { merge: true });
      
      setLoyaltyPoints(newTotalPoints);
      
      toast({
        title: "點數更新成功",
        description: `您的忠誠度點數已更新為 ${newTotalPoints} 點`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error updating loyalty points in Firestore:", error);
      toast({ 
        title: "錯誤", 
        description: "無法更新您的忠誠度點數", 
        variant: "destructive" 
      });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    loyaltyPoints,
    idToken,
    loginWithGoogle,
    logout,
    updateUserLoyaltyPoints,
    refreshIdToken,
    getAuthenticatedHeaders,
    callAuthenticatedFunction,
    uploadImage,
    verifyAndFetchConfig,
    bindTixcraftAccount,
    getUserEventVerifications
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}