
import {
  LayoutDashboard,
  Users,
  BookOpenText,
  SlidersHorizontal,
  Ticket as TicketIcon,
  CalendarDays, 
  Settings as SettingsIcon, // Renamed to avoid conflict
  Download, // Added Download icon
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
    title: "Download App", // New Download link
    href: "/download",
    icon: Download,
    tooltip: "Download Desktop App",
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
  onSaleDate: string; 
  endDate: string;    
  price: number;
  imageUrl?: string;
  description?: string;
  dataAiHint?: string;
};

// Helper to generate dates for MOCK_EVENTS
const getRelativeDate = (dayOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(0, 0, 0, 0); // Normalize to start of day
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

// MOCK_EVENTS will no longer be the primary data source for live components.
// They are kept here for reference or potential data seeding in the future.
export const MOCK_EVENTS: TicketEvent[] = [
  {
    id: "evt1_mock",
    name: "Rock Legends Concert (Mock)",
    venue: "Stadium Arena",
    onSaleDate: getRelativeDate(-10), // On sale 10 days ago
    endDate: getRelativeDate(5), // Ends in 5 days
    price: 75.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "Experience the titans of rock live in concert. A night to remember!",
    dataAiHint: "rock concert"
  },
  {
    id: "evt2_mock",
    name: "Indie Fest 2024 (Mock)",
    venue: "Green Park",
    onSaleDate: getRelativeDate(7), // On sale in 7 days (Upcoming)
    endDate: getRelativeDate(14), // Ends in 14 days
    price: 45.50,
    imageUrl: "https://placehold.co/600x400.png",
    description: "Discover the best new indie bands at this year's Indie Fest.",
    dataAiHint: "music festival indie"
  },
  {
    id: "evt3_mock_past",
    name: "Jazz Night (Mock - Past)",
    venue: "The Blue Note",
    onSaleDate: getRelativeDate(-30), // On sale 30 days ago
    endDate: getRelativeDate(-5), // Ended 5 days ago (Past)
    price: 60.00,
    imageUrl: "https://placehold.co/600x400.png",
    description: "An evening of smooth jazz.",
    dataAiHint: "jazz music"
  },
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
