import { ScrollReveal } from "@/components/landing/components/scroll-reveal";
import { SectionHeader } from "@/components/landing/components/section-header";
import { BentoCell } from "@/components/landing/components/bento-cell";
import { Download, Settings, Shield } from "lucide-react";

export function WorkflowSection() {
  return (
    <section id="workflow" className="landing-section">
      <ScrollReveal>
        <SectionHeader
          label="Workflow"
          title={
            <>
              From brief to blueprint
              <br />
              in minutes.
            </>
          }
          description="Four stages turn raw event information into a locked strategic execution plan your whole team aligns on."
        />
      </ScrollReveal>

      <div className="landing-bento-grid">
        <ScrollReveal delay={1} className="col-span-5">
          <BentoCell
            num="01 — Ingest"
            title="Scrape the Signal"
            description="Pull rules, judging criteria, and benchmark projects from the event brief automatically."
            icon={<Download />}
            col_span={5}
          />
        </ScrollReveal>

        <ScrollReveal delay={2} className="col-span-7">
          <BentoCell
            num="02 — Synthesize"
            title="Clean, Index & Summarize"
            description="Content is processed into structured, searchable intelligence — nothing raw, nothing missed."
            icon={<Settings />}
            variant="dark-accent"
            col_span={7}
          >
            <div className="landing-terminal-block">
              <div className="landing-terminal-line">
                <span className="kw">→ </span>
                <span className="str">ingesting</span> event_brief.pdf
              </div>
              <div className="landing-terminal-line">
                <span className="kw">→ </span>extracting 14 judging criteria
              </div>
              <div className="landing-terminal-line">
                <span className="kw">→ </span>
                <span className="str">indexing</span> 38 past winner signals
              </div>
              <div className="landing-terminal-line">
                <span className="kw">✓ </span>synthesis complete
              </div>
            </div>
          </BentoCell>
        </ScrollReveal>

        <ScrollReveal delay={3} className="col-span-8">
          <BentoCell
            num="03 — Winning Directive"
            title="Locked Strategic Blueprint"
            description="Generates must-have criteria, surfaces the innovation gap, and defines demo positioning — then locks it."
            variant="accent"
            col_span={8}
          >
            <ul
              style={{
                marginTop: 20,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {["Must-have criteria extracted", "Innovation gap identified", "Demo positioning locked"].map(
                (item) => (
                  <li
                    key={item}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "rgba(10,10,10,0.65)",
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: "#0a0a0a" }}>✓</span> {item}
                  </li>
                )
              )}
            </ul>
          </BentoCell>
        </ScrollReveal>

        <ScrollReveal delay={4} className="col-span-4">
          <BentoCell
            num="04 — Refinement"
            title="Guard-Railed Chat"
            description="Iterate and refine — scope drift blocked at every turn."
            icon={<Shield />}
            col_span={4}
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
