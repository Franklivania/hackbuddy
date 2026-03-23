import { Link } from "react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "../ui/button";
import { Star } from "lucide-react";

const LOGO_LABEL = "HackBuddy";
const CTA_LABEL = "Start Your Session";
const DASHBOARD_LABEL = "Go to Dashboard";
const NAV_LINKS = [
  { href: "#problem", label: "Problem" },
  { href: "#workflow", label: "Workflow" },
  { href: "#outputs", label: "Outputs" },
] as const;

export function Nav() {
  const [scrolled, set_scrolled] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const on_scroll = () => set_scrolled(window.scrollY > 20);
    window.addEventListener("scroll", on_scroll, { passive: true });
    return () => window.removeEventListener("scroll", on_scroll);
  }, []);

  return (
    <nav
      className={`landing-nav ${scrolled ? "scrolled" : ""}`}
      aria-label="Main"
    >
      <Link to="/" className="landing-nav-logo">
        <span className="landing-nav-logo-dot" aria-hidden />
        {LOGO_LABEL}
      </Link>
      <ul className="landing-nav-links">
        {NAV_LINKS.map(({ href, label }) => (
          <li key={href}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
      <aside className="flex items-center gap-2">
        <Link to="https://github.com/Franklivania/hackbuddy" target="_blank">
          <Button>
            <Star size={18} />
            Star on GitHub
          </Button>
        </Link>
        {user ? (
          <Link to="/dashboard" className="landing-btn-primary">
            {DASHBOARD_LABEL}
          </Link>
        ) : (
          <Link to="/auth" className="landing-btn-primary">
            {CTA_LABEL}
          </Link>
        )}
      </aside>
    </nav>
  );
}
