import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  CalendarDays,
  Gauge,
  LayoutGrid,
  LineChart,
  LogOut,
  Menu,
  Moon,
  Package,
  Receipt,
  Search,
  Sparkles,
  Sun,
  Store,
  Users,
  Wallet,
  GraduationCap,
  Trophy,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useProfile, useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { playCashSound } from "@/lib/cash-sound";
import { MoneyRain, emitSaleEvent } from "@/components/money-rain";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/campanhas", label: "Campanhas", icon: LineChart },
  { to: "/meus-produtos", label: "Meus produtos", icon: Package },
  { to: "/minhas-vendas", label: "Minhas vendas", icon: Receipt },
  { to: "/financeiro", label: "Conta & Saldo", icon: Wallet },
  { to: "/crm", label: "CRM & Leads", icon: Users },
  { to: "/eleve-ia", label: "Eleve IA", icon: Sparkles },
  { to: "/treinamentos", label: "Treinamentos", icon: GraduationCap },
  { to: "/comunidade", label: "Comunidade", icon: Trophy },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
] as const;

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-[0_10px_30px_-12px_var(--primary)]"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const { data: isAdmin } = useIsAdmin(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const initial = (profile?.full_name ?? profile?.email ?? "E").charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <LayoutGrid className="size-4" />
        </span>
        <span className="font-mono text-sm font-bold tracking-[0.16em]">ELEVE_ENGINE</span>
      </div>

      <div className="scroll-slim flex-1 overflow-y-auto py-4">
        <p className="label-mono px-6 pb-2">Operação</p>
        <NavList onNavigate={onNavigate} />
      </div>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 rounded-lg bg-sidebar-accent px-3 py-2">
          <p className="label-mono">Saldo disponível</p>
          <p className="font-display text-lg font-bold">{brl(Number(profile?.balance ?? 0))}</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-primary">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.full_name ?? "Usuário"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {isAdmin ? "Administrador" : "Afiliado"}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <LogOut className="size-3.5" /> SAIR
        </button>
      </div>
    </div>
  );
}

function NotificationBell() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data;
    },
  });

  const unread = data.filter((n) => !n.read).length;

  const markAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markOne = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };


  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative grid size-9 place-items-center rounded-lg border border-border bg-surface-2 text-muted-foreground transition-colors hover:text-foreground">
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notificações
          {unread > 0 && (
            <button onClick={markAll} className="text-xs text-primary">
              marcar lidas
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {data.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhuma notificação por aqui.
          </p>
        )}
        {data.map((n) => (
          <DropdownMenuItem
            key={n.id}
            onSelect={() => void markOne(n.id)}
            className="flex-col items-start gap-0.5"
          >
            <span className="flex w-full items-center gap-2 text-sm font-medium">
              {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
              <span className={cn("truncate", n.read && "text-muted-foreground")}>{n.title}</span>
            </span>
            {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
          </DropdownMenuItem>
        ))}

      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Assina eventos ao vivo do Cloud e dispara toast + som + animação. */
function useRealtime() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("eleve-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sales", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { commission: number };
          playCashSound();
          emitSaleEvent(row);
          toast.success("Venda aprovada!", {
            description: `Comissão de ${brl(Number(row.commission))} liberada.`,
            position: "top-right",
          });
          queryClient.invalidateQueries();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "withdrawals", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { title: string; body: string | null };
          toast(row.title, { description: row.body ?? undefined, position: "top-right" });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaign_ads", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  useRealtime();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        <SidebarBody />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-8">
          <button
            onClick={() => setOpen(true)}
            className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="size-4" />
          </button>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Buscar campanhas, produtos, leads..."
              className="h-9 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Alternar tema"
              className="grid size-9 place-items-center rounded-lg border border-border bg-surface-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <NotificationBell />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      <MoneyRain />
    </div>
  );
}
