/**
 * Auth: register, login, verify-email, resend-otp.
 * User shape is shared with the user domain.
 */

export interface RegisterInput {
  email: string
  full_name: string
  password: string // min 6
}

export interface LoginInput {
  email: string
  password: string
}

export interface VerifyEmailInput {
  email: string
  code: string // 6 chars
}

export interface ResendVerificationInput {
  email: string
}

export interface LoginSuccessData {
  token: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin'
  provider: 'email' | 'google' | 'github'
  verified: boolean
  created_at: string // ISO8601
  updated_at: string
}
