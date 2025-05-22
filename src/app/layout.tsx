
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebarNav } from "@/components/layout/app-sidebar-nav";

const inter = Inter({ 
  variable: "--font-inter", 
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({ 
  variable: "--font-roboto-mono", 
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TicketSwift",
  description: "Your ultimate tool for securing event tickets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased font-sans`} 
      >
        <AuthProvider>
          <SidebarProvider defaultOpen={false}> {/* Changed defaultOpen to false */}
            <Sidebar collapsible="icon">
              <AppSidebarNav />
            </Sidebar>
            <div className="flex flex-1 flex-col">
              <AppHeader />
              <SidebarInset>
                <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
              </SidebarInset>
            </div>
          </SidebarProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
