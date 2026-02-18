import type { ReactNode } from "react";

type SectionHeaderProps = {
  label: string;
  title: ReactNode;
  description: string;
};

export function SectionHeader({ label, title, description }: SectionHeaderProps) {
  return (
    <>
      <p className="landing-label">{label}</p>
      <h2 className="landing-section-title">{title}</h2>
      <p className="landing-section-desc">{description}</p>
    </>
  );
}
