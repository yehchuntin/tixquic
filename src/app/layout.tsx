
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google"; // Changed from GeistSans and GeistMono
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

const inter = Inter({ // Changed from geistSans
  variable: "--font-inter", // Changed variable name
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({ // Changed from geistMono
  variable: "--font-roboto-mono", // Changed variable name
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
        className={`${inter.variable} ${robotoMono.variable} antialiased font-sans`} // Updated font variables
      >
        <AuthProvider>
          <SidebarProvider defaultOpen>
            <Sidebar collapsible="icon">
              <AppSidebarNav />
            </Sidebar>
            <div className="flex flex-col w-full">
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
