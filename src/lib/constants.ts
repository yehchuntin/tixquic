
import {
  Home,
  KeyRound,
  Lightbulb,
  Settings as SettingsIcon,
  LayoutDashboard,
  Users,
  BookOpenText,
  SlidersHorizontal,
  Ticket as TicketIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  tooltip?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    tooltip: "Dashboard",
  },
  {
    title: "How to Use",
    href: "/how-to-use",
    icon: BookOpenText,
    tooltip: "Tutorial & Guides",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: SlidersHorizontal,
    tooltip: "User Settings",
  },
  {
    title: "Admin",
    href: "/admin",
    icon: SettingsIcon,
    adminOnly: true,
    tooltip: "Admin Panel",
  },
];

export type TicketEvent = {
  id: string;
  name: string;
  venue: string;
  onSaleDate: string; // Date when event becomes "On Sale"
  endDate: string;    // Date when event is no longer visible/active
  price: number;
  imageUrl?: string;
  description?: string;
  dataAiHint?: string;
};

// Helper to generate dates for MOCK_EVENTS
const getRelativeDate = (dayOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const MOCK_EVENTS: TicketEvent[] = [
  {
    id: "evt1",
    name: "Rock Legends Concert",
    venue: "Stadium Arena",
    onSaleDate: getRelativeDate(-10), // Was on sale 10 days ago
    endDate: getRelativeDate(5),      // Ends in 5 days
    price: 75.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "Experience the titans of rock live in concert. A night to remember!",
    dataAiHint: "rock concert"
  },
  {
    id: "evt2",
    name: "Indie Fest 2024",
    venue: "Green Park",
    onSaleDate: getRelativeDate(7),   // Goes on sale in 7 days
    endDate: getRelativeDate(14),     // Ends in 14 days
    price: 45.50,
    imageUrl: "https://placehold.co/600x400.png",
    description: "Discover the best new indie bands at this year's Indie Fest.",
    dataAiHint: "music festival indie"
  },
  {
    id: "evt3",
    name: "Classical Night Symphony",
    venue: "Grand Theatre",
    onSaleDate: getRelativeDate(20),  // Upcoming, on sale in 20 days
    endDate: getRelativeDate(30),     // Ends in 30 days
    price: 90.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "An evening of breathtaking classical music performed by the world-renowned symphony orchestra.",
    dataAiHint: "classical concert orchestra"
  },
  {
    id: "evt4",
    name: "Pop Sensation Live",
    venue: "City Center Hall",
    onSaleDate: getRelativeDate(-5), // On sale for 5 days
    endDate: getRelativeDate(10),    // Ends in 10 days
    price: 120.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "The global pop superstar live on stage, performing all their biggest hits.",
    dataAiHint: "pop concert singer"
  },
  {
    id: "evt5",
    name: "Jazz Masters Quintet",
    venue: "The Blue Note Club",
    onSaleDate: getRelativeDate(3), // Upcoming, on sale in 3 days
    endDate: getRelativeDate(17),   // Ends in 17 days
    price: 60.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "An intimate evening with jazz legends. Limited seats available.",
    dataAiHint: "jazz band club"
  },
  {
    id: "evt6",
    name: "Past Event Example",
    venue: "Old Venue",
    onSaleDate: getRelativeDate(-30), // Was on sale 30 days ago
    endDate: getRelativeDate(-1),     // Ended yesterday
    price: 50.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "This event has already passed and should not be visible.",
    dataAiHint: "event archive"
  }
];


export type Announcement = {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  dataAiHint?: string;
};

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "announce1",
    title: "Important Update",
    content: "Please check our new event schedule.",
    date: "2024-07-01",
  }
];
