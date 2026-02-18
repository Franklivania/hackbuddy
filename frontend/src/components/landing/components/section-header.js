import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
export function SectionHeader({ label, title, description }) {
    return (_jsxs(_Fragment, { children: [_jsx("p", { className: "landing-label", children: label }), _jsx("h2", { className: "landing-section-title", children: title }), _jsx("p", { className: "landing-section-desc", children: description })] }));
}
