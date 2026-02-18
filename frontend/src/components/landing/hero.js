import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
const EYEBROW = "Hackathon Intelligence Platform";
const HEADLINE = (_jsxs(_Fragment, { children: ["Win Hackathons With", _jsx("br", {}), _jsx("em", { children: "Strategy," }), " Not Guesswork."] }));
const SUB = "Converts event briefs and past winner data into a structured execution roadmap your team can act on immediately.";
const TAGS = ["Ingest the rules", "Extract the patterns", "Build with alignment"];
const STATS = [
    { num: "3×", label: "Faster Strategy" },
    { num: "94%", label: "Criteria Alignment" },
    { num: "Zero", label: "Scope Drift" },
];
function ArrowIcon() {
    return (_jsx("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true, children: _jsx("path", { d: "M2.5 6H9.5M6.5 3L9.5 6L6.5 9", stroke: "#0a0a0a", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
export function Hero() {
    const glow_ref = useRef(null);
    const user = useAuthStore((s) => s.user);
    useEffect(() => {
        const el = glow_ref.current;
        if (!el)
            return;
        const on_move = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 30;
            const y = (e.clientY / window.innerHeight - 0.5) * 30;
            el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        };
        window.addEventListener("mousemove", on_move, { passive: true });
        return () => window.removeEventListener("mousemove", on_move);
    }, []);
    return (_jsxs("section", { className: "landing-hero", "aria-labelledby": "hero-heading", children: [_jsx("div", { className: "landing-hero-bg-grid", "aria-hidden": true }), _jsx("div", { ref: glow_ref, className: "landing-hero-glow", "aria-hidden": true }), _jsxs("div", { style: {
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }, children: [_jsx("div", { className: "landing-hero-eyebrow", children: EYEBROW }), _jsx("h1", { id: "hero-heading", className: "landing-hero-h1", children: HEADLINE }), _jsx("p", { className: "landing-hero-sub", children: SUB }), _jsxs("div", { className: "landing-hero-cta-group", children: [_jsxs(Link, { to: user ? "/dashboard" : "/auth", className: "landing-btn-primary", children: [user ? "Go to Dashboard" : "Start Your Session", _jsx(ArrowIcon, {})] }), _jsx("a", { href: "#workflow", className: "landing-btn-ghost", children: "See How It Works" })] }), _jsx("div", { className: "landing-hero-tags", children: TAGS.map((tag) => (_jsx("span", { className: "landing-tag", children: tag }, tag))) }), _jsx("div", { className: "landing-hero-stat-strip", children: STATS.map(({ num, label }) => (_jsxs("div", { className: "landing-stat-item", children: [_jsx("span", { className: "landing-stat-num", children: num }), _jsx("span", { className: "landing-stat-label", children: label })] }, label))) })] })] }));
}
