import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
];
export function Nav() {
    const [scrolled, set_scrolled] = useState(false);
    const user = useAuthStore((s) => s.user);
    useEffect(() => {
        const on_scroll = () => set_scrolled(window.scrollY > 20);
        window.addEventListener("scroll", on_scroll, { passive: true });
        return () => window.removeEventListener("scroll", on_scroll);
    }, []);
    return (_jsxs("nav", { className: `landing-nav ${scrolled ? "scrolled" : ""}`, "aria-label": "Main", children: [_jsxs(Link, { to: "/", className: "landing-nav-logo", children: [_jsx("span", { className: "landing-nav-logo-dot", "aria-hidden": true }), LOGO_LABEL] }), _jsx("ul", { className: "landing-nav-links", children: NAV_LINKS.map(({ href, label }) => (_jsx("li", { children: _jsx("a", { href: href, children: label }) }, href))) }), user ? (_jsx(Link, { to: "/dashboard", className: "landing-btn-primary", children: DASHBOARD_LABEL })) : (_jsx(Link, { to: "/auth", className: "landing-btn-primary", children: CTA_LABEL }))] }));
}
