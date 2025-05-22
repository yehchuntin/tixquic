
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText, Lightbulb, KeyRound, Settings, Star, Ticket, MonitorPlay, Globe } from "lucide-react"; 
import Link from "next/link";

export default function HowToUsePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <BookOpenText className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">How to Use TicketSwift</h1>
      </div>
      <CardDescription className="text-lg">
        Welcome to TicketSwift! This guide explains how the system works and how to use this web application.
      </CardDescription>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <CardTitle>1. Understanding TicketSwift</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            TicketSwift is a two-part system designed to help you secure event tickets:
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-4">
            <li>
              <strong className="flex items-center gap-1"><Globe className="h-5 w-5 text-accent" />This Web Application:</strong> Its main purpose is to allow you to browse upcoming events and obtain a unique <strong className="text-primary">Verification Code</strong> for events you're interested in.
            </li>
            <li>
              <strong className="flex items-center gap-1"><MonitorPlay className="h-5 w-5 text-accent" />Future Desktop Application:</strong> You will input the Verification Code obtained from this web app into a separate desktop application (to be developed later). This desktop app will then use the code to identify the event and run an automated ticket-snatching script for it.
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
            <li>Follow the prompts. A unique 16-character alphanumeric verification code will be generated for you.</li>
            <li>This code will be displayed on the page. You can copy it for later use.</li>
          </ol>
           <p className="text-sm text-muted-foreground">
            Note: You must be logged in to obtain a verification code. The "payment" step is currently simulated.
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MonitorPlay className="h-6 w-6 text-primary" />
            <CardTitle>3. Using Your Verification Code (Future Desktop App)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
           <p>
            Once you have your verification code from this web app, you'll use it in the upcoming TicketSwift desktop application.
          </p>
          <p>
            The desktop application will handle the automated ticket purchasing process for the specific event tied to your code.
          </p>
           <p className="text-sm text-muted-foreground">
            Details about the desktop application will be provided when it's available.
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
            Some AI features (like the AI Seat Predictor, intended for future event-specific integration) may require an OpenAI API Key.
          </p>
          <p>
            To add or update your API key:
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
            As you obtain verification codes (simulated purchases), you'll accumulate Loyalty Points! These points can be used for future benefits.
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
                <li>For admins: Ensure event details (name, price, image URL, dates) are accurate.</li>
                <li>Explore all sections of the app using the sidebar navigation.</li>
                <li>Use the light/dark mode toggle (moon/sun icon in the header) to suit your preference.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
