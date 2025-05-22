
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
  CalendarDays, // Keep for admin page title icon
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
  id: string; // Will be the document ID in Firestore
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

// MOCK_EVENTS will no longer be the primary data source for live components.
// They are kept here for reference or potential data seeding in the future.
export const MOCK_EVENTS: TicketEvent[] = [
  {
    id: "evt1_mock", // Changed ID to avoid potential conflicts if seeding
    name: "Rock Legends Concert (Mock)",
    venue: "Stadium Arena",
    onSaleDate: getRelativeDate(-10),
    endDate: getRelativeDate(5),
    price: 75.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "Experience the titans of rock live in concert. A night to remember!",
    dataAiHint: "rock concert"
  },
  {
    id: "evt2_mock",
    name: "Indie Fest 2024 (Mock)",
    venue: "Green Park",
    onSaleDate: getRelativeDate(7),
    endDate: getRelativeDate(14),
    price: 45.50,
    imageUrl: "https://placehold.co/600x400.png",
    description: "Discover the best new indie bands at this year's Indie Fest.",
    dataAiHint: "music festival indie"
  },
  // Add more mock events if needed for reference
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
