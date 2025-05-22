
"use client";

import { useState, useEffect } from "react";
import { MOCK_EVENTS, type TicketEvent } from "@/lib/constants";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Settings, AlertTriangle, DollarSign, Image as ImageIcon, CalendarDays } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const eventSchemaBase = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Event name must be at least 3 characters."),
  venue: z.string().min(3, "Venue name must be at least 3 characters."),
  onSaleDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid on-sale date format."),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date format."),
  price: z.coerce.number().positive("Price must be a positive number."),
  imageUrl: z.string().url("Must be a valid URL for the image.").optional().or(z.literal("")),
  description: z.string().optional(),
  dataAiHint: z.string().optional(),
});

const eventSchema = eventSchemaBase.refine(
  (data) => {
    if (data.onSaleDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.onSaleDate);
    }
    return true;
  },
  {
    message: "End date must be after the on-sale date.",
    path: ["endDate"], // Path of the error
  }
);

type EventFormValues = z.infer<typeof eventSchema>;

const getEventComputedStatus = (event: Pick<TicketEvent, 'onSaleDate' | 'endDate'>): { text: string; variant: "secondary" | "default" | "destructive" } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const onSale = new Date(event.onSaleDate);
  onSale.setHours(0,0,0,0);
  const end = new Date(event.endDate);
  end.setHours(0,0,0,0);

  if (today >= end) {
    return { text: "Past", variant: "destructive" };
  }
  if (today >= onSale) {
    return { text: "On Sale", variant: "default" };
  }
  return { text: "Upcoming", variant: "secondary" };
};


export function EventManager() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TicketEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setEvents(MOCK_EVENTS);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      price: 0,
      imageUrl: "",
      description: "",
      dataAiHint: "",
      onSaleDate: new Date().toISOString().split('T')[0], // Default to today
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], // Default to a week from today
    }
  });

  const watchedImageUrl = watch("imageUrl");

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
      id: undefined, 
      name: "", 
      venue: "", 
      onSaleDate: today, 
      endDate: weekLater, 
      price: 0, 
      imageUrl: "", 
      description: "", 
      dataAiHint: "" 
    });
    setIsDialogOpen(true);
  };

  const handleEditEvent = (event: TicketEvent) => {
    setEditingEvent(event);
    reset(event); 
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter((event) => event.id !== eventId));
    toast({ title: "Event Deleted", description: "The event has been successfully removed from the list." });
  };

  const onSubmit: SubmitHandler<EventFormValues> = (data) => {
    if (editingEvent) {
      setEvents(prevEvents => prevEvents.map((event) => (event.id === editingEvent.id ? { ...event, ...data, id: editingEvent.id } : event)));
      toast({ title: "Event Updated", description: "The event has been successfully updated." });
    } else {
      const newEventWithId = { ...data, id: `evt${Date.now()}` };
      setEvents(prevEvents => [...prevEvents, newEventWithId]);
      toast({ title: "Event Added", description: "The new event has been successfully added." });
    }
    setIsDialogOpen(false);
    reset();
  };
  
  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><Settings className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
     return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You do not have administrative privileges to manage events.</p>
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
        <Button onClick={handleAddEvent}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update the details of the existing event." : "Fill in the details for the new event."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Event Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="onSaleDate">On Sale Date</Label>
              <Input id="onSaleDate" type="date" {...register("onSaleDate")} />
              {errors.onSaleDate && <p className="text-sm text-destructive">{errors.onSaleDate.message}</p>}
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>

            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" {...register("venue")} />
              {errors.venue && <p className="text-sm text-destructive">{errors.venue.message}</p>}
            </div>

            <div>
              <Label htmlFor="price">Price ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="price" type="number" step="0.01" {...register("price")} className="pl-7" />
              </div>
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" placeholder="https://placehold.co/600x400.png" {...register("imageUrl")} />
              {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
              {watchedImageUrl && (
                <div className="mt-2 relative w-full h-32 overflow-hidden rounded border">
                  <Image src={watchedImageUrl} alt="Preview" layout="fill" objectFit="contain" />
                </div>
              )}
            </div>

             <div className="md:col-span-2">
              <Label htmlFor="dataAiHint">Image AI Hint (for placeholders)</Label>
              <Input id="dataAiHint" placeholder="e.g., concert band" {...register("dataAiHint")} />
              {errors.dataAiHint && <p className="text-sm text-destructive">{errors.dataAiHint.message}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} rows={3} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <DialogFooter className="md:col-span-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{editingEvent ? "Save Changes" : "Add Event"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <Table>
          <TableCaption>A list of all ticket events. Changes here are for this admin session (prototype).</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>On Sale Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const computedStatus = getEventComputedStatus(event);
              return (
              <TableRow key={event.id}>
                <TableCell>
                  {event.imageUrl ? (
                    <div className="relative h-16 w-24 rounded overflow-hidden border">
                      <Image src={event.imageUrl} alt={event.name} layout="fill" objectFit="cover" data-ai-hint={event.dataAiHint || "event image"} />
                    </div>
                  ) : (
                    <div className="flex h-16 w-24 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>{new Date(event.onSaleDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(event.endDate).toLocaleDateString()}</TableCell>
                <TableCell>{event.venue}</TableCell>
                <TableCell>${event.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={computedStatus.variant} className={
                      computedStatus.text === "On Sale" ? "bg-green-100 text-green-700" :
                      computedStatus.text === "Upcoming" ? "bg-blue-100 text-blue-700" :
                      computedStatus.text === "Past" ? "bg-red-100 text-red-700" : ""
                  }>
                    {computedStatus.text}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEditEvent(event)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteEvent(event.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          </TableBody>
        </Table>
         {events.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                No events found. Click "Add New Event" to get started.
            </div>
        )}
      </Card>
    </div>
  );
}
