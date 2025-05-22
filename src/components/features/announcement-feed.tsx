
// This component's functionality has been moved to event-card-list.tsx
// This file can be removed if no longer referenced from other parts of the application.
"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeprecatedAnnouncementFeed() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle>Component Deprecated</CardTitle>
        </div>
        <CardDescription>
          The AnnouncementFeed component is no longer the primary source for event listings.
          Event listing functionality has been moved to the EventList component (in event-card-list.tsx).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>This file (announcement-feed.tsx) likely needs to be removed or updated if it serves any other purpose.</p>
      </CardContent>
    </Card>
  );
}
