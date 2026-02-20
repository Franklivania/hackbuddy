/**
 * Admin domain types – users, sessions, analyses, usage, model config.
 */

import type { User } from './auth'
import type { Session } from './sessions'
import type { Analysis } from './analysis'

export type AdminUser = User
export type AdminSession = Session
export type AdminAnalysis = Analysis

export interface TokenUsage {
  id: string
  user_id: string
  session_id: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  created_at: string
}

export interface UsageSummaryRow {
  user_id: string
  session_id: string
  model: string
  total_tokens: number
  request_count: number
}

export interface ModelInfo {
  active: string
  available: string[]
}

export interface UpdateRoleRequest {
  role: 'user' | 'admin'
}

export interface UpdateModelRequest {
  model: string
}

