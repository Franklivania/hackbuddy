import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function OutputItem({ tag, title, description, num }) {
    return (_jsxs("div", { className: "landing-output-item", children: [_jsx("span", { className: "landing-output-tag", children: tag }), _jsx("p", { className: "landing-output-title", children: title }), _jsx("p", { className: "landing-output-desc", children: description }), _jsx("span", { className: "landing-output-item-num", "aria-hidden": true, children: num })] }));
}
