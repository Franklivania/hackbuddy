import type { ReactNode } from "react";

type BentoCellVariant = "default" | "accent" | "dark-accent";
type ColSpan = 3 | 4 | 5 | 6 | 7 | 8;

type BentoCellProps = {
  num: string;
  title: string;
  description: string;
  icon?: ReactNode;
  variant?: BentoCellVariant;
  col_span: ColSpan;
  children?: ReactNode;
};

export function BentoCell({ num, title, description, icon, variant = "default", col_span, children }: BentoCellProps) {
  const variant_class = variant !== "default" ? variant : "";
  const col_class = `col-span-${col_span}`;
  return (
    <div className={`landing-bento-cell ${variant_class} ${col_class}`}>
      <span className="landing-bento-cell-num">{num}</span>
      {icon != null ? <div className="landing-bento-icon">{icon}</div> : null}
      <p className="landing-bento-cell-title">{title}</p>
      <p className="landing-bento-cell-desc">{description}</p>
      {children}
    </div>
  );
}
