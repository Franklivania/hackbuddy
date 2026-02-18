const TICKER_ITEMS = [
  "Pattern Recognition",
  "Alignment Mapping",
  "Strategic Blueprint",
  "Demo Positioning",
  "Scope Guardrails",
  "Session Intelligence",
  "Criteria Extraction",
  "Winner Analysis",
] as const;

export function Ticker() {
  const all_items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="landing-ticker-wrap" aria-hidden>
      <div className="landing-ticker-track">
        {all_items.map((item, index) => (
          <div key={`${item}-${index}`} className="landing-ticker-item">
            <span className="landing-ticker-dot" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
