
"use client";

import { AuthButton } from "@/components/auth/auth-button";
import { AppLogo } from "@/components/icons/app-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/"); // Redirect to dashboard if already logged in
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    // Show a loading state or null while checking auth/redirecting
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <AppLogo className="h-16 w-16 animate-pulse text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <AppLogo className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold">Welcome to TicketSwift</CardTitle>
          <CardDescription className="pt-2">
            Sign in to access your dashboard and features.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <p className="text-sm text-muted-foreground">
            Click the button below to simulate login.
          </p>
          <AuthButton />
           <p className="text-xs text-muted-foreground px-4 text-center">
            For demonstration, enter an email. If it contains "admin" (e.g., admin@example.com), you'll get admin privileges.
          </p>
        </CardContent>
      </Card>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} TicketSwift Inc. All rights reserved.
      </p>
    </div>
  );
}
