
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, MonitorPlay, AppWindow, Apple } from "lucide-react"; // Changed Windows to AppWindow
import Link from "next/link";

export default function DownloadPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Download className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">Download TicketSwift Desktop App</h1>
      </div>
      <CardDescription className="text-lg">
        Get the TicketSwift desktop application to automate your ticket purchasing using the verification codes obtained from this web app.
      </CardDescription>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MonitorPlay className="h-6 w-6 text-primary" />
            <CardTitle>About the Desktop Application</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            The TicketSwift desktop application is a powerful tool designed to work in tandem with this web platform. Once you obtain a verification code for an event through this website, you'll input that code into the desktop app.
          </p>
          <p>
            The desktop app will then use your saved preferences (ticket count, session, seat order) associated with that code to run an automated script, helping you secure tickets for your chosen event the moment they go on sale.
          </p>
          <p className="font-semibold text-primary">
            The desktop application is currently under development and will be available soon!
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Download Links (Coming Soon)</CardTitle>
          <CardDescription>
            Check back here for download links once the application is released.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="w-full sm:w-auto" disabled>
              <AppWindow className="mr-2 h-5 w-5" /> Download for Windows
            </Button>
            <Button size="lg" className="w-full sm:w-auto" disabled>
              <Apple className="mr-2 h-5 w-5" /> Download for macOS
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            System requirements and installation instructions will be provided with the download.
          </p>
        </CardContent>
      </Card>

       <Card className="shadow-lg bg-secondary/30">
        <CardHeader>
            <CardTitle>Stay Updated</CardTitle>
        </CardHeader>
        <CardContent>
            <p>
                Follow our announcements or check back regularly for updates on the desktop application's release.
                You can also revisit the <Link href="/how-to-use" className="text-primary hover:underline">How to Use</Link> page for the latest information.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
