import { ScrollReveal } from "@/components/landing/components/scroll-reveal";
import { SectionHeader } from "@/components/landing/components/section-header";
import { ProblemCard } from "@/components/landing/components/problem-card";

const PROBLEM_CARDS = [
  { card_label: "01 — Feature Trap", title: "Oversized MVPs", description: "Teams build sprawling features that ignore the actual scoring criteria, shipping complexity when simplicity wins.", delay: 1 as const },
  { card_label: "02 — Guesswork Gap", title: "Ignored Sponsor Signals", description: "Historical patterns and sponsor priorities go unread. Every session starts from zero, with no institutional memory.", delay: 2 as const },
  { card_label: "03 — Demo Drift", title: "Missing Transformation Story", description: "Shipping functionality without a compelling narrative leaves judges unmoved, regardless of technical depth.", delay: 3 as const },
];

export function ProblemSection() {
  return (
    <section id="problem" className="landing-section">
      <div className="landing-problem-layout">
        <div className="landing-problem-left">
          <ScrollReveal>
            <SectionHeader
              label="The Problem"
              title={<>Hackathons are won in <em>strategy,</em> not just code.</>}
              description="Most teams optimize for features instead of alignment. Judges reward clarity, feasibility, and narrative — not lines of code."
            />
          </ScrollReveal>
        </div>
        <div className="landing-problem-cards">
          {PROBLEM_CARDS.map((card) => (
            <ScrollReveal key={card.card_label} delay={card.delay}>
              <ProblemCard card_label={card.card_label} title={card.title} description={card.description} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
