/**
 * Sources (per-session): add, list.
 */

export interface AddSourcesInput {
  links?: string[] // winning-strategy URLs (optional, each must be valid URL)
  subject_link?: string // hackathon URL (optional, valid URL)
}

export type SourceType = 'winner' | 'subject'
export type SourceStatus = 'pending' | 'scraped' | 'processed' | 'failed'

export interface Source {
  id: string
  session_id: string
  url: string
  type: SourceType
  status: SourceStatus
  created_at: string
  updated_at: string
}
