
"use client";

import { MOCK_EVENTS, type TicketEvent } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Ticket as TicketIcon, CalendarIcon, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EventList() {
  // In a real app, fetch events. For prototype, use MOCK_EVENTS.
  const events = MOCK_EVENTS.filter(event => event.status === "On Sale" || event.status === "Upcoming"); // Display only active events

  return (
    <Card className="shadow-lg w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketIcon className="h-6 w-6 text-primary" />
          <CardTitle>Featured Events</CardTitle>
        </div>
        {events.length > 0 && <Badge variant="secondary">{events.length} Events</Badge>}
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No upcoming events at the moment. Check back soon!</p>
        ) : (
          <ScrollArea className="h-[500px] lg:h-auto lg:max-h-[calc(100vh-20rem)] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden transition-shadow hover:shadow-xl flex flex-col">
                  {event.imageUrl && (
                     <div className="relative h-48 w-full">
                        <Image
                        src={event.imageUrl}
                        alt={event.name}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={event.dataAiHint || "event image"}
                        />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl leading-tight">{event.name}</CardTitle>
                     <div className="flex items-center text-xs text-muted-foreground pt-1">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {new Date(event.date).toLocaleDateString()} &bull; {event.venue}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {event.description && (
                        <CardDescription className="text-sm line-clamp-3">{event.description}</CardDescription>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-4 mt-auto border-t">
                    <div className="flex items-center text-lg font-semibold text-primary">
                        <DollarSign className="h-5 w-5 mr-1" />
                        {event.price.toFixed(2)}
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href="#">
                        View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
