
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Settings, AlertTriangle } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

const eventSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Event name must be at least 3 characters."),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format."),
  venue: z.string().min(3, "Venue name must be at least 3 characters."),
  status: z.enum(["Upcoming", "On Sale", "Sold Out", "Past"]),
});

type EventFormValues = z.infer<typeof eventSchema>;

export function EventManager() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<TicketEvent[]>(MOCK_EVENTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TicketEvent | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
  });

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
    reset({ id: undefined, name: "", date: "", venue: "", status: "Upcoming" });
    setIsDialogOpen(true);
  };

  const handleEditEvent = (event: TicketEvent) => {
    setEditingEvent(event);
    reset(event); // Populate form with event data
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
    toast({ title: "Event Deleted", description: "The event has been successfully removed." });
  };

  const onSubmit: SubmitHandler<EventFormValues> = (data) => {
    if (editingEvent) {
      // Update existing event
      setEvents(events.map((event) => (event.id === editingEvent.id ? { ...event, ...data, id: editingEvent.id } : event)));
      toast({ title: "Event Updated", description: "The event has been successfully updated." });
    } else {
      // Add new event
      const newEvent = { ...data, id: `evt${Date.now()}` };
      setEvents([...events, newEvent]);
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
          <Settings className="h-8 w-8 text-primary" /> Event Management
        </h2>
        <Button onClick={handleAddEvent}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update the details of the existing event." : "Fill in the details for the new event."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Event Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" {...register("venue")} />
              {errors.venue && <p className="text-sm text-destructive">{errors.venue.message}</p>}
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => setValue("status", value as EventFormValues["status"])} defaultValue={editingEvent?.status || "Upcoming"}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="On Sale">On Sale</SelectItem>
                  <SelectItem value="Sold Out">Sold Out</SelectItem>
                  <SelectItem value="Past">Past</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
            </div>
            <DialogFooter>
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
          <TableCaption>A list of all ticket events.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                <TableCell>{event.venue}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full
                      ${event.status === "On Sale" ? "bg-green-100 text-green-700" : ""}
                      ${event.status === "Upcoming" ? "bg-blue-100 text-blue-700" : ""}
                      ${event.status === "Sold Out" ? "bg-red-100 text-red-700" : ""}
                      ${event.status === "Past" ? "bg-gray-100 text-gray-700" : ""}`}
                  >
                    {event.status}
                  </span>
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
            ))}
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
