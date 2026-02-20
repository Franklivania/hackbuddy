/**
 * Chunks: scraped + summarised data returned per session.
 */

export interface Chunk {
  id: string;
  session_id: string;
  doc_id: string;
  source_type: "winner" | "subject" | string;
  content: string;
  summary: string;
  token_count: number;
  created_at: string;
}

export interface WinnerSummary {
  hackathon_name?: string;
  project_name?: string;
  track_or_category?: string;
  tech_stack?: string[];
  problem_solved?: string;
  winning_strategies?: string[];
  demo_tactics?: string;
  differentiators?: string[];
  reason_won?: string;
}

export interface SubjectSummary {
  event_name?: string;
  dates?: string;
  duration?: string;
  tracks?: string[];
  judging_criteria?: string[];
  themes?: string[];
  prizes?: Array<{ name: string; amount: string }>;
  sponsor_technologies?: string[];
  constraints?: string[];
  inferred_biases?: string[];
  ecosystem_summary?: string;
}

export type ParsedSummary = WinnerSummary | SubjectSummary;

export function parseChunkSummary(raw: string): ParsedSummary | null {
  try {
    return JSON.parse(raw) as ParsedSummary;
  } catch {
    return null;
  }
}

export function getChunkTitle(chunk: Chunk): string {
  const summary = parseChunkSummary(chunk.summary);
  if (!summary) return "Untitled";

  if ("project_name" in summary && summary.project_name) return summary.project_name;
  if ("event_name" in summary && summary.event_name) return summary.event_name;
  return "Untitled";
}

export function getChunkSubtitle(chunk: Chunk): string {
  const summary = parseChunkSummary(chunk.summary);
  if (!summary) return "";

  if ("hackathon_name" in summary && summary.hackathon_name) return summary.hackathon_name;
  if ("dates" in summary && summary.dates) return summary.dates;
  return "";
}
