"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { NotificationIndicator } from "@/components/NotificationIndicator";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 sm:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar with mobile toggle logic */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transition-transform sm:translate-x-0 duration-200 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar className="shadow-xl sm:shadow-none" />
      </div>

      <div className="flex flex-col sm:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="sm:hidden -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle mobile menu</span>
          </Button>
          
          <div className="flex flex-1 items-center justify-end gap-x-4">
             <NotificationIndicator />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
