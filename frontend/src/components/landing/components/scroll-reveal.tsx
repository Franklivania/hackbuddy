import { useEffect, useRef, type ReactNode } from "react";

type Delay = 1 | 2 | 3 | 4;

type ScrollRevealProps = {
  children: ReactNode;
  delay?: Delay;
  className?: string;
};

export function ScrollReveal({ children, delay, className = "" }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delay_class = delay ? `landing-sr-delay-${delay}` : "";

  return (
    <div ref={ref} className={`landing-sr ${delay_class} ${className}`.trim()}>
      {children}
    </div>
  );
}
