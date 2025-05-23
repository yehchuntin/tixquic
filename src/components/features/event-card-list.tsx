
"use client";

import { type TicketEvent } from "@/lib/constants"; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Ticket as TicketIcon, CalendarIcon, DollarSign, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; 
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useToast } from "@/hooks/use-toast";

interface DisplayEvent extends TicketEvent {
  effectiveStatus: "Upcoming" | "On Sale";
}

export function EventList() {
  const [displayEvents, setDisplayEvents] = useState<DisplayEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const eventsCollectionRef = collection(db, "events");
    const todayStr = new Date().toISOString().split('T')[0]; 

    const q = query(eventsCollectionRef, where("endDate", ">=", todayStr));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const fetchedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            onSaleDate: data.onSaleDate instanceof Timestamp ? data.onSaleDate.toDate().toISOString().split('T')[0] : data.onSaleDate,
            endDate: data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString().split('T')[0] : data.endDate,
            pointsAwarded: data.pointsAwarded || 0,
        } as TicketEvent;
      });
      
      const processedEvents: DisplayEvent[] = fetchedEvents
        .map(event => {
          const onSale = new Date(event.onSaleDate);
          onSale.setHours(0,0,0,0);
          
          let effectiveStatus: "Upcoming" | "On Sale";

          if (today >= onSale) {
            effectiveStatus = "On Sale";
          } else {
            effectiveStatus = "Upcoming";
          }
          return { ...event, effectiveStatus };
        })
        .filter(event => {
            const eventEndDate = new Date(event.endDate);
            eventEndDate.setHours(23,59,59,999); // Consider event active for the whole end date
            return today <= eventEndDate; 
        })
        .sort((a, b) => new Date(a.onSaleDate).getTime() - new Date(b.onSaleDate).getTime());
      
      setDisplayEvents(processedEvents);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching events for homepage: ", error);
      toast({ title: "Error Loading Events", description: "Could not load events from the database. Please try again later.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe(); 
  }, [toast]);


  if (isLoading) {
    return (
      <Card className="shadow-lg w-full border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketIcon className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Featured Events</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center">
          <LoadingSpinner size={36} />
          <p className="mt-3 text-muted-foreground">Loading upcoming events...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg w-full border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketIcon className="h-7 w-7 text-primary" />
          <CardTitle className="text-2xl md:text-3xl">Featured Events</CardTitle>
        </div>
        {displayEvents.length > 0 && <Badge variant="secondary" className="text-sm px-3 py-1">{displayEvents.length} Events</Badge>}
      </CardHeader>
      <CardContent>
        {displayEvents.length === 0 ? (
          <p className="text-muted-foreground text-center py-10 text-lg">No upcoming or on-sale events at the moment. Check back soon!</p>
        ) : (
          <ScrollArea className="h-auto max-h-[70vh] lg:max-h-[calc(100vh-22rem)] -mr-4 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col border group cursor-pointer">
                  <Link href={`/event/${event.id}`} passHref legacyBehavior>
                    <a className="flex flex-col h-full">
                      {event.imageUrl ? (
                         <div className="relative h-52 w-full overflow-hidden">
                            <Image
                            src={event.imageUrl}
                            alt={event.name}
                            fill
                            style={{ objectFit: "cover" }}
                            className="transition-transform duration-500 group-hover:scale-105"
                            data-ai-hint={event.dataAiHint || "event image"}
                            priority={displayEvents.indexOf(event) < 3} 
                            />
                             <div className="absolute top-2 right-2 z-10">
                                 <Badge variant={event.effectiveStatus === "On Sale" ? "default" : "secondary"}
                                   className={
                                    event.effectiveStatus === "On Sale" ? "bg-green-500 hover:bg-green-600 text-primary-foreground border-green-600 shadow-md" :
                                    "bg-blue-500 hover:bg-blue-600 text-primary-foreground border-blue-600 shadow-md"
                                   }
                                >
                                    {event.effectiveStatus}
                                </Badge>
                             </div>
                        </div>
                      ) : (
                        <div className="relative h-52 w-full bg-muted flex items-center justify-center">
                            <TicketIcon className="w-16 h-16 text-muted-foreground/50" />
                            <div className="absolute top-2 right-2 z-10">
                                 <Badge variant={event.effectiveStatus === "On Sale" ? "default" : "secondary"}
                                   className={
                                    event.effectiveStatus === "On Sale" ? "bg-green-500 hover:bg-green-600 text-primary-foreground border-green-600 shadow-md" :
                                    "bg-blue-500 hover:bg-blue-600 text-primary-foreground border-blue-600 shadow-md"
                                   }
                                >
                                    {event.effectiveStatus}
                                </Badge>
                             </div>
                        </div>
                      )}
                      <CardHeader className="pb-3 pt-4">
                        <CardTitle className="text-xl leading-tight font-semibold group-hover:text-primary transition-colors">{event.name}</CardTitle>
                         <div className="flex items-center text-sm text-muted-foreground pt-1 space-x-2">
                            <div className="flex items-center">
                                <CalendarIcon className="mr-1.5 h-4 w-4" />
                                <span>{new Date(event.onSaleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <span className="text-muted-foreground/50">|</span>
                            <div className="flex items-center">
                                <MapPin className="mr-1.5 h-4 w-4" />
                                <span>{event.venue}</span>
                            </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow pb-3">
                        {event.description && (
                            <CardDescription className="text-sm line-clamp-3">{event.description}</CardDescription>
                        )}
                      </CardContent>
                      <CardFooter className="flex items-center justify-between pt-4 mt-auto border-t">
                        <div className="flex items-center text-xl font-bold text-primary">
                            <DollarSign className="h-5 w-5 mr-1" />
                            {event.price.toFixed(2)}
                        </div>
                        <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            View Details
                        </Button>
                      </CardFooter>
                    </a>
                  </Link>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
    
