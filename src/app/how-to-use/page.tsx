
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText, Lightbulb, BarChart3, Briefcase, KeyRound, Settings, Star } from "lucide-react";
import Link from "next/link";

export default function HowToUsePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <BookOpenText className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">How to Use TicketSwift</h1>
      </div>
      <CardDescription className="text-lg">
        Welcome to TicketSwift! This guide will walk you through setting up and using the app effectively.
      </CardDescription>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <CardTitle>1. Getting Started & API Key Setup</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            First, ensure you are logged in. TicketSwift utilizes AI features that require an OpenAI API Key.
          </p>
          <p>
            To add or update your API key:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-4">
            <li>Navigate to the <Link href="/settings" className="text-primary hover:underline font-medium">Settings</Link> page.</li>
            <li>Enter your OpenAI API Key in the designated field.</li>
            <li>Click "Save API Key". Your key will be stored securely in your browser's local storage for this prototype.</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Note: In a production environment, API keys would be managed with more robust backend security.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            <CardTitle>2. Using the AI Seat Predictor</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            The AI Seat Predictor helps you find the best seats based on historical data and your preferences for a specific event.
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-4">
            <li>Go to the <Link href="/seat-predictor" className="text-primary hover:underline font-medium">Seat Predictor</Link> page (accessible from the sidebar).</li>
            <li>Fill in the required information: Seating Chart Data, Historical Success Rates, and your Desired Location for the event you are interested in.</li>
            <li>Click "Predict Optimal Seats".</li>
            <li>The AI will analyze the data and provide you with predicted optimal seats and the success probability for your desired location.</li>
          </ol>
           <p className="text-sm text-muted-foreground">
            In a future version, this predictor might be integrated directly into each event's detail page.
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <CardTitle>3. Managing Modules</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            Activate or deactivate additional features (modules) to enhance your TicketSwift experience. These modules can provide specialized functionalities.
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-4">
            <li>Go to the <Link href="/modules" className="text-primary hover:underline font-medium">Modules</Link> page.</li>
            <li>For inactive modules, enter an access key (for this prototype, "VALIDKEY" works for demonstration) and click "Activate Module".</li>
            <li>Activated modules will enhance your app experience.</li>
          </ol>
        </CardContent>
      </Card>

       <Card className="shadow-lg" id="loyalty-info">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" />
            <CardTitle>4. Loyalty Points</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            As you use TicketSwift, you'll accumulate Loyalty Points! These points can be used for future benefits (details to be announced).
          </p>
          <p>
            You can see your current points balance in the header, next to the theme toggle, when you are logged in.
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
                <li>Keep your OpenAI API Key confidential.</li>
                <li>Ensure the data provided to the AI tools is as accurate as possible for best results.</li>
                <li>Explore all sections of the app using the sidebar navigation.</li>
                <li>Use the light/dark mode toggle (moon/sun icon in the header) to suit your preference.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
