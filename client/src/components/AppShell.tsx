import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, FilePlus2, Pill, CalendarRange, Receipt, BarChart3,
  Bell, Search, Sun, Moon, Menu, X, Settings, LogOut, Shield, Activity,
  Boxes, Stethoscope, Sparkles, BookOpenText, KeyRound, Hospital, FileBarChart, LockKeyhole,
} from "lucide-react";
import { Logo, LogoMark } from "./Logo";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { NOTIFICATIONS, fmtRelative, CLINIC } from "@/lib/demo-data";

type NavItem = { href: string; label: string; icon: React.ElementType; roles?: string[]; badge?: string };

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/patients", label: "Patients", icon: Users },
      { href: "/prescriptions", label: "Prescriptions", icon: FilePlus2 },
      { href: "/appointments", label: "Appointments", icon: CalendarRange },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/inventory", label: "Inventory", icon: Pill, roles: ["admin", "pharmacist"] },
      { href: "/billing", label: "Billing", icon: Receipt, roles: ["admin", "receptionist", "pharmacist"] },
      { href: "/expenses", label: "Expenses", icon: Boxes, roles: ["admin"] },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/reports", label: "Reports", icon: FileBarChart },
      { href: "/ai-insights", label: "AI Insights", icon: Sparkles, badge: "New" },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/admin", label: "Admin", icon: LockKeyhole, roles: ["admin"] },
      { href: "/audit", label: "Audit & Sessions", icon: Shield, roles: ["admin"] },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const unread = NOTIFICATIONS.filter(n => !n.read).length;

  // Keyboard shortcuts: ⌘K, g+d/g+p, etc.
  useEffect(() => {
    let last = "";
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(o => !o); return; }
      const isInput = (e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/);
      if (isInput) return;
      if (e.key.toLowerCase() === "g") { last = "g"; setTimeout(() => last = "", 700); return; }
      if (last === "g") {
        const map: Record<string, string> = { d: "/", p: "/patients", r: "/prescriptions", a: "/appointments", i: "/inventory", b: "/billing", n: "/analytics" };
        const dest = map[e.key.toLowerCase()];
        if (dest) setLocation(dest);
        last = "";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setLocation]);

  const sections = useMemo(() => {
    return SECTIONS.map(sec => ({
      ...sec,
      items: sec.items.filter(it => !it.roles || it.roles.includes(user?.role ?? "admin")),
    })).filter(sec => sec.items.length > 0);
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground sticky top-0 h-screen transition-[width] duration-200",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
        data-testid="sidebar"
      >
        <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border", collapsed && "justify-center px-0")}>
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <LogoMark className="h-8 w-8 shrink-0" />
            {!collapsed && (
              <div className="leading-none min-w-0">
                <div className="font-semibold text-[15px] tracking-tight">ClinicPulse</div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80 mt-0.5">Health OS</div>
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
          {sections.map(sec => (
            <div key={sec.title}>
              {!collapsed && (
                <div className="px-3 pb-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/70 font-medium">
                  {sec.title}
                </div>
              )}
              <ul className="space-y-0.5">
                {sec.items.map(it => {
                  const Icon = it.icon;
                  const active = location === it.href || (it.href !== "/" && location.startsWith(it.href));
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] hover-elevate",
                          active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/85",
                          collapsed && "justify-center px-0"
                        )}
                        data-testid={`nav-${it.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      >
                        <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
                        {!collapsed && <span className="truncate">{it.label}</span>}
                        {!collapsed && it.badge && (
                          <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/20">
                            {it.badge}
                          </Badge>
                        )}
                        {active && !collapsed && (
                          <motion.span layoutId="nav-pill" className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-primary" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-2")}>
          {!collapsed ? (
            <div className="rounded-lg border border-sidebar-border bg-card/40 p-3 mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <div className="text-xs font-medium">System health</div>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Online</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[92%] bg-gradient-to-r from-primary to-emerald-400" />
              </div>
              <div className="mt-1.5 text-[10px] text-muted-foreground tabular-nums">Backups: 12m ago • DB ok</div>
            </div>
          ) : null}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center text-xs text-muted-foreground hover:text-foreground rounded-md py-1.5 hover-elevate"
            data-testid="button-toggle-collapse"
            aria-label="Toggle sidebar"
          >
            {collapsed ? "›" : "‹ Collapse"}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="md:hidden fixed left-0 top-0 z-50 h-screen w-[280px] bg-sidebar border-r border-sidebar-border flex flex-col"
            >
              <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
                <Logo />
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-1.5 rounded-md hover-elevate">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
                {sections.map(sec => (
                  <div key={sec.title}>
                    <div className="px-3 pb-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/70 font-medium">{sec.title}</div>
                    <ul className="space-y-0.5">
                      {sec.items.map(it => {
                        const Icon = it.icon;
                        const active = location === it.href || (it.href !== "/" && location.startsWith(it.href));
                        return (
                          <li key={it.href}>
                            <Link
                              href={it.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover-elevate",
                                active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/85"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{it.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/70 glass-strong">
          <div className="h-full px-4 md:px-6 flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="md:hidden p-2 rounded-md hover-elevate" data-testid="button-mobile-menu">
              <Menu className="h-5 w-5" />
            </button>

            <button
              onClick={() => setPaletteOpen(true)}
              className="flex-1 max-w-[460px] flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background/60 text-sm text-muted-foreground hover-elevate"
              data-testid="button-search-palette"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search patients, prescriptions, medicines…</span>
              <span className="sm:hidden">Search</span>
              <kbd className="ml-auto hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted/60 px-1.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-[13px] font-medium" data-testid="label-single-clinic">
                <Hospital className="h-4 w-4 text-primary" />
                <span>{CLINIC.name}</span>
              </div>

              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" data-testid="button-toggle-theme">
                {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notifications" data-testid="button-notifications">
                    <Bell className="h-[18px] w-[18px]" />
                    {unread > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[340px]">
                  <DropdownMenuLabel className="flex items-center justify-between text-xs">
                    Notifications <span className="text-muted-foreground">{unread} unread</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {NOTIFICATIONS.slice(0, 5).map(n => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2.5" data-testid={`notif-${n.id}`}>
                      <div className="flex items-center gap-2 w-full">
                        <span className={cn("h-1.5 w-1.5 rounded-full", n.read ? "bg-muted-foreground/40" : "bg-primary")}></span>
                        <span className="text-[13px] font-medium">{n.title}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">{fmtRelative(n.createdAt)}</span>
                      </div>
                      {n.body && <span className="text-[11.5px] text-muted-foreground pl-3.5">{n.body}</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover-elevate" data-testid="button-user-menu">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-semibold">
                        {user?.initials ?? "CP"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start leading-none">
                      <span className="text-[12.5px] font-medium">{user?.fullName ?? "Guest"}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{user?.role ?? "—"}</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="text-[13px]">{user?.fullName}</span>
                    <span className="text-[11px] text-muted-foreground">{user?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/settings")}>
                    <Settings className="h-4 w-4 mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/audit")}>
                    <Shield className="h-4 w-4 mr-2" /> Sessions & audit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <KeyRound className="h-4 w-4 mr-2" /> Two-factor auth
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { logout(); setLocation("/login"); }}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command palette */}
      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Search or jump to…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {sections.flatMap(s => s.items).map(it => (
              <CommandItem key={it.href} onSelect={() => { setLocation(it.href); setPaletteOpen(false); }}>
                <it.icon className="h-4 w-4 mr-2 text-muted-foreground" /> {it.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => { setLocation("/patients/new"); setPaletteOpen(false); }}>
              <Users className="h-4 w-4 mr-2 text-muted-foreground" /> New patient
            </CommandItem>
            <CommandItem onSelect={() => { setLocation("/prescriptions/new"); setPaletteOpen(false); }}>
              <Stethoscope className="h-4 w-4 mr-2 text-muted-foreground" /> New prescription
            </CommandItem>
            <CommandItem onSelect={() => { setLocation("/appointments"); setPaletteOpen(false); }}>
              <CalendarRange className="h-4 w-4 mr-2 text-muted-foreground" /> Book appointment
            </CommandItem>
            <CommandItem onSelect={() => { toggle(); setPaletteOpen(false); }}>
              {theme === "dark" ? <Sun className="h-4 w-4 mr-2 text-muted-foreground" /> : <Moon className="h-4 w-4 mr-2 text-muted-foreground" />} Toggle theme
            </CommandItem>
            <CommandItem onSelect={() => { setLocation("/help"); setPaletteOpen(false); }}>
              <BookOpenText className="h-4 w-4 mr-2 text-muted-foreground" /> Help & shortcuts
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
