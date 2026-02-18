import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ScrollReveal } from "@/components/landing/components/scroll-reveal";
import { SectionHeader } from "@/components/landing/components/section-header";
import { BentoCell } from "@/components/landing/components/bento-cell";
import { Download, Settings, Shield } from "lucide-react";
export function WorkflowSection() {
    return (_jsxs("section", { id: "workflow", className: "landing-section", children: [_jsx(ScrollReveal, { children: _jsx(SectionHeader, { label: "Workflow", title: _jsxs(_Fragment, { children: ["From brief to blueprint", _jsx("br", {}), "in minutes."] }), description: "Four stages turn raw event information into a locked strategic execution plan your whole team aligns on." }) }), _jsxs("div", { className: "landing-bento-grid", children: [_jsx(ScrollReveal, { delay: 1, className: "col-span-5", children: _jsx(BentoCell, { num: "01 \u2014 Ingest", title: "Scrape the Signal", description: "Pull rules, judging criteria, and benchmark projects from the event brief automatically.", icon: _jsx(Download, {}), col_span: 5 }) }), _jsx(ScrollReveal, { delay: 2, className: "col-span-7", children: _jsx(BentoCell, { num: "02 \u2014 Synthesize", title: "Clean, Index & Summarize", description: "Content is processed into structured, searchable intelligence \u2014 nothing raw, nothing missed.", icon: _jsx(Settings, {}), variant: "dark-accent", col_span: 7, children: _jsxs("div", { className: "landing-terminal-block", children: [_jsxs("div", { className: "landing-terminal-line", children: [_jsx("span", { className: "kw", children: "\u2192 " }), _jsx("span", { className: "str", children: "ingesting" }), " event_brief.pdf"] }), _jsxs("div", { className: "landing-terminal-line", children: [_jsx("span", { className: "kw", children: "\u2192 " }), "extracting 14 judging criteria"] }), _jsxs("div", { className: "landing-terminal-line", children: [_jsx("span", { className: "kw", children: "\u2192 " }), _jsx("span", { className: "str", children: "indexing" }), " 38 past winner signals"] }), _jsxs("div", { className: "landing-terminal-line", children: [_jsx("span", { className: "kw", children: "\u2713 " }), "synthesis complete"] })] }) }) }), _jsx(ScrollReveal, { delay: 3, className: "col-span-8", children: _jsx(BentoCell, { num: "03 \u2014 Winning Directive", title: "Locked Strategic Blueprint", description: "Generates must-have criteria, surfaces the innovation gap, and defines demo positioning \u2014 then locks it.", variant: "accent", col_span: 8, children: _jsx("ul", { style: {
                                    marginTop: 20,
                                    listStyle: "none",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }, children: ["Must-have criteria extracted", "Innovation gap identified", "Demo positioning locked"].map((item) => (_jsxs("li", { style: {
                                        fontFamily: "var(--font-mono)",
                                        fontSize: 12,
                                        color: "rgba(10,10,10,0.65)",
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "center",
                                    }, children: [_jsx("span", { style: { color: "#0a0a0a" }, children: "\u2713" }), " ", item] }, item))) }) }) }), _jsx(ScrollReveal, { delay: 4, className: "col-span-4", children: _jsx(BentoCell, { num: "04 \u2014 Refinement", title: "Guard-Railed Chat", description: "Iterate and refine \u2014 scope drift blocked at every turn.", icon: _jsx(Shield, {}), col_span: 4 }) })] })] }));
}
