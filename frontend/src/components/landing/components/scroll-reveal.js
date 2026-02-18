import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
export function ScrollReveal({ children, delay, className = "" }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    const delay_class = delay ? `landing-sr-delay-${delay}` : "";
    return (_jsx("div", { ref: ref, className: `landing-sr ${delay_class} ${className}`.trim(), children: children }));
}
