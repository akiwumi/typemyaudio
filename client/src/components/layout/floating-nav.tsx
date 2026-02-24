import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "Pricing", href: "/pricing" },
];

export function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith("/#")) {
      const id = href.slice(2);
      if (location.pathname === "/") {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  return (
    <>
      <nav
        className={cn(
          "fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-2xl",
          scrolled
            ? "glass-nav w-[min(95vw,72rem)] px-5 py-3"
            : "w-[min(95vw,80rem)] px-6 py-4 bg-transparent"
        )}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/imgs/typeMyAudioLogo.png"
              alt="TypeMyAudio"
              className={cn(
                "w-auto transition-all duration-300",
                scrolled ? "h-10" : "h-14"
              )}
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className={cn(
                  "text-sm font-medium transition-colors",
                  scrolled
                    ? "text-foreground-muted hover:text-foreground"
                    : "text-white/80 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button
                variant="ghost"
                className={cn(
                  "transition-colors",
                  !scrolled && "text-white hover:bg-white/10"
                )}
              >
                Sign in
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "md:hidden p-2 rounded-xl transition-colors cursor-pointer",
              scrolled
                ? "text-foreground hover:bg-secondary"
                : "text-white hover:bg-white/10"
            )}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border/30 space-y-1 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="block px-3 py-2.5 text-sm font-medium text-foreground-muted hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer so content isn't hidden behind floating nav */}
      <div className="h-0" />
    </>
  );
}
