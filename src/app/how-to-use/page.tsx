
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText, Lightbulb, KeyRound, Settings, Star, Ticket } from "lucide-react"; 
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
            First, ensure you are logged in. Some AI features (like the AI Seat Predictor, intended for future event-specific integration) require an OpenAI API Key.
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

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" /> {/* Changed icon */}
            <CardTitle>2. Browsing and Understanding Events</CardTitle> {/* Updated title */}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            The <Link href="/" className="text-primary hover:underline font-medium">Dashboard</Link> displays featured events. Each event card shows the name, image, price, and a brief description.
          </p>
          <p>
            Admins can manage these events (add, edit, delete) via the <Link href="/admin/events" className="text-primary hover:underline font-medium">Admin Panel</Link>.
          </p>
          <p className="text-sm text-muted-foreground">
            Clicking "View Details" on an event card will (in a future version) take you to a page with more information and purchasing options for that specific event.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            <CardTitle>3. AI Seat Predictor (Future Integration)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            The AI Seat Predictor is a powerful tool designed to help you find the best seats for a specific event based on historical data and your preferences.
          </p>
          <p>
            This functionality is envisioned to be integrated directly within each event's detail page in a future version, rather than being a standalone page.
            You would typically:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-4">
            <li>Navigate to the specific event you are interested in (from the main event list).</li>
            <li>On the event's detail page, look for an "AI Seat Prediction" or similar section/button.</li>
            <li>Provide any required event-specific details (if prompted).</li>
            <li>Receive AI-driven seat recommendations for that particular event.</li>
          </ol>
           <p className="text-sm text-muted-foreground">
            The standalone <code className="bg-muted px-1 py-0.5 rounded">/seat-predictor</code> page has been kept in the codebase for development and testing but is not part of the primary user navigation.
          </p>
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
            As you use TicketSwift (simulated actions), you'll accumulate Loyalty Points! These points can be used for future benefits.
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
                <li>For admins: Ensure event details (name, price, image URL) are accurate for the best display.</li>
                <li>Explore all sections of the app using the sidebar navigation.</li>
                <li>Use the light/dark mode toggle (moon/sun icon in the header) to suit your preference.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
