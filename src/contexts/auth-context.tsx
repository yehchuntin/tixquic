
"use client";

import type { User } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth as firebaseAuth, db } from "@/lib/firebase"; // Import initialized auth and db
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  loyaltyPoints: number;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserLoyaltyPoints: (pointsToAdd: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ["2017yehchunting@gmail.com"]; 

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        const isAdminByKeyword = currentUser.email.toLowerCase().includes("admin");
        const isAdminBySpecificList = ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
        setIsAdmin(isAdminByKeyword || isAdminBySpecificList);

        // Fetch or initialize loyalty points
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data().loyaltyPoints !== undefined) {
            setLoyaltyPoints(userDocSnap.data().loyaltyPoints);
          } else {
            // User document or points field doesn't exist, initialize points
            await setDoc(userDocRef, { loyaltyPoints: 0 }, { merge: true });
            setLoyaltyPoints(0);
          }
        } catch (error) {
          console.error("Error fetching/setting user loyalty points:", error);
          toast({ title: "Error", description: "Could not load loyalty points.", variant: "destructive"});
          setLoyaltyPoints(0); // Default to 0 on error
        }
      } else {
        setIsAdmin(false);
        setLoyaltyPoints(0); // Reset points if no user
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true); 
      await signInWithPopup(firebaseAuth, provider);
    } catch (error) {
      console.error("Error during Google Sign-In: ", error);
      setLoading(false); 
    }
  };

  const logout = async () => {
    try {
      setLoading(true); 
      await signOut(firebaseAuth);
    } catch (error) {
      console.error("Error during Sign-Out: ", error);
      setLoading(false); 
    }
  };

  const updateUserLoyaltyPoints = async (pointsToAdd: number) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to update points.", variant: "destructive" });
      return;
    }
    try {
      const newTotalPoints = loyaltyPoints + pointsToAdd;
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { loyaltyPoints: newTotalPoints }, { merge: true });
      setLoyaltyPoints(newTotalPoints); // Update context state
    } catch (error) {
      console.error("Error updating loyalty points in Firestore:", error);
      toast({ title: "Error", description: "Could not update your loyalty points.", variant: "destructive" });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, loyaltyPoints, loginWithGoogle, logout, updateUserLoyaltyPoints }}>
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
