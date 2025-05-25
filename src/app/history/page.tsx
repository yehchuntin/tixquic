"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { AlertTriangle, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface UserVerification {
  id: string;
  eventId: string;
  eventName?: string; // To be populated after fetching event details
  verificationCode: string;
  userPreferences: {
    ticketCount: number;
    seatKeywords: string;
  };
  activityUrl?: string;
  activityActualDate: Timestamp | string; // Can be Timestamp from Firestore or string after parsing
  createdAt: Timestamp;
  status: "active" | "used" | "expired";
}

interface EventDetails {
    id: string;
    name: string;
    activityActualDate: Timestamp | string; 
    // Add other event fields you might want to display if necessary
}

export default function PurchaseHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [verifications, setVerifications] = useState<UserVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for authentication to resolve

    if (!user) {
      setIsLoading(false);
      // Optional: Redirect to login or show message
      // setError("Please log in to view your purchase history.");
      return;
    }

    const fetchVerifications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const verificationsQuery = query(
          collection(db, "userEventVerifications"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(verificationsQuery);
        const userVerifications: UserVerification[] = [];

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data() as Omit<UserVerification, 'id' | 'eventName'>;
          
          // Fetch event details to get eventName and ensure activityActualDate is correct
          let eventName = "Event details not found";
          let eventActivityActualDate = data.activityActualDate; // Fallback to data from verification record

          if (data.eventId) {
            const eventDocRef = doc(db, "events", data.eventId);
            const eventDocSnap = await getDoc(eventDocRef);
            if (eventDocSnap.exists()) {
              const eventData = eventDocSnap.data() as EventDetails;
              eventName = eventData.name || eventName;
              // Prefer event's actual date from event collection if available and more up-to-date
              eventActivityActualDate = eventData.activityActualDate || data.activityActualDate;
            }
          }

          userVerifications.push({
            id: docSnap.id,
            ...data,
            eventName: eventName,
            activityActualDate: eventActivityActualDate, // Use potentially updated date
          });
        }
        
        // Sort by creation date, newest first
        userVerifications.sort((a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());

        setVerifications(userVerifications);
      } catch (err) {
        console.error("Error fetching verification history:", err);
        setError("Failed to load your purchase history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerifications();
  }, [user, authLoading]);

  const getVerificationStatus = (verification: UserVerification): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const actualEventDateRaw = verification.activityActualDate;
    let actualEventEnd: Date | null = null;
    if (actualEventDateRaw) {
        if (isTimestamp(actualEventDateRaw)) {
            actualEventEnd = actualEventDateRaw.toDate();
        } else if (typeof actualEventDateRaw === 'string') {
            actualEventEnd = new Date(actualEventDateRaw);
        }
    }

    if (actualEventEnd) {
        actualEventEnd.setHours(23, 59, 59, 999); // Event is considered over at the end of its day
        if (today > actualEventEnd) {
          return { text: "Expired (Event Over)", variant: "destructive" };
        }
    }
    
    if (verification.status === "used") {
        return { text: "Used", variant: "outline" };
    }
    // Add more sophisticated status checks if needed, e.g. if code sale period is also a factor for 'active'
    return { text: "Active", variant: "default" }; // Default to active if not expired or used
  };

  if (authLoading || isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner size={48} /></div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">Please log in to view your purchase history.</p>
        <Button asChild className="mt-6"><Link href="/login">Go to Login</Link></Button>
      </div>
    );
  }
  
  if (error) {
    return (
        <div className="container mx-auto py-10 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-2xl font-bold">Error</h1>
            <p className="mt-2 text-muted-foreground">{error}</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-8">
        <History className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold">Purchase History</h1>
      </div>

      {verifications.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Purchases Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You haven't purchased any event verifications yet. 
              <Link href="/" className="text-primary hover:underline">Browse events</Link> to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {verifications.map((verification) => {
            const status = getVerificationStatus(verification);
            const actualDate = verification.activityActualDate;
            let displayActualDate = "N/A";
            if (actualDate) {
                if (isTimestamp(actualDate)) {
                    displayActualDate = actualDate.toDate().toLocaleDateString();
                } else if (typeof actualDate === 'string') {
                    displayActualDate = new Date(actualDate).toLocaleDateString();
                }
            }

            return (
              <Card key={verification.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{verification.eventName || "Event Details Unavailable"}</CardTitle>
                      <CardDescription className="text-sm">
                        Purchased on: {isTimestamp(verification.createdAt) ? verification.createdAt.toDate().toLocaleDateString() : "Unknown"}
                      </CardDescription>
                    </div>
                    <Badge variant={status.variant} className="ml-auto">{status.text}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">Verification Code:</h4>
                    <p className="text-lg font-mono bg-muted p-2 rounded break-all">{verification.verificationCode}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Actual Event Date:</h4>
                    <p>{displayActualDate}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Your Preferences:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      <li>Tickets: {verification.userPreferences.ticketCount}</li>
                      <li>Seat Keywords: {verification.userPreferences.seatKeywords || "Not set"}</li>
                    </ul>
                  </div>
                  {verification.activityUrl && (
                    <div>
                      <h4 className="font-semibold text-sm">Event Ticketing Page:</h4>
                      <a 
                        href={verification.activityUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-primary hover:underline truncate block"
                      >
                        {verification.activityUrl}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function isTimestamp(value: any): value is Timestamp {
  return value && typeof value.toDate === 'function';
}
