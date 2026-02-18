import { ScrollReveal } from "@/components/landing/components/scroll-reveal";
import { SectionHeader } from "@/components/landing/components/section-header";
import { BentoCell } from "@/components/landing/components/bento-cell";
import { Command, LockKeyholeIcon, RotateCcw } from "lucide-react";

const INNER_TAGS = ["pivot-safe", "criteria-anchored", "real-time"];

export function InsideSection() {
  return (
    <section id="inside" className="landing-section">
      <ScrollReveal>
        <SectionHeader
          label="Inside Session"
          title={
            <>
              Your command center
              <br />
              for the entire event.
            </>
          }
          description="A purpose-built workspace that keeps your team aligned, informed, and focused from brief to demo."
        />
      </ScrollReveal>

      <div className="landing-bento-grid">
        <ScrollReveal delay={1} className="col-span-6">
          <BentoCell
            num="01 — Command Center"
            title="Dedicated Hackathon Workspace"
            description="A single hub for your event. Rules, strategy, directive, and chat — all in one scoped environment."
            icon={<Command />}
            col_span={6}
          />
        </ScrollReveal>

        <ScrollReveal delay={2} className="col-span-6">
          <BentoCell
            num="02 — Knowledge Library"
            title="Indexed & Searchable"
            description="Every data point ingested from your event is indexed and instantly searchable throughout your session."
            variant="accent"
            col_span={6}
          />
        </ScrollReveal>

        <ScrollReveal delay={3} className="col-span-4">
          <BentoCell
            num="03 — Locked Directive"
            title="Prevents Feature Creep"
            description="The strategic blueprint is locked to keep the team anchored to what matters."
            icon={<LockKeyholeIcon />}
            variant="dark-accent"
            col_span={4}
          />
        </ScrollReveal>

        <ScrollReveal delay={4} className="col-span-8">
          <BentoCell
            num="04 — Iterative Evolution"
            title="Refine Without Losing Alignment"
            description="As your project evolves, the session adapts — but the strategic guardrails keep every iteration tethered to the winning criteria."
            icon={<RotateCcw />}
            col_span={8}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 20,
                flexWrap: "wrap",
              }}
            >
              {INNER_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="landing-tag"
                  style={{
                    padding: "5px 14px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </BentoCell>
        </ScrollReveal>
      </div>
    </section>
  );
}
