
// This page is no longer used and can be deleted.
// Keeping the file to prevent build errors if referenced, but it should be removed.
// Content is replaced with a placeholder.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function ModulesPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="items-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>This page has been removed or is no longer available.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            The "Modules" feature is currently not part of the web application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
