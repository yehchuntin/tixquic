
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText, Lightbulb, BarChart3, Briefcase, KeyRound, Settings } from "lucide-react";
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
            The AI Seat Predictor helps you find the best seats based on historical data and your preferences.
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-4">
            <li>Go to the <Link href="/seat-predictor" className="text-primary hover:underline font-medium">Seat Predictor</Link> page.</li>
            <li>Fill in the required information: Seating Chart Data, Historical Success Rates, and your Desired Location.</li>
            <li>Click "Predict Optimal Seats".</li>
            <li>The AI will analyze the data and provide you with predicted optimal seats and the success probability for your desired location.</li>
          </ol>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <CardTitle>3. Viewing Success Reports</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            Compare the effectiveness of using bots versus manual ticket purchasing.
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-4">
            <li>Navigate to the <Link href="/success-report" className="text-primary hover:underline font-medium">Success Report</Link> page.</li>
            <li>Input details about the event, user counts (bot vs. manual), and their respective success rates.</li>
            <li>Click "Generate Report".</li>
            <li>The system will provide an AI-generated analysis and a visual chart comparing the success rates.</li>
          </ol>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <CardTitle>4. Managing Modules</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            Activate or deactivate additional features (modules) to enhance your TicketSwift experience.
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-4">
            <li>Go to the <Link href="/modules" className="text-primary hover:underline font-medium">Modules</Link> page.</li>
            <li>For inactive modules, enter an access key (for this prototype, "VALIDKEY" works) and click "Activate Module".</li>
            <li>Activated modules will provide additional functionalities.</li>
          </ol>
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
                <li>Explore all sections of the app to discover its full potential.</li>
                <li>Use the light/dark mode toggle (moon/sun icon in the header) to suit your preference.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
