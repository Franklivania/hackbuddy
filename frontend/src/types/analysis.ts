/**
 * Analysis (per-session): run analyze, list analyses.
 */

export interface AnalyzeInput {
  directives?: string[]
}

export interface Analysis {
  id: string
  session_id: string
  result_json: string // JSON string from LLM
  recommendation: string
  created_at: string
  updated_at: string
}
