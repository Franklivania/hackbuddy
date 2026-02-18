import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router";
import { ScrollReveal } from "@/components/landing/components/scroll-reveal";
import { useAuthStore } from "@/lib/stores/auth-store";
function ArrowIcon() {
    return (_jsx("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true, children: _jsx("path", { d: "M2.5 6H9.5M6.5 3L9.5 6L6.5 9", stroke: "#0a0a0a", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
export function CtaSection() {
    const user = useAuthStore((s) => s.user);
    return (_jsxs("section", { className: "landing-cta-section", "aria-labelledby": "cta-heading", children: [_jsx("div", { className: "landing-cta-bg", "aria-hidden": true }), _jsxs("div", { style: { position: "relative", zIndex: 1 }, children: [_jsx(ScrollReveal, { children: _jsx("p", { className: "landing-label", style: { justifyContent: "center" }, children: "Get Started" }) }), _jsx(ScrollReveal, { delay: 1, children: _jsx("h2", { id: "cta-heading", className: "landing-section-title", style: { maxWidth: 600, margin: "0 auto 20px", textAlign: "center" }, children: "Stop Building Blind." }) }), _jsx(ScrollReveal, { delay: 2, children: _jsx("p", { className: "landing-section-desc", style: { margin: "0 auto 48px", textAlign: "center" }, children: "Enter your next hackathon with a plan, not a guess. Ingest the brief, extract the patterns, and build with complete alignment." }) }), _jsx(ScrollReveal, { delay: 3, children: _jsxs("div", { style: {
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 14,
                                flexWrap: "wrap",
                            }, children: [_jsxs(Link, { to: user ? "/dashboard" : "/auth", className: "landing-btn-primary", style: { fontSize: 13, padding: "12px 28px" }, children: [user ? "Go to Dashboard" : "Start Your Session", _jsx(ArrowIcon, {})] }), _jsx("span", { style: {
                                        fontFamily: "var(--font-mono)",
                                        fontSize: 11,
                                        letterSpacing: "0.08em",
                                        color: "var(--landing-text-dim)",
                                    }, children: "No credit card required" })] }) })] })] }));
}
