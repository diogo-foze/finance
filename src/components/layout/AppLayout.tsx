"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

import { NotificationIndicator } from "@/components/NotificationIndicator";
import { useVisibility } from "@/components/providers/VisibilityProvider";
import { useSession } from "next-auth/react";
import { VerificationModal } from "@/components/VerificationModal";
import { AlertCircle } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const { isVisible, toggleVisibility } = useVisibility();
  const { data: session } = useSession();

  const isUnverified = session?.user && !session.user.isEmailVerified;

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
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVisibility}
              className="text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              title={isVisible ? "Ocultar saldos" : "Mostrar saldos"}
              type="button"
            >
              {isVisible ? <Eye className="w-5 h-5 text-zinc-500" /> : <EyeOff className="w-5 h-5 text-zinc-500" />}
            </Button>
            <NotificationIndicator />
          </div>
        </header>

        {isUnverified && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 sm:px-6">
            <div className="flex items-center justify-between gap-x-4 max-w-7xl mx-auto">
              <div className="flex items-center gap-x-2 text-sm text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-4 w-4" />
                <p>
                  <span className="font-semibold">E-mail não verificado.</span> Algumas funcionalidades podem estar limitadas.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                onClick={() => setIsVerificationModalOpen(true)}
              >
                Verificar agora
              </Button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8">
          {children}
        </main>
      </div>

      {session?.user?.email && (
        <VerificationModal 
          isOpen={isVerificationModalOpen} 
          onClose={() => setIsVerificationModalOpen(false)} 
          email={session.user.email} 
        />
      )}
    </div>
  );
}
