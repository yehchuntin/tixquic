
import {
  Home,
  KeyRound,
  Lightbulb,
  Settings as SettingsIcon,
  LayoutDashboard,
  Users,
  BookOpenText,
  SlidersHorizontal,
  Ticket as TicketIcon, // Added for events
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
  // Seat Predictor removed from main navigation
  // Modules page removed
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
  date: string; // Keep date for event details
  venue: string; // Keep venue for event details
  status: "Upcoming" | "On Sale" | "Sold Out" | "Past"; // Keep status
  price: number;
  imageUrl?: string;
  description?: string;
  dataAiHint?: string;
};

export const MOCK_EVENTS: TicketEvent[] = [
  {
    id: "evt1",
    name: "Rock Legends Concert",
    date: "2024-08-15",
    venue: "Stadium Arena",
    status: "On Sale",
    price: 75.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "Experience the titans of rock live in concert. A night to remember!",
    dataAiHint: "rock concert"
  },
  {
    id: "evt2",
    name: "Indie Fest 2024",
    date: "2024-09-05",
    venue: "Green Park",
    status: "Upcoming",
    price: 45.50,
    imageUrl: "https://placehold.co/600x400.png",
    description: "Discover the best new indie bands at this year's Indie Fest.",
    dataAiHint: "music festival indie"
  },
  {
    id: "evt3",
    name: "Classical Night with the Symphony",
    date: "2024-07-25",
    venue: "Grand Theatre",
    status: "Sold Out",
    price: 90.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "An evening of breathtaking classical music performed by the world-renowned symphony orchestra.",
    dataAiHint: "classical concert orchestra"
  },
  {
    id: "evt4",
    name: "Pop Sensation World Tour",
    date: "2024-06-10", // Past event
    venue: "City Center Hall",
    status: "Past",
    price: 120.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "The global pop superstar live on stage, performing all their biggest hits.",
    dataAiHint: "pop concert singer"
  },
  {
    id: "evt5",
    name: "Jazz Masters Quintet",
    date: "2024-10-20",
    venue: "The Blue Note Club",
    status: "On Sale",
    price: 60.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "An intimate evening with jazz legends. Limited seats available.",
    dataAiHint: "jazz band club"
  },
];

// Announcement type and MOCK_ANNOUNCEMENTS are effectively replaced by TicketEvent and MOCK_EVENTS for the homepage feed.
// If separate announcements are still needed elsewhere, they can be re-added. For now, focusing on events.
export type Announcement = {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  dataAiHint?: string;
};

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    // This data will now be sourced from MOCK_EVENTS for the homepage feed.
    // Keeping structure for potential other uses of announcements.
  {
    id: "announce1",
    title: "Important Update",
    content: "Please check our new event schedule.",
    date: "2024-07-01",
  }
];
