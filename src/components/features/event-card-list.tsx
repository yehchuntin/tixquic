
"use client";

import { MOCK_EVENTS, type TicketEvent } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Ticket as TicketIcon, CalendarIcon, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DisplayEvent extends TicketEvent {
  effectiveStatus: "Upcoming" | "On Sale";
}

export function EventList() {
  const [displayEvents, setDisplayEvents] = useState<DisplayEvent[]>([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare date part only

    const processedEvents = MOCK_EVENTS.map(event => {
      const onSale = new Date(event.onSaleDate);
      onSale.setHours(0,0,0,0);
      const end = new Date(event.endDate);
      end.setHours(0,0,0,0);

      let effectiveStatus: "Upcoming" | "On Sale" | "Past";

      if (today >= end) {
        effectiveStatus = "Past";
      } else if (today >= onSale) {
        effectiveStatus = "On Sale";
      } else {
        effectiveStatus = "Upcoming";
      }
      return { ...event, effectiveStatus };
    }).filter(event => event.effectiveStatus === "Upcoming" || event.effectiveStatus === "On Sale") as DisplayEvent[];
    
    setDisplayEvents(processedEvents);
  }, []);


  return (
    <Card className="shadow-lg w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketIcon className="h-6 w-6 text-primary" />
          <CardTitle>Featured Events</CardTitle>
        </div>
        {displayEvents.length > 0 && <Badge variant="secondary">{displayEvents.length} Events</Badge>}
      </CardHeader>
      <CardContent>
        {displayEvents.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No upcoming or on-sale events at the moment. Check back soon!</p>
        ) : (
          <ScrollArea className="h-[500px] lg:h-auto lg:max-h-[calc(100vh-20rem)] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayEvents.map((event) => (
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
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl leading-tight">{event.name}</CardTitle>
                        <Badge variant={event.effectiveStatus === "On Sale" ? "default" : "secondary"}
                           className={
                            event.effectiveStatus === "On Sale" ? "bg-green-100 text-green-700 border-green-200" :
                            "bg-blue-100 text-blue-700 border-blue-200"
                           }
                        >
                            {event.effectiveStatus}
                        </Badge>
                    </div>
                     <div className="flex items-center text-xs text-muted-foreground pt-1">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {/* Display onSaleDate as the primary date if upcoming, or a range */}
                        {event.effectiveStatus === "Upcoming" ? `Starts: ${new Date(event.onSaleDate).toLocaleDateString()}` : `On Sale Until: ${new Date(event.endDate).toLocaleDateString()}`}
                        {' \u2022 '} {event.venue}
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
                    <Button asChild variant="outline" size="sm" disabled={event.effectiveStatus === "Upcoming"}>
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
