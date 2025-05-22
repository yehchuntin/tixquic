
"use client";

import type { User } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth as firebaseAuth } from "@/lib/firebase"; // Import initialized auth

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        setIsAdmin(currentUser.email.includes("admin"));
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true); // Indicate loading state
      await signInWithPopup(firebaseAuth, provider);
      // onAuthStateChanged will handle setting user, isAdmin, and final loading state
    } catch (error) {
      console.error("Error during Google Sign-In: ", error);
      // Potentially show a toast message to the user
      setLoading(false); // Reset loading state on error
    }
  };

  const logout = async () => {
    try {
      setLoading(true); // Indicate loading state
      await signOut(firebaseAuth);
      // onAuthStateChanged will handle setting user to null, isAdmin to false, and final loading state
    } catch (error) {
      console.error("Error during Sign-Out: ", error);
      // Potentially show a toast message to the user
      setLoading(false); // Reset loading state on error
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, loginWithGoogle, logout }}>
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
