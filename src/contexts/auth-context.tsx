
"use client";

import type { User } from "firebase/auth";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  loading: boolean;
  isAdmin: boolean; // Add isAdmin state
  setIsAdmin: Dispatch<SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // Mock admin state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock authentication check
    const mockUser = localStorage.getItem("mockUser");
    if (mockUser) {
      try {
        const parsedUser = JSON.parse(mockUser);
        setUser(parsedUser.user);
        setIsAdmin(parsedUser.isAdmin || false);
      } catch (e) {
        localStorage.removeItem("mockUser");
      }
    }
    setLoading(false);
  }, []);

  const handleSetUser = (newUser: User | null | ((prevState: User | null) => User | null)) => {
    setUser(currentUser => {
      const updatedUser = typeof newUser === 'function' ? newUser(currentUser) : newUser;
      if (updatedUser) {
        // For mock purposes, if user's email contains 'admin', set as admin
        const resolvedIsAdmin = updatedUser.email?.includes("admin") || false;
        localStorage.setItem("mockUser", JSON.stringify({ user: updatedUser, isAdmin: resolvedIsAdmin }));
        setIsAdmin(resolvedIsAdmin);
      } else {
        localStorage.removeItem("mockUser");
        setIsAdmin(false);
      }
      return updatedUser;
    });
  };
  
  const handleSetIsAdmin = (newIsAdmin: boolean | ((prevState: boolean) => boolean)) => {
    setIsAdmin(currentIsAdmin => {
        const updatedIsAdmin = typeof newIsAdmin === 'function' ? newIsAdmin(currentIsAdmin) : newIsAdmin;
        if (user) {
            localStorage.setItem("mockUser", JSON.stringify({ user, isAdmin: updatedIsAdmin }));
        }
        return updatedIsAdmin;
    });
  };


  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, loading, isAdmin, setIsAdmin: handleSetIsAdmin }}>
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
