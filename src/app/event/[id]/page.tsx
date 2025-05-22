
"use client"; // Make this a Client Component

import type { Metadata, ResolvingMetadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type TicketEvent } from '@/lib/constants';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, MapPin, DollarSign, Ticket, AlertTriangle, ArrowLeft, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react'; // Import useState and useEffect
import { LoadingSpinner } from '@/components/shared/loading-spinner'; // For loading state

interface EventDetailPageProps {
  params: { id: string };
}

// Metadata generation remains a server-side capability
// export async function generateMetadata(
//   { params }: EventDetailPageProps,
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   const event = await getEvent(params.id); // This function needs to be defined if used here
//   const previousTitle = (await parent).title?.absolute || "TicketSwift";

//   if (!event) {
//     return {
//       title: `Event Not Found | ${previousTitle}`,
//     };
//   }

//   return {
//     title: `${event.name} | ${previousTitle}`,
//     description: event.description || `Details for ${event.name}`,
//   };
// }
// For simplicity in a Client Component, we might set title dynamically via useEffect or skip generateMetadata if not critical

const getEventDisplayStatus = (event: Pick<TicketEvent, 'onSaleDate' | 'endDate'>): { text: string; variant: "secondary" | "default" | "destructive"; isActionable: boolean } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const onSale = new Date(event.onSaleDate);
  onSale.setHours(0,0,0,0);
  const end = new Date(event.endDate);
  end.setHours(0,0,0,0);

  if (today > end) {
    return { text: "Past Event", variant: "destructive", isActionable: false };
  }
  if (today >= onSale) {
    return { text: "On Sale", variant: "default", isActionable: true };
  }
  return { text: "Upcoming", variant: "secondary", isActionable: false };
};

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const [event, setEvent] = useState<TicketEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ text: string; variant: "secondary" | "default" | "destructive"; isActionable: boolean } | null>(null);
  const [flowStep, setFlowStep] = useState<'initial' | 'verification'>('initial');

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const eventDocRef = doc(db, 'events', params.id);
        const eventSnap = await getDoc(eventDocRef);

        if (eventSnap.exists()) {
          const data = eventSnap.data();
          const fetchedEvent = { 
            id: eventSnap.id, 
            ...data,
            onSaleDate: data.onSaleDate?.toDate ? data.onSaleDate.toDate().toISOString().split('T')[0] : data.onSaleDate,
            endDate: data.endDate?.toDate ? data.endDate.toDate().toISOString().split('T')[0] : data.endDate,
          } as TicketEvent;
          setEvent(fetchedEvent);
          setStatus(getEventDisplayStatus(fetchedEvent));
        } else {
          setEvent(null);
          setStatus(null);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        setEvent(null);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

  useEffect(() => {
    if (event && event.name) {
      document.title = `${event.name} | TicketSwift`;
    } else if (!event && !loading) {
      document.title = `Event Not Found | TicketSwift`;
    }
  }, [event, loading]);


  if (loading) {
    return (
      <div className="container mx-auto py-10 text-center flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!event || !status) {
    return (
      <div className="container mx-auto py-10 text-center">
        <Card className="max-w-lg mx-auto shadow-lg border-destructive">
          <CardHeader className="items-center">
             <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-2xl">Event Not Found</CardTitle>
            <CardDescription>
              The event you are looking for (ID: {params.id}) does not exist or may have been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleTicketAction = () => {
    if (flowStep === 'initial' && status.isActionable) {
      setFlowStep('verification');
      // In a real app, you might trigger an API call or some preparation here.
      // For now, we just change the button text.
    } else if (flowStep === 'verification' && status.isActionable) {
      // This is where you would initiate the actual verification number process
      // For example, calling a Genkit flow.
      alert("Initiating verification number process... (placeholder)");
      // You might want to disable the button here or show a loading state.
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <Button asChild variant="outline" size="sm" className="mb-6 hover:bg-muted/80 transition-colors">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Events
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden shadow-xl border">
        {event.imageUrl && (
          <div className="relative w-full h-72 md:h-[500px] bg-muted/50">
            <Image
              src={event.imageUrl}
              alt={event.name}
              layout="fill"
              objectFit="cover"
              data-ai-hint={event.dataAiHint || "event highlight"}
              priority 
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
             <div className="absolute bottom-0 left-0 p-6 md:p-10">
                <Badge 
                    variant={status.variant} 
                    className={`text-base px-4 py-2 mb-3 rounded-md shadow-lg
                        ${status.text === "On Sale" ? "bg-green-600 hover:bg-green-700 text-white border-green-700" : 
                          status.text === "Upcoming" ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700" :
                          "bg-red-600 hover:bg-red-700 text-white border-red-700"}`}
                >
                    {status.text}
                </Badge>
                <h1 className="text-4xl md:text-6xl font-extrabold text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>{event.name}</h1>
            </div>
          </div>
        )}
        
        <CardContent className="p-6 md:p-8 grid md:grid-cols-3 gap-8 md:gap-12">
          <div className="md:col-span-2 space-y-6">
            {!event.imageUrl && ( 
                 <div className="mb-4">
                    <Badge 
                        variant={status.variant} 
                         className={`text-sm px-3 py-1 mb-2 
                            ${status.text === "On Sale" ? "bg-green-100 text-green-700 border-green-200" : 
                              status.text === "Upcoming" ? "bg-blue-100 text-blue-700 border-blue-200" :
                              "bg-red-100 text-red-700 border-red-200"}`}
                    >
                        {status.text}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">{event.name}</h1>
                </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold mb-3 text-primary flex items-center">
                <Ticket className="mr-2 h-6 w-6" />
                Event Description
              </h2>
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {event.description || "No detailed description available for this event."}
              </p>
            </div>
          </div>

          <div className="space-y-8 md:border-l md:pl-8 md:pt-0 pt-8 border-t md:border-t-0">
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">Event Details</h3>
                <div className="flex items-start text-foreground">
                    <CalendarDays className="mr-3 h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                        <span className="font-medium">On Sale:</span><br/> 
                        {new Date(event.onSaleDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
                <div className="flex items-start text-foreground">
                    <CalendarDays className="mr-3 h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                        <span className="font-medium">Ends:</span><br/> 
                        {new Date(event.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
                <div className="flex items-start text-foreground">
                    <MapPin className="mr-3 h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                        <span className="font-medium">Venue:</span><br/> 
                        {event.venue}
                    </div>
                </div>
                <div className="flex items-center text-3xl font-bold text-primary mt-4">
                    <DollarSign className="mr-2 h-7 w-7" />
                    <span>{event.price.toFixed(2)}</span>
                </div>
            </div>
            
            <Button 
              size="lg" 
              className="w-full text-lg py-3" 
              disabled={!status.isActionable}
              onClick={handleTicketAction}
            >
              <Ticket className="mr-2 h-5 w-5" />
              {status.isActionable 
                ? (flowStep === 'initial' ? "Get Tickets Now" : "Get Verification Number") 
                : (status.text === "Upcoming" ? "Tickets Not Yet Available" : "Tickets Unavailable")}
            </Button>
            
            <Card className="mt-8 bg-secondary/20 border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-primary/90">
                  <Lightbulb className="mr-2 h-5 w-5 text-accent" />
                  AI Seat Predictor
                </CardTitle>
                <CardDescription className="text-sm">
                  Want the best chance for this event? Our AI can help predict optimal sections. (Feature coming soon for specific events)
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

