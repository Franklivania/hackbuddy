import React from "react";
import { parseMarkdown } from "@/lib/markdown-renderer";
import { AnalysisRenderer } from "@/lib/analysis-renderer";
import { useSessionManagerStore } from "@/lib/stores/session-manager";
import { cn } from "@/lib/utils";

interface SessionRenderedContentProps {
  content: string;
  className?: string;
}

export default function SessionRenderedContent({ content, className }: SessionRenderedContentProps) {
  const analysisData = useSessionManagerStore((s) => s.analysisData);

  if (analysisData) {
    return (
      <div className={cn("min-w-0 w-full max-w-none", className)}>
        <AnalysisRenderer data={analysisData} />
      </div>
    );
  }

  if (!content.trim()) return null;

  const nodes = parseMarkdown(content);

  return (
    <div className={cn("prose prose-sm dark:prose-invert min-w-0 w-full max-w-none", className)}>
      {nodes.map((node, i) => (node != null ? <React.Fragment key={i}>{node}</React.Fragment> : null))}
    </div>
  );
}
