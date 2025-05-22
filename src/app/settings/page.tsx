
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_KEY_STORAGE_KEY = "ticketSwiftOpenAiApiKey";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    setIsLoading(true);
    // Simulate saving the API key
    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      toast({
        title: "API Key Saved (Simulated)",
        description: "Your OpenAI API Key has been saved to local storage for this session.",
      });
    } catch (error) {
      console.error("Failed to save API key to local storage:", error);
      toast({
        title: "Error Saving API Key",
        description: "Could not save API key. Please check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <KeyRound className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <CardDescription className="text-lg mb-6">
        Manage your application settings here.
      </CardDescription>

      <Card className="w-full max-w-lg mx-auto shadow-xl">
        <CardHeader>
          <CardTitle>OpenAI API Key Management</CardTitle>
          <CardDescription>
            Your OpenAI API Key is used for AI-powered features like seat prediction. 
            This key is saved in your browser's local storage for prototype purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <Input
              id="apiKey"
              type="password" // Use password type to obscure the key visually
              placeholder="Enter your OpenAI API Key (e.g., sk-...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Alert variant="default" className="bg-secondary/30">
            <KeyRound className="h-4 w-4" />
            <AlertTitle>Important Security Note</AlertTitle>
            <AlertDescription>
              In a real application, API keys should be handled securely on the backend and never stored directly in the browser's local storage for production use. This implementation is for demonstration purposes only.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveApiKey} className="w-full" disabled={isLoading || !apiKey.trim()}>
            {isLoading ? (
              <Save className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Saving..." : "Save API Key"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
