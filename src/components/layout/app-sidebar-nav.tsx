
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
  useSidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
// Button removed as it's not used to wrap SidebarHeader content anymore
import { AppLogo } from "@/components/icons/app-logo";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebarNav() {
  const pathname = usePathname();
  const { isAdmin, user } = useAuth();
  const { isMobile: sidebarIsMobile, setOpenMobile, state: sidebarState } = useSidebar(); // toggleSidebar removed

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
      {/* SidebarHeader now acts as a container, its height is h-16 to match AppHeader */}
      <SidebarHeader className="border-b h-16 flex items-center">
        <div
          className={cn(
            "flex w-full items-center gap-2 text-left",
            // Adjust padding based on collapsed state for logo centering
            sidebarState === 'collapsed' ? "justify-center px-1" : "justify-start px-4" // px-4 to match AppHeader horizontal padding
          )}
        >
          <AppLogo className="h-8 w-8 text-primary flex-shrink-0" />
          {/* Text is hidden when sidebar is collapsed via icon */}
          <h1 className="text-lg font-bold group-data-[collapsible=icon]:hidden text-foreground">
            TixQuic
          </h1>
        </div>
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
          © {new Date().getFullYear()} TixQuic Inc.
        </p>
      </SidebarFooter>
    </>
  );
}
