import { Link } from "react-router";
import { ScrollReveal } from "@/components/landing/components/scroll-reveal";
import { useAuthStore } from "@/lib/stores/auth-store";

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

export function CtaSection() {
  const user = useAuthStore((s) => s.user);
  return (
    <section className="landing-cta-section" aria-labelledby="cta-heading">
      <div className="landing-cta-bg" aria-hidden />

      <div style={{ position: "relative", zIndex: 1 }}>
        <ScrollReveal>
          <p className="landing-label" style={{ justifyContent: "center" }}>
            Get Started
          </p>
        </ScrollReveal>
        <ScrollReveal delay={1}>
          <h2
            id="cta-heading"
            className="landing-section-title"
            style={{ maxWidth: 600, margin: "0 auto 20px", textAlign: "center" }}
          >
            Stop Building Blind.
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={2}>
          <p
            className="landing-section-desc"
            style={{ margin: "0 auto 48px", textAlign: "center" }}
          >
            Enter your next hackathon with a plan, not a guess. Ingest the brief, extract the patterns, and build
            with complete alignment.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={3}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <Link to={user ? "/dashboard" : "/auth"} className="landing-btn-primary" style={{ fontSize: 13, padding: "12px 28px" }}>
              {user ? "Go to Dashboard" : "Start Your Session"}
              <ArrowIcon />
            </Link>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.08em",
                color: "var(--landing-text-dim)",
              }}
            >
              No credit card required
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
