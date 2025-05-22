
"use client";

import { MOCK_ANNOUNCEMENTS, type Announcement } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Newspaper } from "lucide-react";

export function AnnouncementFeed() {
  // In a real app, fetch announcements
  const announcements = MOCK_ANNOUNCEMENTS;

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-primary" />
          <CardTitle>Announcements</CardTitle>
        </div>
        <Badge variant="secondary">{announcements.length} New</Badge>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <p className="text-muted-foreground">No new announcements at the moment.</p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  {announcement.imageUrl && (
                     <div className="relative h-40 w-full">
                        <Image
                        src={announcement.imageUrl}
                        alt={announcement.title}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={announcement.dataAiHint || "news event"}
                        />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground pt-1">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {new Date(announcement.date).toLocaleDateString()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{announcement.content}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
