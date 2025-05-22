
import { AnnouncementFeed } from "@/components/features/announcement-feed";
import { LoyaltyDisplay } from "@/components/features/loyalty-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Ticket, ShieldCheck, Bot, TrendingUp } from "lucide-react";

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
           <div className="mt-6">
            <Button asChild size="lg" className="shadow-md w-full md:w-auto">
              <Link href="/seat-predictor">
                <Bot className="mr-2 h-5 w-5" /> AI Seat Predictor
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnnouncementFeed />
        </div>
        <div className="space-y-6">
          <LoyaltyDisplay />
           <Card className="shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <CardTitle>Performance</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">Compare your success with TicketSwift.</p>
                <Button asChild className="w-full">
                  <Link href="/success-report">
                    View Success Reports
                  </Link>
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
