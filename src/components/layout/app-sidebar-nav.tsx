
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  useSidebar, // Removed other unused imports like SidebarGroupLabel, SidebarGroup
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button"; // Added Button
import { AppLogo } from "@/components/icons/app-logo";
// Separator removed as it's not used directly here
import { useAuth } from "@/contexts/auth-context";

export function AppSidebarNav() {
  const pathname = usePathname();
  const { isAdmin, user } = useAuth();
  const { toggleSidebar, isMobile: sidebarIsMobile, setOpenMobile, state: sidebarState } = useSidebar();

  const handleLinkClick = () => {
    if (sidebarIsMobile) {
      setOpenMobile(false);
    }
  };

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly) {
      return user && isAdmin;
    }
    return true;
  });

  return (
    <>
      <SidebarHeader className="border-b">
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className={cn(
            "flex w-full items-center gap-2 text-left h-auto justify-start focus-visible:ring-inset focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
            sidebarState === 'collapsed' ? "px-1 py-2 justify-center" : "px-2 py-[0.6rem]" // Adjusted padding for collapsed state
          )}
          aria-label="Toggle sidebar"
        >
          <AppLogo className="h-8 w-8 text-primary flex-shrink-0" />
          <h1 className="text-xl font-bold group-data-[collapsible=icon]:hidden text-foreground">
            TicketSwift
          </h1>
        </Button>
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
