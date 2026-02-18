import React from "react";
import { parseMarkdown } from "@/lib/markdown-renderer";
import { cn } from "@/lib/utils";

interface SessionRenderedContentProps {
  content: string;
  className?: string;
}

export default function SessionRenderedContent({ content, className }: SessionRenderedContentProps) {
  if (!content.trim()) return null;

  const nodes = parseMarkdown(content);

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      {nodes.map((node, i) => (node != null ? <React.Fragment key={i}>{node}</React.Fragment> : null))}
    </div>
  );
}
