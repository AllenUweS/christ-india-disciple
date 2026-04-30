import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { label: "Tiers",     href: "#tiers"     },
  { label: "Features",  href: "#features"  },
  { label: "AI Mentor", href: "#ai"        },
  { label: "Testimony", href: "#testimony" },
  { label: "Founder",   href: "#founder"   },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeAndScroll = (href: string) => {
    setOpen(false);
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(96%,1100px)]"
      >
        <nav className={`glass rounded-full px-4 md:px-5 py-3 flex items-center justify-between transition-all duration-300 ${scrolled ? "shadow-lg" : ""}`}>

          {/* Logo */}
          <a href="#" className="flex items-center gap-2 shrink-0">
            <div className="relative w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center divine-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif text-base md:text-xl font-semibold tracking-wide">
              Christ <span className="gold-text">India Disciple</span>
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {links.map((l) => (
              <a key={l.label} href={l.href} className="hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="text-foreground/80 hover:text-foreground hover:bg-white/5">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild variant="divine" size="sm">
              <Link to="/auth">Begin Journey</Link>
            </Button>
          </div>

          {/* Mobile right — theme toggle + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-foreground"
              aria-label="Toggle menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </nav>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mt-2 glass rounded-3xl overflow-hidden"
            >
              {/* Gold top accent */}
              <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <div className="px-4 py-5 flex flex-col gap-1">
                {links.map((l, i) => (
                  <motion.button
                    key={l.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    onClick={() => closeAndScroll(l.href)}
                    className="w-full text-left px-4 py-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200 flex items-center gap-3"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />
                    {l.label}
                  </motion.button>
                ))}

                {/* Divider */}
                <div className="my-2 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                {/* Auth buttons */}
                <div className="flex flex-col gap-2 px-1">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-center text-foreground/80">
                    <Link to="/auth" onClick={() => setOpen(false)}>Sign in</Link>
                  </Button>
                  <Button asChild variant="divine" size="sm" className="w-full justify-center">
                    <Link to="/auth" onClick={() => setOpen(false)}>Begin Journey</Link>
                  </Button>
                </div>
              </div>

              {/* Gold bottom accent */}
              <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Backdrop to close menu on tap outside */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/20 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;