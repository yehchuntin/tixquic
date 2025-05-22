
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroup,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppLogo } from "@/components/icons/app-logo";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context"; // Assuming you have an auth context

export function AppSidebarNav() {
  const pathname = usePathname();
  const { isAdmin, user } = useAuth(); // Get isAdmin state from context
  const { setOpenMobile, isMobile: sidebarIsMobile } = useSidebar(); // Renamed to avoid conflict with hook name


  const handleLinkClick = () => {
    if (sidebarIsMobile) { // Use renamed variable
      setOpenMobile(false);
    }
  };

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly) {
      return user && isAdmin; // Only show admin items if user is logged in and is admin
    }
    return true;
  });

  return (
    <>
      <SidebarHeader className="border-b">
        <Link href="/" className="flex items-center gap-2 py-1" onClick={handleLinkClick}>
          <AppLogo className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold group-data-[collapsible=icon]:hidden">TicketSwift</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                  tooltip={item.tooltip || item.title}
                  onClick={handleLinkClick}
                >
                  <a>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t p-4">
        <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} TicketSwift Inc.
        </p>
      </SidebarFooter>
    </>
  );
}
