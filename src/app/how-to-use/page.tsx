
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText, Lightbulb, KeyRound, Settings, Star, Ticket, MonitorPlay, Globe, Download as DownloadIcon } from "lucide-react"; 
import Link from "next/link";

export default function HowToUsePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <BookOpenText className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">How to Use TixQuic</h1>
      </div>
      <CardDescription className="text-lg">
        Welcome to TixQuic! This guide explains how the system works and how to use this web application and the future desktop app.
      </CardDescription>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <CardTitle>1. Understanding TixQuic</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            TixQuic is a two-part system designed to help you secure event tickets:
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-4">
            <li>
              <strong className="flex items-center gap-1"><Globe className="h-5 w-5 text-accent" />This Web Application:</strong> Its main purpose is to allow you to browse upcoming events, obtain a unique <strong className="text-primary">Verification Code</strong> for events you're interested in, and set your ticket preferences (number of tickets, session, seat order).
            </li>
            <li>
              <strong className="flex items-center gap-1"><MonitorPlay className="h-5 w-5 text-accent" />Future Desktop Application:</strong> You will input the Verification Code obtained from this web app into a separate desktop application. This desktop app will then use the code and your saved preferences to identify the event and run an automated ticket-snatching script for it.
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <CardTitle>2. Getting Event Verification Codes (This Web App)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            On the <Link href="/" className="text-primary hover:underline font-medium">Dashboard</Link>, you'll find a list of featured events. Each card shows event details and price.
          </p>
          <p>
            To get a verification code for an event:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-4">
            <li>Click on an event card or its "View Details" button.</li>
            <li>On the event detail page, if the event is "On Sale", click the "Get Tickets Now" button.</li>
            <li>This will generate your unique 16-character alphanumeric verification code and save it to your account for this event.</li>
            <li>The "payment" step is currently simulated.</li>
            <li>After obtaining the code, you can click "Set/Edit Preferences" to specify your ticket count, session, and seat order preferences. These preferences are saved with your code.</li>
            <li>Your verification code will be displayed on the page. You can copy it for later use.</li>
          </ol>
           <p className="text-sm text-muted-foreground">
            Note: You must be logged in to obtain a verification code and set preferences.
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg" id="download-app">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DownloadIcon className="h-6 w-6 text-primary" />
            <CardTitle>3. Downloading and Using the Desktop App</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
           <p>
            Once you have your verification code and have set your preferences via this web app, you'll need the TixQuic desktop application.
          </p>
          <p>
            Navigate to the <Link href="/download" className="text-primary hover:underline font-medium">Download App</Link> page from the sidebar to find download links (when available) and installation instructions for the desktop application.
          </p>
          <p>
            In the desktop application, you will input your verification code. The app will then use this code to retrieve your saved event details and preferences to run the ticket-snatching script.
          </p>
           <p className="text-sm text-muted-foreground">
            The TixQuic desktop application is currently under development.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-primary" />
            <CardTitle>4. OpenAI API Key Setup</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Some advanced AI features within the TixQuic ecosystem (potentially in the desktop app or future web features) may require an OpenAI API Key.
          </p>
          <p>
            To add or update your API key for use with TixQuic services:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-4">
            <li>Navigate to the <Link href="/settings" className="text-primary hover:underline font-medium">Settings</Link> page from the sidebar.</li>
            <li>Enter your OpenAI API Key in the designated field.</li>
            <li>Click "Save API Key". Your key will be stored securely in your browser's local storage for this prototype.</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Note: In a production environment, API keys would be managed with more robust backend security.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg" id="loyalty-info">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" />
            <CardTitle>5. Loyalty Points</CardTitle> 
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            As you obtain verification codes (simulated purchases), you'll accumulate Loyalty Points! These points can be used for future benefits within the TixQuic ecosystem.
          </p>
          <p>
            You can see your current points balance in the header (top right), next to the theme toggle, when you are logged in.
          </p>
           <p className="text-sm text-muted-foreground">
            The loyalty program is currently in a conceptual phase. More details on rewards and redemption will be available soon.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>General Tips</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside space-y-1">
                <li>Keep your OpenAI API Key confidential if you use one.</li>
                <li>For admins: Ensure event details (name, price, image URL, dates) are accurate when managing events.</li>
                <li>Explore all sections of the app using the sidebar navigation.</li>
                <li>Use the light/dark mode toggle (moon/sun icon in the header) to suit your preference.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
