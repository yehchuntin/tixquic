
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, CalendarDays, Users, AlertTriangle as AlertTriangleIcon } from "lucide-react"; // Renamed to avoid conflict
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added import

export default function AdminDashboardPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page.",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [authLoading, isAdmin, router]); // Removed toast from dependencies as it's stable

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="items-center text-center">
            <AlertTriangleIcon className="h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You do not have the necessary permissions to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">Admin Control Panel</h1>
      </div>

      <Alert variant="default" className="bg-secondary/50">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Important Note</AlertTitle>
        <AlertDescription>
          This admin panel is part of a prototype. User management features simulate managing a list of users and their roles. Actual admin login access is determined by whether the email used for login contains &quot;admin&quot;.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              <CardTitle>Event Management</CardTitle>
            </div>
            <CardDescription>
              Create, edit, and manage all ticketed events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/events">Manage Events</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>User Management (Mock)</CardTitle>
            </div>
            <CardDescription>
              View users and simulate managing administrator privileges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
