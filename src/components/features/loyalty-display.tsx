
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, Gift } from "lucide-react";
import Link from "next/link";

export function LoyaltyDisplay() {
  // Mock loyalty data
  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState("Bronze");
  const pointsToNextTier = 1000;

  useEffect(() => {
    // Simulate fetching points
    const randomPoints = Math.floor(Math.random() * 1500);
    setPoints(randomPoints);
    if (randomPoints < 500) setTier("Bronze");
    else if (randomPoints < 1000) setTier("Silver");
    else setTier("Gold");
  }, []);
  
  const progressPercentage = (points / pointsToNextTier) * 100;

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" />
          <CardTitle>Loyalty Points</CardTitle>
        </div>
        <span className="text-sm font-semibold text-primary">{tier} Tier</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{points}</p>
          <p className="text-muted-foreground">Points Earned</p>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Progress to next tier</span>
            <span>{points} / {pointsToNextTier}</span>
          </div>
          <Progress value={progressPercentage} aria-label={`${progressPercentage}% to next tier`} className="h-3" />
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/loyalty">
            <Gift className="mr-2 h-4 w-4" />
            View Rewards & Benefits
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
