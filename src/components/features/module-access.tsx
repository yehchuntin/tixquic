
// This component is no longer used and can be deleted.
// Keeping the file to prevent build errors if referenced, but it should be removed.
// Content is replaced with a placeholder.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function ModuleAccessComponent() {
  return (
    <Card>
      <CardHeader>
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <CardTitle>Component Deprecated</CardTitle>
        <CardDescription>
          This component (ModuleAccess) is no longer in use.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>The modules feature has been removed from the web application.</p>
      </CardContent>
    </Card>
  );
}
