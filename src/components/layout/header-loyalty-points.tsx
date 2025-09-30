
"use client";

import { Star } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeaderLoyaltyPoints() {
  const { user, loyaltyPoints } = useAuth(); // Get loyaltyPoints from context

  if (!user) {
    return null;
  }

  return (
    <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
      {/* Changed Link href to /mall */}
      <Link href="/mall" aria-label={`You have ${loyaltyPoints} loyalty points. Click to visit the mall.`}>
        <Star className="mr-2 h-4 w-4 text-primary fill-primary/20" />
        <span className="font-medium">{loyaltyPoints}</span>
        <span className="sr-only">Loyalty Points</span>
      </Link>
    </Button>
  );
}
