import { ReactNode, useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, Menu, X, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BiblicalChatbot } from "@/components/BiblicalChatbot";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Props {
  title: string;
  items: NavItem[];
  children: ReactNode;
  badge?: string;
}

export const DashboardShell = ({ title, items, children, badge }: Props) => {
  const { signOut, user } = useAuth();
  const loc = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [loc.pathname]);

  // Close on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setDrawerOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-border/40 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center divine-glow shrink-0">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif text-lg gold-text leading-tight">Christ India<br />Disciple</span>
          </div>
          {badge && (
            <span className="mt-3 inline-block text-[10px] uppercase tracking-widest text-primary/80 border border-primary/30 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {/* Close button — only shown inside mobile drawer */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((it, i) => {
          const active = loc.pathname === it.to || (it.to !== items[0].to && loc.pathname.startsWith(it.to));
          return (
            <motion.div
              key={it.to}
              initial={onClose ? { opacity: 0, x: -16 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              <NavLink
                to={it.to}
                end={it.to === items[0].to}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all group",
                  active
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                )}
              >
                <it.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{it.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/40 space-y-3">
        {/* User email */}
        <div className="flex items-center gap-2 px-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-medium text-primary uppercase">
              {user?.email?.[0] ?? "U"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
        </div>
        <div className="flex gap-2">
          <ThemeToggle className="flex-1" />
          <Button variant="glass" size="sm" className="flex-1" onClick={signOut}>
            <LogOut className="w-3.5 h-3.5 mr-1" /> Sign out
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex w-full">
      {/* Biblical AI Chatbot — available on all dashboards */}
      <BiblicalChatbot variant="dashboard" />

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/40 glass-strong">
        <SidebarContent />
      </aside>

      {/* ── MOBILE DRAWER BACKDROP ── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col glass-strong border-r border-border/40 md:hidden"
          >
            {/* Gold top accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* Mobile top bar */}
        <header className="md:hidden glass-strong border-b border-border/40 px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-30">
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-foreground"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Centre logo */}
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <div className="w-6 h-6 rounded-full bg-gradient-gold flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-serif text-base gold-text">Christ India</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={signOut}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          <h1 className="text-2xl md:text-4xl font-serif gold-text mb-6 md:mb-8">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
};