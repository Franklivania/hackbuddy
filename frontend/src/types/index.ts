/**
 * HackBuddy API types – single entry point.
 * Import from '@/types' or '~/types' for usage across the app.
 *
 * Backend base URL: /api/v1
 * Auth: Bearer <token> in Authorization header for protected routes.
 */

// Generic API
export type {
  ApiStatus,
  ApiResponse,
  ValidationErrorItem,
} from './api'

// Auth & user (shared User type)
export type {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendVerificationInput,
  LoginSuccessData,
  User,
} from './auth'

// Sessions
export type {
  CreateSessionInput,
  Session,
} from './sessions'

// Sources (per-session)
export type {
  AddSourcesInput,
  SourceType,
  SourceStatus,
  Source,
} from './sources'

// Analysis (per-session)
export type {
  AnalyzeInput,
  Analysis,
} from './analysis'

// Chat (per-session)
export type {
  ChatInput,
  MessageRole,
  Message,
} from './chat'

// Admin
export type {
  UpdateRoleRequest,
  UpdateRoleSuccessData,
} from './admin'

// Health
export type {
  HealthResponse,
  HealthDbResponse,
} from './health'
