import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function BentoCell({ num, title, description, icon, variant = "default", col_span, children }) {
    const variant_class = variant !== "default" ? variant : "";
    const col_class = `col-span-${col_span}`;
    return (_jsxs("div", { className: `landing-bento-cell ${variant_class} ${col_class}`, children: [_jsx("span", { className: "landing-bento-cell-num", children: num }), icon != null ? _jsx("div", { className: "landing-bento-icon", children: icon }) : null, _jsx("p", { className: "landing-bento-cell-title", children: title }), _jsx("p", { className: "landing-bento-cell-desc", children: description }), children] }));
}
