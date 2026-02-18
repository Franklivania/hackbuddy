import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const TICKER_ITEMS = [
    "Pattern Recognition",
    "Alignment Mapping",
    "Strategic Blueprint",
    "Demo Positioning",
    "Scope Guardrails",
    "Session Intelligence",
    "Criteria Extraction",
    "Winner Analysis",
];
export function Ticker() {
    const all_items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
    return (_jsx("div", { className: "landing-ticker-wrap", "aria-hidden": true, children: _jsx("div", { className: "landing-ticker-track", children: all_items.map((item, index) => (_jsxs("div", { className: "landing-ticker-item", children: [_jsx("span", { className: "landing-ticker-dot" }), item] }, `${item}-${index}`))) }) }));
}
