
"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeaderLoyaltyPoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (user) {
      // Simulate fetching points for the logged-in user
      // In a real app, this would be an API call based on user.uid
      const userSpecificPoints = parseInt(localStorage.getItem(`loyaltyPoints_${user.uid}`) || "0", 10);
      if (userSpecificPoints === 0) { // Initialize if no points found
          const randomPoints = Math.floor(Math.random() * 1200) + 50; // e.g. 50-1250 points
          localStorage.setItem(`loyaltyPoints_${user.uid}`, randomPoints.toString());
          setPoints(randomPoints);
      } else {
        setPoints(userSpecificPoints);
      }
    } else {
      setPoints(0); // Reset points if user logs out
    }
  }, [user]);

  if (!user) {
    return null; // Don't show if not logged in
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
