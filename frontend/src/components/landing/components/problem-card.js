import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ProblemCard({ card_label, title, description }) {
    return (_jsxs("div", { className: "landing-problem-card", children: [_jsx("span", { className: "landing-problem-card-label", children: card_label }), _jsx("p", { className: "landing-problem-card-title", children: title }), _jsx("p", { className: "landing-problem-card-desc", children: description })] }));
}
