
import { EventList } from "@/components/features/event-card-list"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldCheck, Lightbulb } from "lucide-react"; 
import { AppLogo } from "@/components/icons/app-logo"; // Import AppLogo

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 md:p-8 rounded-xl shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AppLogo className="h-10 w-10 text-primary" /> {/* Changed icon */}
            <CardTitle className="text-3xl md:text-4xl font-bold">Welcome to TicketSwift!</CardTitle>
          </div>
          <p className="text-muted-foreground mt-2 text-lg">
            Your ultimate companion for snagging those hard-to-get tickets. Explore events, check guides, and manage your settings.
          </p>
        </CardHeader>
        <CardContent>
           <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button asChild size="lg" className="shadow-md">
              <Link href="/admin/events"> 
                <ShieldCheck className="mr-2 h-5 w-5" /> Manage Your Events (Admin)
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

      <div className="grid grid-cols-1"> 
        <div>
          <EventList /> 
        </div>
      </div>
    </div>
  );
}
