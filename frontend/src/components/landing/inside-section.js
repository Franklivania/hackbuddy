import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ScrollReveal } from "@/components/landing/components/scroll-reveal";
import { SectionHeader } from "@/components/landing/components/section-header";
import { BentoCell } from "@/components/landing/components/bento-cell";
import { Command, LockKeyholeIcon, RotateCcw } from "lucide-react";
const INNER_TAGS = ["pivot-safe", "criteria-anchored", "real-time"];
export function InsideSection() {
    return (_jsxs("section", { id: "inside", className: "landing-section", children: [_jsx(ScrollReveal, { children: _jsx(SectionHeader, { label: "Inside Session", title: _jsxs(_Fragment, { children: ["Your command center", _jsx("br", {}), "for the entire event."] }), description: "A purpose-built workspace that keeps your team aligned, informed, and focused from brief to demo." }) }), _jsxs("div", { className: "landing-bento-grid", children: [_jsx(ScrollReveal, { delay: 1, className: "col-span-6", children: _jsx(BentoCell, { num: "01 \u2014 Command Center", title: "Dedicated Hackathon Workspace", description: "A single hub for your event. Rules, strategy, directive, and chat \u2014 all in one scoped environment.", icon: _jsx(Command, {}), col_span: 6 }) }), _jsx(ScrollReveal, { delay: 2, className: "col-span-6", children: _jsx(BentoCell, { num: "02 \u2014 Knowledge Library", title: "Indexed & Searchable", description: "Every data point ingested from your event is indexed and instantly searchable throughout your session.", variant: "accent", col_span: 6 }) }), _jsx(ScrollReveal, { delay: 3, className: "col-span-4", children: _jsx(BentoCell, { num: "03 \u2014 Locked Directive", title: "Prevents Feature Creep", description: "The strategic blueprint is locked to keep the team anchored to what matters.", icon: _jsx(LockKeyholeIcon, {}), variant: "dark-accent", col_span: 4 }) }), _jsx(ScrollReveal, { delay: 4, className: "col-span-8", children: _jsx(BentoCell, { num: "04 \u2014 Iterative Evolution", title: "Refine Without Losing Alignment", description: "As your project evolves, the session adapts \u2014 but the strategic guardrails keep every iteration tethered to the winning criteria.", icon: _jsx(RotateCcw, {}), col_span: 8, children: _jsx("div", { style: {
                                    display: "flex",
                                    gap: 8,
                                    marginTop: 20,
                                    flexWrap: "wrap",
                                }, children: INNER_TAGS.map((tag) => (_jsx("span", { className: "landing-tag", style: {
                                        padding: "5px 14px",
                                    }, children: tag }, tag))) }) }) })] })] }));
}
