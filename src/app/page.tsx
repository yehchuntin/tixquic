
import { AnnouncementFeed } from "@/components/features/announcement-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Ticket, ShieldCheck, Bot, TrendingUp, Lightbulb } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 md:p-8 rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-primary">Welcome to TicketSwift!</CardTitle>
          <p className="text-muted-foreground mt-2 text-lg">
            Your ultimate companion for snagging those hard-to-get tickets. Explore features, check announcements, and manage your preferences.
          </p>
        </CardHeader>
        <CardContent>
           <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button asChild size="lg" className="shadow-md">
              <Link href="/modules">
                <ShieldCheck className="mr-2 h-5 w-5" /> Manage Modules
              </Link>
            </Button>
            <Button asChild size="lg" className="shadow-md" variant="outline">
              <Link href="/how-to-use">
                <Lightbulb className="mr-2 h-5 w-5" /> How to Use
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <AnnouncementFeed />
        </div>
        {/* LoyaltyDisplay and Performance Card removed from here */}
      </div>
    </div>
  );
}
