import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router";
const COPY_YEAR = new Date().getFullYear();
export function Footer() {
    return (_jsxs("footer", { className: "landing-footer", children: [_jsx(Link, { to: "/", className: "landing-footer-logo", children: "HackBuddy" }), _jsxs("span", { className: "landing-footer-copy", children: ["\u00A9 ", COPY_YEAR, " HackBuddy. All rights reserved."] })] }));
}
