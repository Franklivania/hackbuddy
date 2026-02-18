type OutputItemProps = {
  tag: string;
  title: string;
  description: string;
  num: string;
};

export function OutputItem({ tag, title, description, num }: OutputItemProps) {
  return (
    <div className="landing-output-item">
      <span className="landing-output-tag">{tag}</span>
      <p className="landing-output-title">{title}</p>
      <p className="landing-output-desc">{description}</p>
      <span className="landing-output-item-num" aria-hidden>{num}</span>
    </div>
  );
}
