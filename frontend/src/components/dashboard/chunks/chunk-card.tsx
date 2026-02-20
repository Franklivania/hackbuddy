import type { Chunk, WinnerSummary, SubjectSummary } from "@/types/chunks";
import { getChunkTitle, getChunkSubtitle, parseChunkSummary } from "@/types/chunks";
import { cn } from "@/lib/utils";

interface ChunkCardProps {
  chunk: Chunk;
  onClick: () => void;
}

const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  winner: {
    label: "Winner",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  subject: {
    label: "Subject",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
};

export function ChunkCard({ chunk, onClick }: ChunkCardProps) {
  const title = getChunkTitle(chunk);
  const subtitle = getChunkSubtitle(chunk);
  const badge = SOURCE_BADGE[chunk.source_type] ?? {
    label: chunk.source_type,
    className: "bg-muted text-muted-foreground",
  };

  const summary = parseChunkSummary(chunk.summary);
  const tags = getTags(summary, chunk.source_type);
  const description = getDescription(summary, chunk.source_type);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border border-border/60 bg-background p-4",
        "hover:border-primary/40 hover:shadow-sm transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "cursor-pointer group"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h4>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight",
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>

      {subtitle && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{subtitle}</p>
      )}

      {description && (
        <p className="text-xs text-foreground/70 mb-3 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{tags.length - 4}</span>
          )}
        </div>
      )}
    </button>
  );
}

function getTags(summary: ReturnType<typeof parseChunkSummary>, sourceType: string): string[] {
  if (!summary) return [];
  if (sourceType === "winner" && "tech_stack" in summary) {
    return (summary as WinnerSummary).tech_stack ?? [];
  }
  if (sourceType === "subject" && "tracks" in summary) {
    return (summary as SubjectSummary).tracks ?? [];
  }
  return [];
}

function getDescription(summary: ReturnType<typeof parseChunkSummary>, sourceType: string): string {
  if (!summary) return "";
  if (sourceType === "winner" && "problem_solved" in summary) {
    return (summary as WinnerSummary).problem_solved ?? "";
  }
  if (sourceType === "subject" && "ecosystem_summary" in summary) {
    return (summary as SubjectSummary).ecosystem_summary ?? "";
  }
  return "";
}
