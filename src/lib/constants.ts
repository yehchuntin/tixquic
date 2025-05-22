
import {
  Home,
  KeyRound,
  Lightbulb,
  // BarChart3, // Removed as SuccessReport page is removed for user input
  Settings as SettingsIcon,
  LayoutDashboard,
  Users,
  // Briefcase, // Icon for Modules, which is being removed
  BookOpenText,
  SlidersHorizontal
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
  // { // Seat Predictor removed from main navigation as per feedback
  //   title: "Seat Predictor",
  //   href: "/seat-predictor",
  //   icon: Lightbulb,
  //   tooltip: "AI Seat Predictor",
  // },
  // { // Modules page removed
  //   title: "Modules",
  //   href: "/modules",
  //   icon: Briefcase,
  //   tooltip: "Manage Modules",
  // },
  {
    title: "Settings",
    href: "/settings",
    icon: SlidersHorizontal, // Changed from KeyRound to be more generic for settings
    tooltip: "User Settings",
  },
  // Success Report page removed from user navigation
  // {
  //   title: "Success Report",
  //   href: "/success-report",
  //   icon: BarChart3,
  //   tooltip: "View Success Reports"
  // },
  {
    title: "Admin",
    href: "/admin",
    icon: SettingsIcon,
    adminOnly: true,
    tooltip: "Admin Panel",
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
    id: "1",
    title: "New Event: Summer Music Festival!",
    content: "Tickets go on sale next week for the biggest music festival of the summer. Get ready!",
    date: "2024-07-15",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "music festival"
  },
  {
    id: "2",
    title: "System Maintenance Scheduled",
    content: "TicketSwift will be undergoing scheduled maintenance on July 20th from 2 AM to 4 AM UTC.",
    date: "2024-07-10",
  },
  {
    id: "3",
    title: "Loyalty Program Enhanced",
    content: "Earn double points on all ticket purchases this month! Check your loyalty status now.",
    date: "2024-07-01",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "rewards points"
  },
];

export type TicketEvent = {
  id: string;
  name: string;
  date: string;
  venue: string;
  status: "Upcoming" | "On Sale" | "Sold Out" | "Past";
};

export const MOCK_EVENTS: TicketEvent[] = [
  { id: "evt1", name: "Rock Legends Concert", date: "2024-08-15", venue: "Stadium Arena", status: "On Sale" },
  { id: "evt2", name: "Indie Fest 2024", date: "2024-09-05", venue: "Green Park", status: "Upcoming" },
  { id: "evt3", name: "Classical Night", date: "2024-07-25", venue: "Grand Theatre", status: "Sold Out" },
  { id: "evt4", name: "Pop Sensation Tour", date: "2024-06-10", venue: "City Center Hall", status: "Past" },
];

// ModuleItem type and MOCK_MODULES removed as the feature is removed from web app.
