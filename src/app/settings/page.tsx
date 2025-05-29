"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";

const API_KEY_STORAGE_KEY = "openai_api_key";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyLoading, setIsKeyLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // 如果使用者登出，清空 API 金鑰
    if (!user && !authLoading) {
      setApiKey("");
      setShowApiKey(false); // 重設顯示狀態
    }
  }, [user, authLoading]);

  useEffect(() => {
    const loadApiKey = async () => {
      setIsKeyLoading(true);
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists() && docSnap.data()?.openaiApiKey) {
            setApiKey(docSnap.data().openaiApiKey);
          } else {
            const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
            if (storedApiKey) {
              setApiKey(storedApiKey);
            }
          }
        } catch (error) {
          console.error("從 Firestore 獲取 API 金鑰時發生錯誤:", error);
          const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
          if (storedApiKey) {
            setApiKey(storedApiKey);
          }
          toast({
            title: "載入 API 金鑰錯誤",
            description: "無法從您的帳戶載入 API 金鑰。請檢查控制台。",
            variant: "destructive",
          });
        }
      } else if (!authLoading) {
        const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (storedApiKey) {
          setApiKey(storedApiKey);
        }
      }
      setIsKeyLoading(false);
    };

    if (!authLoading) {
      loadApiKey();
    }
  }, [user, authLoading, toast]);

  const handleSaveApiKey = async () => {
    setIsLoading(true);

    if (!user) {
      toast({
        title: "驗證錯誤",
        description: "您必須先登入才能將 API 金鑰儲存到您的帳戶。",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "無效的 API 金鑰",
        description: "API 金鑰不能為空。",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { openaiApiKey: apiKey.trim() }, { merge: true });

      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());

      toast({
        title: "API 金鑰已儲存",
        description: "您的 OpenAI API 金鑰已安全地儲存到您的帳戶。",
      });
    } catch (error) {
      console.error("儲存 API 金鑰失敗:", error);
      toast({
        title: "儲存 API 金鑰錯誤",
        description: "無法將 API 金鑰儲存到您的帳戶。請檢查控制台以取得詳細資訊。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>OpenAI API 金鑰</CardTitle>
          <CardDescription>
            管理您的 OpenAI API 金鑰以使用 AI 功能。此金鑰將安全地儲存在您的帳戶中。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">您的 OpenAI API 金鑰</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isKeyLoading || authLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={toggleShowApiKey}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isKeyLoading || authLoading || !user}
                  tabIndex={-1}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {!user 
                  ? "請先登入以管理您的 API 金鑰設定"
                  : "您的 API 金鑰用於與 OpenAI 服務互動，例如進階座位預測等功能。金鑰將被安全地儲存，僅用於此目的。"
                }
              </p>
            </div>
            {authLoading && <p>正在載入驗證詳細資訊...</p>}
            {isKeyLoading && !authLoading && <p>正在載入您的 API 金鑰...</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-2">
          <Button onClick={handleSaveApiKey} disabled={isLoading || isKeyLoading || authLoading || !user}>
            {isLoading ? "儲存中..." : "儲存 API 金鑰"}
          </Button>
          {!user && !authLoading && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md w-full">
              <p className="text-sm text-blue-800">
                💡 請先登入您的帳戶以儲存和管理 API 金鑰設定
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}