'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, Timestamp, updateDoc, collection, addDoc } from "firebase/firestore"; 
import Image from 'next/image';
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon, TicketIcon, StarIcon, DollarSignIcon, AlertTriangle, ArrowLeft, InfoIcon, ShoppingCart, FileTextIcon, LightbulbIcon } from "lucide-react"; 
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TicketEvent {
  id: string;
  name: string;
  date?: Timestamp;
  endDate?: Timestamp;
  venue: string;
  description: string;
  price: number;
  totalTickets: number;
  ticketsSold: number;
  imageUrl?: string; 
  category?: string;
  organizer?: string;
  onSaleDate?: Timestamp;
  status?: string; 
  loyaltyPointsEarned?: number; 
}

interface EventDetailPageProps {
  params: { id: string };
}

const calculateEventStatus = (event: TicketEvent | null): { text: string; badgeClass: string; isActionable: boolean } | null => {
  if (!event || !event.onSaleDate?.seconds || !event.endDate?.seconds) {
    return { text: "Status Unavailable", badgeClass: "bg-gray-500 text-white", isActionable: false };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const onSale = new Date(event.onSaleDate.seconds * 1000); 
  onSale.setHours(0, 0, 0, 0);
  const end = new Date(event.endDate.seconds * 1000); 
  end.setHours(0, 0, 0, 0);

  if (today > end) return { text: "Past Event", badgeClass: "bg-red-600 text-white", isActionable: false };
  if (today >= onSale) {
    if (event.ticketsSold >= event.totalTickets) return { text: "Sold Out", badgeClass: "bg-red-600 text-white", isActionable: false };
    return { text: "On Sale", badgeClass: "bg-green-500 text-white", isActionable: true }; 
  }
  return { text: "Upcoming", badgeClass: "bg-yellow-500 text-black", isActionable: false }; 
};

const generateRandomAlphanumeric = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default function EventDetailPage({ params: routePassedParams }: EventDetailPageProps) {
  const pathParams = useParams();
  const eventId = (pathParams.id || routePassedParams?.id) as string; 

  const [event, setEvent] = useState<TicketEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [statusInfo, setStatusInfo] = useState<{ text: string; badgeClass: string; isActionable: boolean } | null>(null); 
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number | string>("");

  const { toast } = useToast();
  const { user, loading: authLoading, updateUserLoyaltyPoints, loyaltyPoints } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        setLoadingEvent(true);
        try {
          const eventDocRef = doc(db, "events", eventId);
          const eventSnap = await getDoc(eventDocRef);
          if (eventSnap.exists()) {
            const eventData = { id: eventSnap.id, ...eventSnap.data() } as TicketEvent;
            setEvent(eventData);
            setStatusInfo(calculateEventStatus(eventData));
          } else {
            setEvent(null);
            setStatusInfo({ text: "Event Not Found", badgeClass: "bg-red-600 text-white", isActionable: false });
          }
        } catch (error) {
          console.error("Error fetching event:", error);
          toast({ title: "Error", description: "Could not fetch event details.", variant: "destructive" });
          setEvent(null);
          setStatusInfo({ text: "Error Loading", badgeClass: "bg-red-600 text-white", isActionable: false });
        }
        setLoadingEvent(false);
      };
      fetchEvent();
    }
  }, [eventId, toast]);

  const handlePurchase = async (redeemedPointsValue: number = 0) => {
    if (!user || !event || !statusInfo || !statusInfo.isActionable) return;

    const finalPrice = Math.max(0, event.price - redeemedPointsValue);
    try {
      const orderRef = await addDoc(collection(db, "users", user.uid, "orders"), {
        eventId: event.id, eventName: event.name, purchaseDate: Timestamp.now(),
        pricePaid: finalPrice, pointsRedeemed: redeemedPointsValue,
        ticketCode: `TIX-${generateRandomAlphanumeric(8)}`, status: "confirmed",
      });
      await updateDoc(doc(db, "events", event.id), { ticketsSold: (event.ticketsSold || 0) + 1 });
      if (redeemedPointsValue > 0 && updateUserLoyaltyPoints) await updateUserLoyaltyPoints(-redeemedPointsValue);
      
      const pointsAwardedForPurchase = (event.loyaltyPointsEarned && event.loyaltyPointsEarned > 0 && finalPrice > 0)
        ? Math.floor(finalPrice * (event.loyaltyPointsEarned / 100))
        : 0;
      if (pointsAwardedForPurchase > 0 && updateUserLoyaltyPoints) await updateUserLoyaltyPoints(pointsAwardedForPurchase);

      toast({ title: "Purchase Successful!", description: `Ticket for ${event.name} purchased. Code: ${orderRef.id.substring(0,8)}. You earned ${pointsAwardedForPurchase} points.` });
    } catch (error) {
      console.error("Error during purchase:", error);
      toast({ title: "Purchase Failed", description: "Please try again.", variant: "destructive" });
    }
    setShowRedeemDialog(false); setPointsToRedeem("");
  };

  const handleRedeemPoints = () => {
    const points = Number(pointsToRedeem);
    if (isNaN(points) || points < 0 || points > (loyaltyPoints || 0)) {
      toast({ title: "Invalid Points", description: `Enter valid points, up to ${loyaltyPoints || 0}.`, variant: "destructive" });
      return;
    }
    handlePurchase(points);
  };

  if (loadingEvent || authLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-300">Loading event details...</p></div>;
  if (!event || !statusInfo) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 p-8 rounded-lg shadow-2xl text-center max-w-md w-full">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4 mx-auto" />
          <h2 className="text-2xl font-bold text-white mb-2">Event Not Found</h2>
          <p className="text-gray-400 mb-6">ID: {eventId || 'Unknown'} not found.</p>
          <Button asChild variant="outline" className="text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white">
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Link>
          </Button>
      </div>
    </div>
  );

  const imageUrl = event.imageUrl;
  let isValidDisplayUrl = false;
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('https://firebasestorage.googleapis.com/')) {
    try { new URL(imageUrl); isValidDisplayUrl = true; } catch (e) { console.error('Invalid image URL:', imageUrl, e); }
  }
  
  const calculatedPointsEarned = (event.loyaltyPointsEarned && event.loyaltyPointsEarned > 0 && event.price > 0)
    ? Math.floor(event.price * (event.loyaltyPointsEarned / 100))
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 py-6">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6 text-gray-400 hover:text-gray-200" asChild>
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Events</Link>
        </Button>

        <div className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] mb-8 shadow-2xl rounded-lg overflow-hidden group">
          {isValidDisplayUrl && imageUrl ? (
            <Image src={imageUrl} alt={event.name || "Event image"} layout="fill" objectFit="cover" priority unoptimized={true} className="transition-transform duration-300 group-hover:scale-105"/>
          ) : (
            <div className="h-full w-full bg-gray-800 flex items-center justify-center"><TicketIcon className="h-32 w-32 text-gray-600" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 sm:p-6 md:p-8 flex flex-col justify-end">
            {statusInfo && (
              <Badge className={`text-xs md:text-sm px-3 py-1 self-start mb-2 md:mb-3 shadow-md ${statusInfo.badgeClass}`}>
                {statusInfo.text}
              </Badge>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {event.name}
            </h1>
          </div>
        </div>
        
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
              <div className="flex items-center mb-4">
                <FileTextIcon className="h-6 w-6 mr-3 text-purple-400" />
                <h2 className="text-xl sm:text-2xl font-semibold text-purple-400">Event Description</h2>
              </div>
              {/* Simplified event description rendering to isolate the error */}
              <div className="text-sm sm:text-base text-gray-300 whitespace-pre-line leading-relaxed space-y-3">
                <p>{event.description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:sticky md:top-6 h-fit">
            <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
              <h3 className="text-xl md:text-2xl font-semibold text-gray-100 mb-6">Event Details</h3>
              <div className="space-y-5">
                {[ { icon: CalendarIcon, label: "On Sale:", value: event.onSaleDate && new Date(event.onSaleDate.seconds * 1000).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) },
                  { icon: CalendarIcon, label: "Ends:", value: event.endDate && new Date(event.endDate.seconds * 1000).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) },
                  { icon: MapPinIcon, label: "Venue:", value: event.venue },
                  (calculatedPointsEarned > 0 && { icon: StarIcon, label: "Points Earned:", value: `${calculatedPointsEarned} points` })
                ].filter(Boolean).map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <item.icon className={`h-5 w-5 ${item.label === "Points Earned:" ? "text-yellow-500" : "text-gray-400"} mt-0.5`} />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">{item.label}</p>
                      <p className="text-sm sm:text-base font-medium text-gray-200">{item.value}</p>
                    </div>
                  </div>
                ))}

                <div className="border-t border-gray-700 pt-5">
                  <div className="flex items-center gap-2 md:gap-3">
                    <DollarSignIcon className="h-7 w-7 md:h-8 md:w-8 text-purple-400" />
                    <span className="text-3xl md:text-4xl font-bold text-purple-400">
                      ${event.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-3">
                  {statusInfo.isActionable && (
                    <Button size="lg" className="w-full h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg bg-purple-600 hover:bg-purple-700 text-white" onClick={() => user ? setShowRedeemDialog(true) : router.push(`/login?redirect=/event/${eventId}`)}>
                      <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      {user ? "Get Verification Code" : "Login to Get Code"}
                    </Button>
                  )}
                  {!statusInfo.isActionable && (
                    <Button size="lg" className="w-full h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg bg-gray-700 text-gray-400 cursor-not-allowed" disabled>
                      <InfoIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />{statusInfo.text}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
              <div className="flex items-center mb-3">
                <LightbulbIcon className="h-6 w-6 mr-3 text-yellow-400" />
                <h4 className="text-lg font-semibold text-yellow-400">AI Seat Predictor</h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Want the best chance for this event? Our AI can help predict optimal sections. (Feature coming soon for specific events)
              </p>
            </div>
          </div>
        </div>
      </div>

      {user && event && (
        <AlertDialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-100">Redeem Loyalty Points</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                You have {loyaltyPoints || 0} loyalty points. Ticket price: ${event.price?.toFixed(2) || '0.00'}.
                Use points for a discount?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="points" className="text-right text-gray-300">Points to Redeem</Label>
                <Input id="points" type="number" value={pointsToRedeem} onChange={(e) => setPointsToRedeem(e.target.value)} className="col-span-3 bg-gray-800 text-gray-200 border-gray-700 focus:ring-purple-500" max={loyaltyPoints || 0} min="0"/>
              </div>
            </div>
            <AlertDialogFooter>
              <Button variant="outline" className="text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white" onClick={() => handlePurchase(0)}>No, Purchase Full Price</Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleRedeemPoints} disabled={Number(pointsToRedeem) <= 0 || Number(pointsToRedeem) > (loyaltyPoints || 0)} >Redeem & Purchase</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
