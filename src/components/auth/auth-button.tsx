
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
import { LogIn, LogOut, UserCircle, Settings } from "lucide-react";

export function AuthButton() {
  const { user, setUser, isAdmin, setIsAdmin, loading } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    // Mock login: In a real app, this would redirect to a login page or open a modal
    // For this mock, we'll set a dummy user.
    // Prompt for email to determine if admin
    const email = prompt("Enter your email (e.g., user@example.com or admin@example.com):");
    if (email) {
      const mockUser = {
        uid: "mock-uid-" + Date.now(),
        email: email,
        displayName: email.split("@")[0],
        photoURL: `https://i.pravatar.cc/150?u=${email}`, // Placeholder avatar
      } as any; // Casting to any to satisfy User type partially
      setUser(mockUser);
      if (email.includes("admin")) {
        setIsAdmin(true);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    router.push("/"); // Redirect to home after logout
  };

  if (loading) {
    return <Button variant="outline" disabled>Loading...</Button>;
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
          <DropdownMenuItem onClick={() => router.push("/loyalty")}>
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
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
    <Button onClick={handleLogin} variant="outline">
      <LogIn className="mr-2 h-4 w-4" />
      Login
    </Button>
  );
}
