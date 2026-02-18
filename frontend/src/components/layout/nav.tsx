import { Link } from "react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

const LOGO_LABEL = "Hackathon Buddy";
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
      {user ? (
        <Link to="/dashboard" className="landing-btn-primary">
          {DASHBOARD_LABEL}
        </Link>
      ) : (
        <Link to="/auth" className="landing-btn-primary">
          {CTA_LABEL}
        </Link>
      )}
    </nav>
  );
}
