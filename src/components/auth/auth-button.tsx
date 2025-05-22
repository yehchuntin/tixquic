
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCircle, Settings, Chrome } from "lucide-react"; // Using Chrome for Google icon
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export function AuthButton() {
  const { user, isAdmin, loading, loginWithGoogle, logout } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    try {
        await loginWithGoogle();
        // router.push('/') // Optionally redirect after login attempt
    } catch (error) {
        console.error("Login failed:", error);
        // Handle login error (e.g., display toast)
    }
  };

  const handleLogout = async () => {
    try {
        await logout();
        router.push("/"); // Redirect to home after logout
    } catch (error) {
        console.error("Logout failed:", error);
        // Handle logout error
    }
  };

  if (loading) {
    return <Button variant="outline" disabled className="w-[160px]"><LoadingSpinner size={16} className="mr-2"/>Loading...</Button>;
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
              <AvatarFallback>
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.displayName || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isAdmin && (
             <DropdownMenuItem onClick={() => router.push("/admin")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
          {/* Profile link can be added here if a profile page is created */}
          {/* <DropdownMenuItem onClick={() => router.push("/how-to-use#loyalty-info")}>
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={handleLogin} variant="outline" className="w-[160px]">
      <Chrome className="mr-2 h-4 w-4" />
      Login with Google
    </Button>
  );
}
