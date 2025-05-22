
"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeaderLoyaltyPoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);

  const updatePointsFromStorage = () => {
    if (user) {
      const userSpecificPoints = parseInt(localStorage.getItem(`loyaltyPoints_${user.uid}`) || "0", 10);
      setPoints(userSpecificPoints);
    } else {
      setPoints(0);
    }
  };

  useEffect(() => {
    updatePointsFromStorage();

    // Listen for a custom event that signals points have been updated elsewhere
    const handlePointsUpdate = () => {
      updatePointsFromStorage();
    };
    window.addEventListener('loyaltyPointsUpdated', handlePointsUpdate);

    return () => {
      window.removeEventListener('loyaltyPointsUpdated', handlePointsUpdate);
    };
  }, [user]);


  if (!user) {
    return null;
  }

  return (
    <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
      <Link href="/how-to-use#loyalty-info" aria-label={`You have ${points} loyalty points. Click to learn more.`}>
        <Star className="mr-2 h-4 w-4 text-primary fill-primary/20" />
        <span className="font-medium">{points}</span>
        <span className="sr-only">Loyalty Points</span>
      </Link>
    </Button>
  );
}
