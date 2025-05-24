
"use client";

import { useState, useEffect } from "react";
import { type TicketEvent } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Settings, AlertTriangle, DollarSign, Image as ImageIcon, CalendarDays, Sparkles, Star, Link as LinkIcon } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, Timestamp, onSnapshot, query, where, writeBatch } from "firebase/firestore";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ScrollArea } from "@/components/ui/scroll-area";

const eventSchemaBase = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters."),
  venue: z.string().min(3, "Venue name must be at least 3 characters."),
  onSaleDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid on-sale date format."),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date format."),
  price: z.coerce.number().positive("Price must be a positive number."),
  pointsAwarded: z.coerce.number().int().nonnegative("Points awarded must be a non-negative integer.").optional().default(0),
  imageUrl: z.string().url("Must be a valid URL for the image.").optional().or(z.literal("")),
  activityUrl: z.string().url("Must be a valid URL for the ticketing page.").min(1, "Activity URL is required."), 
  description: z.string().optional(),
  dataAiHint: z.string().optional(),
  prefix: z.string().max(10, "Prefix cannot exceed 10 characters.").optional().or(z.literal("")),
});

const eventSchema = eventSchemaBase.refine(
  (data) => {
    if (data.onSaleDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.onSaleDate);
    }
    return true;
  },
  {
    message: "End date must be on or after the on-sale date.",
    path: ["endDate"],
  }
);

type EventFormValues = z.infer<typeof eventSchema>;

const isTimestamp = (value: any): value is Timestamp => {
  return value !== null && typeof value === 'object' && typeof value.toDate === 'function';
};

const getEventComputedStatus = (event: Pick<TicketEvent, 'onSaleDate' | 'endDate'>): { text: string; variant: "secondary" | "default" | "destructive" } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const onSaleDateValue = event.onSaleDate;
  const onSale = onSaleDateValue ? new Date(isTimestamp(onSaleDateValue) ? onSaleDateValue.toDate() : String(onSaleDateValue)) : null;

  const endDateValue = event.endDate;
  const end = endDateValue ? new Date(isTimestamp(endDateValue) ? endDateValue.toDate() : String(endDateValue)) : null;

  if (!onSale || !end || isNaN(onSale.getTime()) || isNaN(end.getTime())) return { text: "Invalid Date", variant: "destructive" };

  onSale.setHours(0,0,0,0);
  end.setHours(0,0,0,0);

  if (today > end) {
    return { text: "Past", variant: "destructive" };
  }
  if (today >= onSale) {
    return { text: "On Sale", variant: "default" };
  }
  return { text: "Upcoming", variant: "secondary" };
};

export function EventManager() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TicketEvent | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      venue: "",
      price: 0,
      pointsAwarded: 0,
      imageUrl: "",
      activityUrl: "", 
      description: "",
      dataAiHint: "",
      onSaleDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
      prefix: "",
    }
  });

  const watchedImageUrl = watch("imageUrl");

  useEffect(() => {
    if (!user || !isAdmin) {
      setIsLoadingEvents(false);
      return;
    }
    setIsLoadingEvents(true);
    const eventsCollectionRef = collection(db, "events");
    
    const unsubscribe = onSnapshot(query(eventsCollectionRef), (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        const onSaleDateValue = data.onSaleDate;
        const onSaleDateString = isTimestamp(onSaleDateValue)
            ? onSaleDateValue.toDate().toISOString().split('T')[0] 
            : (typeof onSaleDateValue === 'string' ? onSaleDateValue : '');

        const endDateValue = data.endDate;
        const endDateString = isTimestamp(endDateValue)
            ? endDateValue.toDate().toISOString().split('T')[0] 
            : (typeof endDateValue === 'string' ? endDateValue : '');

        return {
            id: doc.id,
            ...data,
            onSaleDate: onSaleDateString,
            endDate: endDateString,
            pointsAwarded: data.pointsAwarded || 0,
            activityUrl: data.activityUrl || "", 
        } as TicketEvent;
      }).sort((a, b) => {
        const dateA = a.onSaleDate ? new Date(a.onSaleDate).getTime() : 0;
        const dateB = b.onSaleDate ? new Date(b.onSaleDate).getTime() : 0;
        if (isNaN(dateA) || isNaN(dateB)) return 0;
        return dateB - dateA;
      });
      setEvents(fetchedEvents);
      setIsLoadingEvents(false);
    }, (error) => {
      console.error("Error fetching events: ", error);
      toast({ title: "Error", description: "Could not fetch events from database.", variant: "destructive" });
      setIsLoadingEvents(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin, toast]);

 useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page.",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [authLoading, isAdmin, router, toast]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    const today = new Date().toISOString().split('T')[0];
    const weekLater = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0];
    reset({
      name: "",
      venue: "",
      onSaleDate: today,
      endDate: weekLater,
      price: 0,
      pointsAwarded: 0,
      imageUrl: "",
      activityUrl: "", 
      description: "",
      dataAiHint: "",
      prefix: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditEvent = (event: TicketEvent) => {
    setEditingEvent(event);
    reset({
        name: event.name,
        venue: event.venue,
        onSaleDate: event.onSaleDate,
        endDate: event.endDate,
        price: event.price,
        pointsAwarded: event.pointsAwarded || 0,
        imageUrl: event.imageUrl || "",
        activityUrl: event.activityUrl || "", 
        description: event.description || "",
        dataAiHint: event.dataAiHint || "",
        prefix: (event as any).prefix || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId));
      toast({ title: "Event Deleted", description: "The event has been removed from Firestore." });
    } catch (error) {
      console.error("Error deleting event: ", error);
      toast({ title: "Error", description: "Could not delete event.", variant: "destructive" });
    }
  };

  const onSubmit: SubmitHandler<EventFormValues> = async (data) => {
    if (!user || !isAdmin) {
      toast({ title: "Unauthorized", description: "You are not authorized to perform this action.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const onSaleTimestamp = Timestamp.fromDate(new Date(data.onSaleDate));
      const endTimestamp = Timestamp.fromDate(new Date(data.endDate));
      
      const eventDataToSave: any = {
        ...data,
        onSaleDate: onSaleTimestamp, 
        endDate: endTimestamp,     
        price: Number(data.price),
        pointsAwarded: Number(data.pointsAwarded || 0),
        activityUrl: data.activityUrl, 
        prefix: data.prefix || "",
      };

      if (editingEvent) {
        const eventRef = doc(db, "events", editingEvent.id);
        await updateDoc(eventRef, eventDataToSave);
        toast({ title: "Event Updated", description: "The event has been successfully updated in Firestore." });
      } else {
        const newEventId = `evt${Date.now()}`;
        const newEventRef = doc(db, "events", newEventId);
        await setDoc(newEventRef, { id: newEventId, ...eventDataToSave });
        toast({ title: "Event Added", description: "The new event has been successfully added to Firestore." });
      }
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      console.error("Error saving event: ", error);
      toast({ title: "Error", description: "Could not save event to Firestore.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCleanUpExpiredVerifications = async () => {
    setIsCleaningUp(true);
    const today = new Date();
    today.setHours(0,0,0,0);
    let deletedCount = 0;

    try {
      const eventsQuery = query(collection(db, "events"));
      const eventsSnapshot = await getDocs(eventsQuery);
      
      const allEvents = eventsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      const pastEvents = allEvents.filter((event: any) => {
        const eventEndDateValue = event.endDate;
         if (!eventEndDateValue) return false;

        const eventEndDate = isTimestamp(eventEndDateValue)
            ? eventEndDateValue.toDate() 
            : (typeof eventEndDateValue === 'string' ? new Date(eventEndDateValue) : null);

        if (!eventEndDate || isNaN(eventEndDate.getTime())) return false;

        eventEndDate.setHours(23,59,59,999);
        return eventEndDate < today;
      });

      if (pastEvents.length === 0) {
        toast({ title: "No Past Events", description: "There are no past events with verifications to clean up." });
        setIsCleaningUp(false);
        return;
      }

      const batch = writeBatch(db);

      for (const event of pastEvents) {
        const verificationsQuery = query(collection(db, "userEventVerifications"), where("eventId", "==", event.id));
        const verificationsSnapshot = await getDocs(verificationsQuery);
        
        if (!verificationsSnapshot.empty) {
          verificationsSnapshot.forEach(verificationDoc => {
            batch.delete(verificationDoc.ref);
            deletedCount++;
          });
        }
      }

      if (deletedCount > 0) {
        await batch.commit();
        toast({ title: "Cleanup Successful", description: `Successfully deleted ${deletedCount} verification codes for past events.` });
      } else {
        toast({ title: "No Codes to Clean", description: "No verification codes found for past events." });
      }

    } catch (error) {
      console.error("Error cleaning up expired verifications:", error);
      toast({ title: "Cleanup Failed", description: "An error occurred during cleanup. Check console for details.", variant: "destructive" });
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (authLoading || (isLoadingEvents && user && isAdmin)) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={48} /></div>;
  }

  if (!isAdmin && !authLoading) {
     return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You do not have administrative privileges to manage events.
            </p>
            <Button onClick={() => router.push('/')} className="mt-6">Go to Dashboard</Button>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <CalendarDays className="h-8 w-8 text-primary" /> Event Management
        </h2>
        <Button onClick={handleAddEvent} disabled={isSubmitting}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* Ensure DialogContent allows internal scrolling if content overflows its max height */}
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update the details of the existing event." : "Fill in the details for the new event."}
            </DialogDescription>
          </DialogHeader>
          {/* Form should allow its content (ScrollArea) to grow and handle overflow */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-grow overflow-hidden">
            {/* ScrollArea will contain all form fields and manage their scrolling */}
            <ScrollArea className="flex-grow min-h-0 p-1 pr-2"> {/* Added small right padding for scrollbar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 py-4"> {/* Adjusted gap-y */}
                
                <div className="md:col-span-2">
                  <Label htmlFor="name">Event Name</Label>
                  <Input id="name" {...register("name")} disabled={isSubmitting} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div>
                  <Label htmlFor="onSaleDate">On Sale Date</Label>
                  <Input id="onSaleDate" type="date" {...register("onSaleDate")} disabled={isSubmitting} />
                  {errors.onSaleDate && <p className="text-sm text-destructive">{errors.onSaleDate.message}</p>}
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" {...register("endDate")} disabled={isSubmitting} />
                  {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
                </div>

                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input id="venue" {...register("venue")} disabled={isSubmitting} />
                  {errors.venue && <p className="text-sm text-destructive">{errors.venue.message}</p>}
                </div>

                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="price" type="number" step="0.01" {...register("price")} className="pl-7" disabled={isSubmitting} />
                  </div>
                  {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                </div>
                
                {/* Points Awarded - now paired with Prefix */}
                <div>
                  <Label htmlFor="pointsAwarded">Points Awarded</Label>
                  <div className="relative">
                    <Star className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="pointsAwarded" type="number" {...register("pointsAwarded")} className="pl-7" disabled={isSubmitting} />
                  </div>
                  {errors.pointsAwarded && <p className="text-sm text-destructive">{errors.pointsAwarded.message}</p>}
                </div>

                {/* Verification Code Prefix - now paired with Points Awarded */}
                <div>
                  <Label htmlFor="prefix">Verification Code Prefix <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                  <Input id="prefix" {...register("prefix")} placeholder="e.g., BP2025-" disabled={isSubmitting} />
                  {errors.prefix && <p className="text-sm text-destructive">{errors.prefix.message}</p>}
                </div>

                {/* Ticketing Page URL - takes full width */}
                <div className="md:col-span-2">
                  <Label htmlFor="activityUrl">Ticketing Page URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="activityUrl" placeholder="https://example.com/ticket-page" {...register("activityUrl")} className="pl-7" disabled={isSubmitting} />
                  </div>
                  {errors.activityUrl && <p className="text-sm text-destructive">{errors.activityUrl.message}</p>}
                </div>

                {/* Image URL - takes full width */}
                <div className="md:col-span-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input id="imageUrl" placeholder="https://placehold.co/600x400.png" {...register("imageUrl")} disabled={isSubmitting} />
                  {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
                  {watchedImageUrl && (
                    <div className="mt-2 relative w-full h-32 overflow-hidden rounded border">
                      <Image src={watchedImageUrl} alt="Preview" fill style={{objectFit:"contain"}} data-ai-hint="image preview" />
                    </div>
                  )}
                </div>

                {/* Image AI Hint - takes full width */}
                <div className="md:col-span-2">
                  <Label htmlFor="dataAiHint">Image AI Hint (for placeholders)</Label>
                  <Input id="dataAiHint" placeholder="e.g., concert band" {...register("dataAiHint")} disabled={isSubmitting} />
                  {errors.dataAiHint && <p className="text-sm text-destructive">{errors.dataAiHint.message}</p>}
                </div>

                {/* Description - takes full width */}
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register("description")} rows={3} disabled={isSubmitting} />
                  {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

              </div>
            </ScrollArea>
            <DialogFooter className="mt-auto pt-4 border-t"> {/* Added border-t for visual separation */}
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner className="mr-2" /> : (editingEvent ? "Save Changes" : "Add Event")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <Table>
          <TableCaption>A list of all ticket events from Firestore.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>On Sale Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Activity URL</TableHead> 
              <TableHead>Current Status</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const computedStatus = getEventComputedStatus(event);
              const validOnSaleDate = typeof event.onSaleDate === 'string' && event.onSaleDate ? event.onSaleDate : new Date().toISOString();
              const validEndDate = typeof event.endDate === 'string' && event.endDate ? event.endDate : new Date().toISOString();

              return (
              <TableRow key={event.id}>
                <TableCell>
                  {event.imageUrl ? (
                    <div className="relative h-16 w-24 rounded overflow-hidden border">
                      <Image src={event.imageUrl} alt={event.name} fill style={{objectFit:"cover"}} data-ai-hint={event.dataAiHint || "event image"} />
                    </div>
                  ) : (
                    <div className="flex h-16 w-24 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>{new Date(validOnSaleDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(validEndDate).toLocaleDateString()}</TableCell>
                <TableCell>{event.venue}</TableCell>
                <TableCell>${event.price.toFixed(2)}</TableCell>
                <TableCell>{event.pointsAwarded || 0}</TableCell>
                <TableCell>
                  {event.activityUrl ? 
                    <a 
                      href={event.activityUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline truncate block max-w-[150px]"
                      title={event.activityUrl}
                    >
                      {event.activityUrl}
                    </a> : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={computedStatus.variant} className={
                      computedStatus.text === "On Sale" ? "bg-green-100 text-green-700" :
                      computedStatus.text === "Upcoming" ? "bg-blue-100 text-blue-700" :
                      computedStatus.text === "Past" ? "bg-red-100 text-red-700" : ""
                  }>
                    {computedStatus.text}
                  </Badge>
                </TableCell>
                <TableCell>{(event as any).prefix || "-"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEditEvent(event)} disabled={isSubmitting || isCleaningUp}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive" size="icon" disabled={isSubmitting || isCleaningUp}>
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the event &quot;{event.name}&quot; from Firestore.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCleaningUp}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteEvent(event.id)} disabled={isCleaningUp} className="bg-destructive hover:bg-destructive/90">
                          Yes, delete event
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            );
          })}
          </TableBody>
        </Table>
         {events.length === 0 && !isLoadingEvents && (
            <div className="text-center p-8 text-muted-foreground">
                No events found in Firestore. Click "Add New Event" to get started.
            </div>
        )}
         {isLoadingEvents && (
            <div className="text-center p-8 text-muted-foreground">
                <LoadingSpinner /> Loading events...
            </div>
        )}
      </Card>

      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Data Maintenance
          </CardTitle>
          <CardDescription>
            Manage and clean up data related to events and verifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isCleaningUp}>
                {isCleaningUp ? <LoadingSpinner className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                {isCleaningUp ? "Cleaning Up..." : "Clean Up Expired Verifications"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete all verification codes associated with events whose end date has passed. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isCleaningUp}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanUpExpiredVerifications} disabled={isCleaningUp} className="bg-destructive hover:bg-destructive/90">
                  {isCleaningUp ? <LoadingSpinner className="mr-2" /> : null}
                  Yes, delete them
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <p className="text-sm text-muted-foreground mt-2">
            This will remove verification codes for events that have already finished.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
