import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ScrollReveal } from "@/components/landing/components/scroll-reveal";
import { SectionHeader } from "@/components/landing/components/section-header";
import { ProblemCard } from "@/components/landing/components/problem-card";
const PROBLEM_CARDS = [
    { card_label: "01 — Feature Trap", title: "Oversized MVPs", description: "Teams build sprawling features that ignore the actual scoring criteria, shipping complexity when simplicity wins.", delay: 1 },
    { card_label: "02 — Guesswork Gap", title: "Ignored Sponsor Signals", description: "Historical patterns and sponsor priorities go unread. Every session starts from zero, with no institutional memory.", delay: 2 },
    { card_label: "03 — Demo Drift", title: "Missing Transformation Story", description: "Shipping functionality without a compelling narrative leaves judges unmoved, regardless of technical depth.", delay: 3 },
];
export function ProblemSection() {
    return (_jsx("section", { id: "problem", className: "landing-section", children: _jsxs("div", { className: "landing-problem-layout", children: [_jsx("div", { className: "landing-problem-left", children: _jsx(ScrollReveal, { children: _jsx(SectionHeader, { label: "The Problem", title: _jsxs(_Fragment, { children: ["Hackathons are won in ", _jsx("em", { children: "strategy," }), " not just code."] }), description: "Most teams optimize for features instead of alignment. Judges reward clarity, feasibility, and narrative \u2014 not lines of code." }) }) }), _jsx("div", { className: "landing-problem-cards", children: PROBLEM_CARDS.map((card) => (_jsx(ScrollReveal, { delay: card.delay, children: _jsx(ProblemCard, { card_label: card.card_label, title: card.title, description: card.description }) }, card.card_label))) })] }) }));
}
