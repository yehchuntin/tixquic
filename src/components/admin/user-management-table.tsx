
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, ShieldCheck, ShieldOff, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface MockUser {
  id: string;
  email: string;
  name: string;
  isMockAdmin: boolean; // Use a different name to avoid confusion with context's isAdmin
}

// Hardcoded mock users. In a real app, this would come from a database.
const MOCK_USERS_DATA: MockUser[] = [
  { id: "user1", email: "user@example.com", name: "Normal User", isMockAdmin: false },
  { id: "user2", email: "another@example.com", name: "Another User", isMockAdmin: false },
  { id: "user3", email: "admin@example.com", name: "Site Admin", isMockAdmin: true },
  { id: "user4", email: "testadmin@example.com", name: "Test Admin", isMockAdmin: true },
  { id: "user5", email: "guest@example.com", name: "Guest User", isMockAdmin: false },
];

export function UserManagementTable() {
  const { isAdmin: isCurrentUserAdmin, loading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<MockUser[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching users
    setUsers(MOCK_USERS_DATA);
  }, []);

  useEffect(() => {
    if (!authLoading && !isCurrentUserAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to manage users.",
        variant: "destructive",
      });
      router.push("/admin"); // Redirect to admin dashboard or home
    }
  }, [authLoading, isCurrentUserAdmin, router, toast]);

  const toggleAdminStatus = (userId: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.id === userId) {
          // Prevent current admin from revoking their own mock status if they are the one in AuthContext
          // This is a simplified check for the prototype
          if (currentUser && user.email === currentUser.email && user.isMockAdmin && isCurrentUserAdmin) {
             toast({
              title: "Action Restricted",
              description: "As the current admin, you cannot revoke your own admin status here (mock limitation).",
              variant: "destructive",
            });
            return user;
          }
          const newAdminStatus = !user.isMockAdmin;
          toast({
            title: "User Updated (Mock)",
            description: `${user.name}'s admin status ${newAdminStatus ? "granted" : "revoked"}. (This is a visual mock only)`,
          });
          return { ...user, isMockAdmin: newAdminStatus };
        }
        return user;
      })
    );
  };
  
  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={48} /></div>;
  }

  if (!isCurrentUserAdmin) {
     return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You do not have administrative privileges to manage users.</p>
            <Button onClick={() => router.push('/')} className="mt-6">Go to Dashboard</Button>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" /> User Management
        </h2>
      </div>
        <CardDescription>
          Manage user roles and permissions. Note: Admin status changes on this page are for demonstration and do not affect actual login permissions in this prototype. Actual admin status is determined by email during login.
        </CardDescription>

      <Card className="shadow-lg">
        <Table>
          <TableCaption>A list of registered users.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Admin Status (Mock)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-center">
                  {user.isMockAdmin ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <ShieldCheck className="h-4 w-4" /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <ShieldOff className="h-4 w-4" /> User
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Label htmlFor={`admin-switch-${user.id}`} className="text-sm">
                      {user.isMockAdmin ? "Revoke Admin" : "Grant Admin"}
                    </Label>
                    <Switch
                      id={`admin-switch-${user.id}`}
                      checked={user.isMockAdmin}
                      onCheckedChange={() => toggleAdminStatus(user.id)}
                      aria-label={`Toggle admin status for ${user.name}`}
                       disabled={currentUser?.email === user.email && isCurrentUserAdmin && user.isMockAdmin} 
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
         {users.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                No users found.
            </div>
        )}
      </Card>
       <Alert variant="default" className="mt-6 bg-secondary/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Prototype Limitation</AlertTitle>
          <AlertDescription>
            Changes to admin status on this page are for demonstration purposes only and do not affect the actual authentication or authorization logic of the application. In this prototype, a user is considered an admin if their email address contains &quot;admin&quot;.
          </AlertDescription>
        </Alert>
    </div>
  );
}
