import { Link } from "react-router";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

const EYEBROW = "Hackathon Intelligence Platform";
const HEADLINE = (
  <>
    Win Hackathons With
    <br />
    <em>Strategy,</em> Not Guesswork.
  </>
);
const SUB = "Converts event briefs and past winner data into a structured execution roadmap your team can act on immediately.";
const TAGS = ["Ingest the rules", "Extract the patterns", "Build with alignment"];
const STATS = [
  { num: "3×", label: "Faster Strategy" },
  { num: "94%", label: "Criteria Alignment" },
  { num: "Zero", label: "Scope Drift" },
] as const;

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9"
        stroke="#0a0a0a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Hero() {
  const glow_ref = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const el = glow_ref.current;
    if (!el) return;
    const on_move = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    };
    window.addEventListener("mousemove", on_move, { passive: true });
    return () => window.removeEventListener("mousemove", on_move);
  }, []);

  return (
    <section className="landing-hero" aria-labelledby="hero-heading">
      <div className="landing-hero-bg-grid" aria-hidden />
      <div ref={glow_ref} className="landing-hero-glow" aria-hidden />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div className="landing-hero-eyebrow">{EYEBROW}</div>

        <h1 id="hero-heading" className="landing-hero-h1">
          {HEADLINE}
        </h1>

        <p className="landing-hero-sub">{SUB}</p>

        <div className="landing-hero-cta-group">
          <Link to={user ? "/dashboard" : "/auth"} className="landing-btn-primary">
            {user ? "Go to Dashboard" : "Start Your Session"}
            <ArrowIcon />
          </Link>
          <a href="#workflow" className="landing-btn-ghost">
            See How It Works
          </a>
        </div>

        <div className="landing-hero-tags">
          {TAGS.map((tag) => (
            <span key={tag} className="landing-tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="landing-hero-stat-strip">
          {STATS.map(({ num, label }) => (
            <div key={label} className="landing-stat-item">
              <span className="landing-stat-num">{num}</span>
              <span className="landing-stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
