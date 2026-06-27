"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, Receipt, Landmark, PieChart, LogOut, Users, ShieldCheck, MessageSquare, UserCircle, FileCode, Truck, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Fornecedores", href: "/fornecedores", icon: Truck },
  { name: "Receitas", href: "/receitas", icon: Landmark },
  { name: "Despesas", href: "/despesas", icon: Receipt },
  { name: "Relatórios", href: "/relatorios", icon: PieChart },
  { name: "Mensagens", href: "/mensagens", icon: MessageSquare },
  { name: "Backup", href: "/backup", icon: Database },
  { name: "Documentação", href: "/documentacao", icon: FileCode },
];

const adminItems = [
  { name: "Usuários", href: "/admin/users", icon: Users },
  { name: "Configurações", href: "/admin/settings", icon: ShieldCheck },
];
export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <aside className={cn("flex h-full w-full flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground", className)}>
      <div className="flex h-16 items-center shrink-0 px-6 font-bold text-2xl tracking-tight text-white">
        <span className="text-primary mr-1">Finan</span>Sys
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        <div>
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">Menu</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {isAdmin && (
          <div>
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Gestão
            </p>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 shrink-0 border-t border-sidebar-border">
        <Link
          href="/perfil"
          className="mb-2 flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group"
        >
          {session?.user?.image ? (
            <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-sidebar-border group-hover:border-primary/50" />
          ) : (
            <UserCircle className="w-8 h-8 text-sidebar-foreground/50 group-hover:text-primary transition-colors" />
          )}
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white group-hover:text-sidebar-accent-foreground transition-colors truncate">{session?.user?.name || "Usuário"}</p>
            <p className="text-[10px] text-white/50 group-hover:text-sidebar-accent-foreground/70 transition-colors truncate font-medium">{session?.user?.email}</p>
          </div>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
          onClick={() => {
            sessionStorage.removeItem("financial_visibility");
            signOut({ callbackUrl: "/login" });
          }}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
