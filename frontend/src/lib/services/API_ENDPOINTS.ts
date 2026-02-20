/**
 * API endpoint paths. Use with your base URL (e.g. import { API_BASE } from '@/lib/config').
 * Path params: {id} = session id, {user_id} = user id.
 */

// ─── Admin ─────────────────────────────────────────────────────────────────
export const ADMIN = {
  analyses: '/admin/analyses',
  model: '/admin/model',
  sessions: '/admin/sessions',
  usage: '/admin/usage',
  usageSummary: '/admin/usage/summary',
  users: '/admin/users',
  role: (userId: string) => `/admin/role/${userId}`,
  userSoftDelete: (userId: string) => `/admin/user/${userId}/delete`,
  userHardDelete: (userId: string) => `/admin/user/${userId}/hard-delete`,
} as const;

// ─── Auth ──────────────────────────────────────────────────────────────────
export const AUTH = {
  login: '/auth/login',
  logout: '/auth/logout',
  register: '/auth/register',
  verifyEmail: '/auth/verify-email',
  resendOtp: '/auth/resend-otp',
  github: '/auth/github',
  githubCallback: '/auth/github/callback',
  google: '/auth/google',
  googleCallback: '/auth/google/callback',
} as const;

// ─── Sessions ──────────────────────────────────────────────────────────────
export const SESSIONS = {
  list: '/sessions',
  create: '/sessions',
  one: (id: string) => `/sessions/${id}`,
  delete: (id: string) => `/sessions/${id}`,
} as const;

// ─── Analysis (per session) ────────────────────────────────────────────────
export const ANALYSIS = {
  list: (sessionId: string) => `/sessions/${sessionId}/analyses`,
  summary: (sessionId: string) => `/sessions/${sessionId}/analysis/summary`,
  run: (sessionId: string) => `/sessions/${sessionId}/analyze`,
} as const;

// ─── Chat (per session) ─────────────────────────────────────────────────────
export const CHAT = {
  send: (sessionId: string) => `/sessions/${sessionId}/chat`,
  history: (sessionId: string) => `/sessions/${sessionId}/chat`,
} as const;

// ─── Sources (per session) ───────────────────────────────────────────────────
export const SOURCES = {
  chunks: (sessionId: string) => `/sessions/${sessionId}/chunks`,
  list: (sessionId: string) => `/sessions/${sessionId}/sources`,
  add: (sessionId: string) => `/sessions/${sessionId}/sources`,
} as const;

// ─── Users ─────────────────────────────────────────────────────────────────
export const USERS = {
  me: '/users/me',
  meDelete: '/users/me/delete',
  byId: (id: string) => `/users/${id}`,
} as const;

// Flat map of method + path for reference
export const API_ENDPOINTS = {
  admin: {
    'GET /admin/analyses': ADMIN.analyses,
    'GET /admin/model': ADMIN.model,
    'PATCH /admin/model': ADMIN.model,
    'PATCH /admin/role/:user_id': ADMIN.role,
    'GET /admin/sessions': ADMIN.sessions,
    'GET /admin/usage': ADMIN.usage,
    'GET /admin/usage/summary': ADMIN.usageSummary,
    'DELETE /admin/user/:user_id/delete': ADMIN.userSoftDelete,
    'DELETE /admin/user/:user_id/hard-delete': ADMIN.userHardDelete,
    'GET /admin/users': ADMIN.users,
  },
  auth: {
    'GET /auth/github': AUTH.github,
    'GET /auth/github/callback': AUTH.githubCallback,
    'GET /auth/google': AUTH.google,
    'GET /auth/google/callback': AUTH.googleCallback,
    'POST /auth/login': AUTH.login,
    'POST /auth/logout': AUTH.logout,
    'POST /auth/register': AUTH.register,
    'POST /auth/resend-otp': AUTH.resendOtp,
    'POST /auth/verify-email': AUTH.verifyEmail,
  },
  sessions: {
    'GET /sessions': SESSIONS.list,
    'POST /sessions': SESSIONS.create,
    'GET /sessions/:id': SESSIONS.one,
    'PATCH /sessions/:id': SESSIONS.one,
    'DELETE /sessions/:id': SESSIONS.delete,
  },
  analysis: {
    'GET /sessions/:id/analyses': ANALYSIS.list,
    'GET /sessions/:id/analysis/summary': ANALYSIS.summary,
    'POST /sessions/:id/analyze': ANALYSIS.run,
  },
  chat: {
    'GET /sessions/:id/chat': CHAT.history,
    'POST /sessions/:id/chat': CHAT.send,
  },
  sources: {
    'GET /sessions/:id/chunks': SOURCES.chunks,
    'GET /sessions/:id/sources': SOURCES.list,
    'POST /sessions/:id/sources': SOURCES.add,
  },
  users: {
    'GET /users/me': USERS.me,
    'DELETE /users/me/delete': USERS.meDelete,
    'GET /users/:id': USERS.byId,
  },
} as const;
