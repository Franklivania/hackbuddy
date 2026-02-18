import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ScrollReveal } from "@/components/landing/components/scroll-reveal";
import { SectionHeader } from "@/components/landing/components/section-header";
import { OutputItem } from "@/components/landing/components/output-item";
const OUTPUTS = [
    {
        tag: "Pattern Recognition",
        title: "What Past Winners Did Differently",
        description: "Detailed breakdown of the patterns, decisions, and positioning that separated winners from the field — applied to your specific event.",
        num: "01",
        delay: 1,
    },
    {
        tag: "Alignment Map",
        title: "Explicit Fit Against Sponsor Goals",
        description: "A clear matrix showing exactly where your project idea intersects with sponsor objectives, judging weights, and stated priorities.",
        num: "02",
        delay: 2,
    },
    {
        tag: "Execution Guardrails",
        title: "Build vs. Skip Guidance",
        description: "Clear, prioritized decisions on what to build, what to cut, and what to demo — grounded in criteria, not opinions.",
        num: "03",
        delay: 3,
    },
    {
        tag: "Session Intelligence",
        title: "Private, Scoped, Contained",
        description: "Each session is fully isolated. Your strategy is never mixed with other events. Session-bound intelligence that stays yours.",
        num: "04",
        delay: 4,
    },
];
export function OutputsSection() {
    return (_jsxs("section", { id: "outputs", className: "landing-section", children: [_jsx(ScrollReveal, { children: _jsx(SectionHeader, { label: "Outputs", title: _jsxs(_Fragment, { children: ["Everything your team", _jsx("br", {}), _jsx("em", { children: "needs to execute." })] }), description: "Four core deliverables that remove ambiguity and create team-wide alignment before a single line of code is written." }) }), _jsx("div", { className: "landing-outputs-grid", children: OUTPUTS.map((item) => (_jsx(ScrollReveal, { delay: item.delay, children: _jsx(OutputItem, { tag: item.tag, title: item.title, description: item.description, num: item.num }) }, item.num))) })] }));
}
