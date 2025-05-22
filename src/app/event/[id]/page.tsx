
"use client"; 

import type { Metadata, ResolvingMetadata } from 'next';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type TicketEvent } from '@/lib/constants';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, MapPin, DollarSign, Ticket, AlertTriangle, ArrowLeft, Lightbulb, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react'; 
import { LoadingSpinner } from '@/components/shared/loading-spinner'; 
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';

interface EventDetailPageProps {
  params: { id: string };
}

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

const generateRandomAlphanumeric = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const [event, setEvent] = useState<TicketEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ text: string; variant: "secondary" | "default" | "destructive"; isActionable: boolean } | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user

  // State for the ticket flow
  const [flowStep, setFlowStep] = useState<'initial' | 'verification' | 'payment' | 'purchased'>('initial');
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [hasAlreadyPurchased, setHasAlreadyPurchased] = useState(false); // Mock state

  useEffect(() => {
    const fetchEventAndPurchaseStatus = async () => {
      setLoading(true);
      try {
        const eventDocRef = doc(db, 'events', params.id);
        const eventSnap = await getDoc(eventDocRef);

        if (eventSnap.exists()) {
          const data = eventSnap.data();
          const onSaleDateString = data.onSaleDate instanceof Timestamp 
            ? data.onSaleDate.toDate().toISOString().split('T')[0] 
            : data.onSaleDate;
          const endDateString = data.endDate instanceof Timestamp 
            ? data.endDate.toDate().toISOString().split('T')[0] 
            : data.endDate;

          const fetchedEvent = { 
            id: eventSnap.id, 
            ...data,
            onSaleDate: onSaleDateString,
            endDate: endDateString,
          } as TicketEvent;
          setEvent(fetchedEvent);
          const currentStatus = getEventDisplayStatus(fetchedEvent);
          setStatus(currentStatus);

          // MOCK: Simulate checking if user already purchased
          // In a real app, query Firestore: users/{userId}/eventVerifications/{eventId}
          if (user && params.id === "evt1_mock_on_sale") { // Example: user bought event with this ID
            // setHasAlreadyPurchased(true);
            // setVerificationCode("MOCKPURCHASED123"); // Load their existing code
            // setFlowStep('purchased');
          } else {
            // For testing the new flow directly if not "already purchased"
             // setFlowStep('initial'); 
          }

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
      fetchEventAndPurchaseStatus();
    }
  }, [params.id, user]); // Add user to dependency array for purchase check

  useEffect(() => {
    if (event && event.name) {
      document.title = `${event.name} | TicketSwift`;
    } else if (!event && !loading) {
      document.title = `Event Not Found | TicketSwift`;
    }
  }, [event, loading]);

  const handleTicketAction = async () => {
    if (!user) {
        toast({ title: "Authentication Required", description: "Please log in to get tickets.", variant: "destructive"});
        return;
    }

    if (flowStep === 'initial' && status?.isActionable) {
      // Generate and "store" verification code
      const code = generateRandomAlphanumeric(16);
      setVerificationCode(code);
      setFlowStep('verification');
      // TODO: In a real app, save this code to Firestore associated with user & event
      // e.g., await setDoc(doc(db, `users/${user.uid}/eventVerifications`, event.id), { code, eventName: event.name, purchaseDate: serverTimestamp() });
      toast({ title: "Verification Code Generated!", description: "Proceed to the next step." });
    } else if (flowStep === 'verification' && status?.isActionable) {
      // This is where you would initiate the actual payment process
      setFlowStep('payment'); // Move to a payment step (placeholder)
      toast({title: "Payment Step", description: "Redirecting to payment gateway... (placeholder)"});
      // Simulate payment success for now
      setTimeout(() => {
        toast({title: "Payment Successful (Simulated)", description: "Your verification is confirmed."});
        setFlowStep('purchased'); // Mark as purchased
        setHasAlreadyPurchased(true); // For future page loads
      }, 2000);
    }
  };

  const copyToClipboard = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode)
        .then(() => {
          toast({ title: "Copied!", description: "Verification code copied to clipboard." });
        })
        .catch(err => {
          toast({ title: "Copy Failed", description: "Could not copy code.", variant: "destructive" });
          console.error('Failed to copy: ', err);
        });
    }
  };

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

  const mainButtonText = () => {
    if (hasAlreadyPurchased || flowStep === 'purchased') return "Code Obtained";
    if (flowStep === 'initial') return "Get Tickets Now";
    if (flowStep === 'verification') return "Get Verification Number"; // Or "Proceed to Payment"
    if (flowStep === 'payment') return "Processing Payment...";
    return "Tickets Unavailable";
  };

  const isButtonDisabled = () => {
    if (hasAlreadyPurchased || flowStep === 'purchased' || flowStep === 'payment') return true;
    return !status.isActionable;
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
              fill 
              style={{ objectFit: "cover" }} 
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
            
            {hasAlreadyPurchased && (
              <Alert variant="default" className="bg-green-50 border-green-200 text-green-700">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="font-semibold">Already Obtained</AlertTitle>
                <AlertDescription>
                  You have already obtained a verification code for this event.
                </AlertDescription>
              </Alert>
            )}

            {(flowStep === 'verification' || flowStep === 'purchased' || hasAlreadyPurchased) && verificationCode && (
              <Card className="bg-secondary/20 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-primary/90">
                    Your Verification Code
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Use this code in the TicketSwift desktop application to run the ticket-snatching script for this event.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      id="verificationCode"
                      type={showVerificationCode ? "text" : "password"}
                      value={verificationCode}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setShowVerificationCode(!showVerificationCode)} aria-label={showVerificationCode ? "Hide code" : "Show code"}>
                      {showVerificationCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={copyToClipboard} aria-label="Copy code">
                      <Copy className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Button 
              size="lg" 
              className="w-full text-lg py-3" 
              disabled={isButtonDisabled()}
              onClick={handleTicketAction}
            >
              <Ticket className="mr-2 h-5 w-5" />
              {mainButtonText()}
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

