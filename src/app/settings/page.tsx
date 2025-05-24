"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase"; // Correctly import the initialized db instance
import { doc, setDoc, getDoc } from "firebase/firestore"; // Removed getFirestore

const API_KEY_STORAGE_KEY = "openai_api_key";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyLoading, setIsKeyLoading] = useState(true);

  useEffect(() => {
    const loadApiKey = async () => {
      setIsKeyLoading(true);
      if (user) {
        try {
          // const db = getFirestore(firebaseApp); // Removed this line, use imported 'db'
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
          console.error("Error fetching API key from Firestore:", error);
          const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
          if (storedApiKey) {
            setApiKey(storedApiKey);
          }
          toast({
            title: "Error Loading API Key",
            description: "Could not load API key from your account. Please check console.",
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
        title: "Authentication Error",
        description: "You must be logged in to save an API key to your account.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "Invalid API Key",
        description: "API Key cannot be empty.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // const db = getFirestore(firebaseApp); // Removed this line, use imported 'db'
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { openaiApiKey: apiKey.trim() }, { merge: true });

      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());

      toast({
        title: "API Key Saved",
        description: "Your OpenAI API Key has been securely saved to your account.",
      });
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast({
        title: "Error Saving API Key",
        description: "Could not save API key to your account. Please check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>OpenAI API Key</CardTitle>
          <CardDescription>
            Manage your OpenAI API Key for AI-powered features. This key will be securely stored
            with your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Your OpenAI API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isKeyLoading || authLoading}
              />
              <p className="text-sm text-muted-foreground">
                Your API key is used to interact with OpenAI services for features like advanced seat prediction.
                It is stored securely and only used for this purpose.
              </p>
            </div>
            {authLoading && <p>Loading authentication details...</p>}
            {isKeyLoading && !authLoading && <p>Loading your API key...</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveApiKey} disabled={isLoading || isKeyLoading || authLoading || !user}>
            {isLoading ? "Saving..." : "Save API Key"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
