type ProblemCardProps = {
  card_label: string;
  title: string;
  description: string;
};

export function ProblemCard({ card_label, title, description }: ProblemCardProps) {
  return (
    <div className="landing-problem-card">
      <span className="landing-problem-card-label">{card_label}</span>
      <p className="landing-problem-card-title">{title}</p>
      <p className="landing-problem-card-desc">{description}</p>
    </div>
  );
}
