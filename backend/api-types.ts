/**
 * HackBuddy Backend API – TypeScript types for all request/response payloads.
 * Base URL: /api/v1 (e.g. https://your-host.com/api/v1)
 * Auth: Bearer <token> in Authorization header for protected routes.
 */

// =============================================================================
// Generic API response wrapper (all JSON responses use this shape)
// =============================================================================

export type ApiStatus = 'success' | 'error';

export interface ApiResponse<T = unknown> {
  status: ApiStatus;
  data: T | null;
  message: string;
  success: boolean;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
}

// =============================================================================
// Auth
// =============================================================================

export interface RegisterInput {
  email: string;
  full_name: string;
  password: string; // min 6
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  email: string;
  code: string; // 6 chars
}

export interface ResendVerificationInput {
  email: string;
}

export interface LoginSuccessData {
  token: string;
}

// User (auth + user domain; same shape)
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  provider: 'email' | 'google' | 'github';
  verified: boolean;
  created_at: string; // ISO8601
  updated_at: string;
}

// =============================================================================
// Sessions
// =============================================================================

export interface CreateSessionInput {
  name: string;
}

export interface Session {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Sources (per-session)
// =============================================================================

export interface AddSourcesInput {
  links?: string[];       // winning-strategy URLs (optional, each must be valid URL)
  subject_link?: string; // hackathon URL (optional, valid URL)
}

export type SourceType = 'winner' | 'subject';
export type SourceStatus = 'pending' | 'scraped' | 'processed' | 'failed';

export interface Source {
  id: string;
  session_id: string;
  url: string;
  type: SourceType;
  status: SourceStatus;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Analysis (per-session)
// =============================================================================

export interface AnalyzeInput {
  directives?: string[];
}

export interface Analysis {
  id: string;
  session_id: string;
  result_json: string;   // JSON string from LLM
  recommendation: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Chat (per-session)
// =============================================================================

export interface ChatInput {
  message: string;
}

export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

// =============================================================================
// Admin
// =============================================================================

export interface UpdateRoleRequest {
  role: 'user' | 'admin';
}

export interface UpdateRoleSuccessData {
  role: 'user' | 'admin';
}

// =============================================================================
// Health (no auth)
// =============================================================================

export interface HealthResponse {
  status: 'ok';
}

export interface HealthDbResponse {
  status: 'ok' | 'error';
  message?: string;
}
