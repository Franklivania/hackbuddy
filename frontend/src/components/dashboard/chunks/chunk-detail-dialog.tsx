import React from "react";
import type { Chunk, WinnerSummary, SubjectSummary } from "@/types/chunks";
import { getChunkTitle, parseChunkSummary } from "@/types/chunks";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ChunkDetailDialogProps {
  chunk: Chunk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCE_LABEL: Record<string, string> = {
  winner: "Winning Project",
  subject: "Hackathon Details",
};

export function ChunkDetailDialog({ chunk, open, onOpenChange }: ChunkDetailDialogProps) {
  if (!chunk) return null;

  const title = getChunkTitle(chunk);
  const summary = parseChunkSummary(chunk.summary);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>
            {SOURCE_LABEL[chunk.source_type] ?? chunk.source_type}
          </DialogDescription>
        </DialogHeader>

        {summary && (
          <div className="space-y-5 pt-2">
            {chunk.source_type === "winner" ? (
              <WinnerDetail summary={summary as WinnerSummary} />
            ) : chunk.source_type === "subject" ? (
              <SubjectDetail summary={summary as SubjectSummary} />
            ) : (
              <GenericDetail summary={summary as Record<string, unknown>} />
            )}
          </div>
        )}

        {chunk.content && (
          <details className="mt-4 group">
            <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Raw scraped content
            </summary>
            <div className="mt-2 rounded-md border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {chunk.content}
            </div>
          </details>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {children}
    </span>
  );
}

function TagList({ items, className }: { items: string[]; className?: string }) {
  if (!items.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((t) => (
        <span
          key={t}
          className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/80"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1 ml-4 list-disc list-outside text-sm text-foreground/85 leading-relaxed">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function WinnerDetail({ summary }: { summary: WinnerSummary }) {
  return (
    <>
      {summary.hackathon_name && (
        <Field label="Hackathon">{summary.hackathon_name}</Field>
      )}
      {summary.track_or_category && (
        <Field label="Track / Category">{summary.track_or_category}</Field>
      )}
      {summary.problem_solved && (
        <Field label="Problem Solved">{summary.problem_solved}</Field>
      )}
      {summary.tech_stack && summary.tech_stack.length > 0 && (
        <div>
          <SectionLabel>Tech Stack</SectionLabel>
          <TagList items={summary.tech_stack} className="mt-1" />
        </div>
      )}
      {summary.winning_strategies && summary.winning_strategies.length > 0 && (
        <div>
          <SectionLabel>Winning Strategies</SectionLabel>
          <BulletList items={summary.winning_strategies} />
        </div>
      )}
      {summary.demo_tactics && (
        <Field label="Demo Tactics">{summary.demo_tactics}</Field>
      )}
      {summary.differentiators && summary.differentiators.length > 0 && (
        <div>
          <SectionLabel>Differentiators</SectionLabel>
          <BulletList items={summary.differentiators} />
        </div>
      )}
      {summary.reason_won && (
        <Field label="Why It Won">{summary.reason_won}</Field>
      )}
    </>
  );
}

function SubjectDetail({ summary }: { summary: SubjectSummary }) {
  return (
    <>
      {summary.dates && <Field label="Dates">{summary.dates}</Field>}
      {summary.duration && <Field label="Duration">{summary.duration}</Field>}
      {summary.tracks && summary.tracks.length > 0 && (
        <div>
          <SectionLabel>Tracks</SectionLabel>
          <TagList items={summary.tracks} className="mt-1" />
        </div>
      )}
      {summary.judging_criteria && summary.judging_criteria.length > 0 && (
        <div>
          <SectionLabel>Judging Criteria</SectionLabel>
          <BulletList items={summary.judging_criteria} />
        </div>
      )}
      {summary.prizes && summary.prizes.length > 0 && (
        <div>
          <SectionLabel>Prizes</SectionLabel>
          <div className="mt-1 space-y-1">
            {summary.prizes.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground/85">{p.name}</span>
                <span className="font-medium text-foreground">{p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {summary.constraints && summary.constraints.length > 0 && (
        <div>
          <SectionLabel>Constraints</SectionLabel>
          <BulletList items={summary.constraints} />
        </div>
      )}
      {summary.ecosystem_summary && (
        <Field label="Summary">{summary.ecosystem_summary}</Field>
      )}
    </>
  );
}

function GenericDetail({ summary }: { summary: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      {Object.entries(summary)
        .filter(([, v]) => v != null && v !== "")
        .map(([key, value]) => (
          <Field key={key} label={humanize(key)}>
            {Array.isArray(value) ? value.join(", ") : String(value)}
          </Field>
        ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className="mt-0.5 text-sm text-foreground/85 leading-relaxed">{children}</p>
    </div>
  );
}

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
