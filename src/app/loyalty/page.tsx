
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, Gift,Zap, ShoppingBag, CalendarDays } from "lucide-react";
import Link from "next/link";

const TIER_BENEFITS = {
  Bronze: ["Standard support", "Newsletter updates"],
  Silver: ["Priority support", "Early access to select sales", "5% bonus points on purchases"],
  Gold: ["Dedicated support line", "Exclusive pre-sales access", "10% bonus points on purchases", "Annual birthday gift"],
};

export default function LoyaltyPage() {
  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState<keyof typeof TIER_BENEFITS>("Bronze");
  const pointsToNextTier = tier === "Bronze" ? 500 : (tier === "Silver" ? 1000 : Infinity);
  const nextTierName = tier === "Bronze" ? "Silver" : (tier === "Silver" ? "Gold" : "Max Tier");


  useEffect(() => {
    const randomPoints = Math.floor(Math.random() * 1500);
    setPoints(randomPoints);
    if (randomPoints < 500) setTier("Bronze");
    else if (randomPoints < 1000) setTier("Silver");
    else setTier("Gold");
  }, []);

  const progressPercentage = tier === "Gold" ? 100 : (points / pointsToNextTier) * 100;

  const benefits = TIER_BENEFITS[tier];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
            <Star className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">Loyalty Program</h1>
        </div>
        <Button asChild variant="outline">
            <Link href="/">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Earn More Points
            </Link>
        </Button>
      </div>
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-xl">
          <CardHeader className="text-center">
            <Star className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Your Status: <span className="text-primary">{tier}</span></CardTitle>
            <CardDescription>You have accumulated</CardDescription>
            <p className="text-5xl font-bold text-primary">{points}</p>
            <p className="text-muted-foreground">Loyalty Points</p>
          </CardHeader>
          <CardContent>
            {tier !== "Gold" && (
              <>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Progress to {nextTierName} Tier</span>
                  <span>{points} / {pointsToNextTier}</span>
                </div>
                <Progress value={progressPercentage} aria-label={`${progressPercentage}% to next tier`} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Earn {pointsToNextTier - points} more points to reach {nextTierName} tier!
                </p>
              </>
            )}
             {tier === "Gold" && (
                <p className="text-center text-lg font-semibold text-green-600">You've reached the highest tier! Enjoy your premium benefits.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
                <Gift className="h-6 w-6 text-primary" />
                Current Tier Benefits ({tier})
            </CardTitle>
            <CardDescription>Enjoy these exclusive perks as a {tier} member.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <Zap className="h-5 w-5 text-accent mr-3 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-primary"/>
                Points History (Coming Soon)
            </CardTitle>
            <CardDescription>Track your points earnings and redemptions here.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Your detailed points history will be available soon.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
