import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getAuthTokenFromCookies,
  setAuthTokenCookie,
  clearAuthTokenCookie,
} from '@/lib/services/api-setup'
import { getData, postData } from '@/lib/services/api-actions'
import { AUTH, USERS } from '@/lib/services/API_ENDPOINTS'
import type {
  User,
  LoginInput,
  RegisterInput,
  VerifyEmailInput,
  ResendVerificationInput,
} from '@/types'
import type { ApiResponse } from '@/types/api'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

export type LoginMode = 'email' | 'google' | 'github'

interface AuthState {
  user: User | null
  token: string | null
  lastLoginMode: LoginMode | null
  isLoading: boolean
  isHydrated: boolean
}

interface AuthActions {
  setToken: (token: string) => void
  clearAuth: () => void
  logout: () => Promise<void>
  setLastLoginMode: (mode: LoginMode) => void
  hydrateFromCookie: () => void
  fetchProfile: () => Promise<User | null>
  login: (input: LoginInput) => Promise<{ ok: boolean; error?: string }>
  register: (input: RegisterInput) => Promise<{ ok: boolean; error?: string }>
  verifyEmail: (input: VerifyEmailInput) => Promise<{ ok: boolean; error?: string }>
  resendOtp: (input: ResendVerificationInput) => Promise<{ ok: boolean; error?: string }>
  startGoogleLogin: () => void
  startGithubLogin: () => void
  completeOAuthWithToken: (token: string, provider: LoginMode) => Promise<{ ok: boolean; error?: string }>
}

type LoginApiResponse = ApiResponse<{ token: string }>

function extractTokenFromLoginResponse(response: { data: LoginApiResponse }): string | null {
  const body = response.data
  if (body?.success && body?.data?.token) return body.data.token
  return null
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      lastLoginMode: null,
      isLoading: false,
      isHydrated: false,

      setToken(token) {
        setAuthTokenCookie(token)
        set({ token })
      },

      clearAuth() {
        clearAuthTokenCookie()
        set({ user: null, token: null })
      },

      async logout() {
        try {
          const token = get().token ?? getAuthTokenFromCookies()
          if (token) {
            await postData<ApiResponse<unknown>>(AUTH.logout)
          }
        } catch {
          // Even if server logout fails, clear client auth state
        } finally {
          get().clearAuth()
        }
      },

      setLastLoginMode(lastLoginMode) {
        set({ lastLoginMode })
      },

      hydrateFromCookie() {
        const token = getAuthTokenFromCookies()
        set({ token, isHydrated: true })
      },

      async fetchProfile() {
        const { token } = get()
        if (!token) return null
        try {
          const { data } = await getData<{ data: User }>(USERS.me)
          const user = (data as { data?: User })?.data ?? (data as unknown as User)
          if (user?.id) {
            set({ user })
            return user
          }
          return null
        } catch {
          get().clearAuth()
          return null
        }
      },

      async login(input: LoginInput) {
        set({ isLoading: true })
        try {
          const result = await postData<LoginApiResponse, LoginInput>(AUTH.login, input, {
            skipAuth: true,
          })
          const token = extractTokenFromLoginResponse(result as { data: LoginApiResponse })
          if (!token) {
            return { ok: false, error: 'Invalid response' }
          }
          setAuthTokenCookie(token)
          set({ token, lastLoginMode: 'email' })
          const user = await get().fetchProfile()
          return user ? { ok: true } : { ok: false, error: 'Failed to load profile' }
        } catch (err: unknown) {
          const data = err && typeof err === 'object' && 'data' in err ? (err as { data?: { message?: string } }).data : null
          const message = data?.message ?? (err instanceof Error ? err.message : 'Login failed')
          return { ok: false, error: String(message) }
        } finally {
          set({ isLoading: false })
        }
      },

      async register(input: RegisterInput) {
        set({ isLoading: true })
        try {
          await postData<ApiResponse<unknown>, RegisterInput>(AUTH.register, input, {
            skipAuth: true,
          })
          set({ lastLoginMode: 'email' })
          return { ok: true }
        } catch (err: unknown) {
          const data = err && typeof err === 'object' && 'data' in err ? (err as { data?: { message?: string } }).data : null
          const message = data?.message ?? (err instanceof Error ? err.message : 'Registration failed')
          return { ok: false, error: String(message) }
        } finally {
          set({ isLoading: false })
        }
      },

      async verifyEmail(input: VerifyEmailInput) {
        set({ isLoading: true })
        try {
          await postData<ApiResponse<unknown>, VerifyEmailInput>(AUTH.verifyEmail, input, {
            skipAuth: true,
          })
          set({ lastLoginMode: 'email' })
          return { ok: true }
        } catch (err: unknown) {
          const data = err && typeof err === 'object' && 'data' in err ? (err as { data?: { message?: string } }).data : null
          const message = data?.message ?? (err instanceof Error ? err.message : 'Verification failed')
          return { ok: false, error: String(message) }
        } finally {
          set({ isLoading: false })
        }
      },

      async resendOtp(input: ResendVerificationInput) {
        set({ isLoading: true })
        try {
          await postData<ApiResponse<unknown>, ResendVerificationInput>(AUTH.resendOtp, input, {
            skipAuth: true,
          })
          return { ok: true }
        } catch (err: unknown) {
          const data = err && typeof err === 'object' && 'data' in err ? (err as { data?: { message?: string } }).data : null
          const message = data?.message ?? (err instanceof Error ? err.message : 'Resend failed')
          return { ok: false, error: String(message) }
        } finally {
          set({ isLoading: false })
        }
      },

      startGoogleLogin() {
        const url = `${API_BASE_URL}${AUTH.google}`
        window.location.href = url
      },

      startGithubLogin() {
        const url = `${API_BASE_URL}${AUTH.github}`
        window.location.href = url
      },

      async completeOAuthWithToken(token: string, provider: LoginMode) {
        set({ isLoading: true })
        try {
          setAuthTokenCookie(token)
          set({ token, lastLoginMode: provider })
          const user = await get().fetchProfile()
          return user ? { ok: true } : { ok: false, error: 'Failed to load profile' }
        } catch {
          return { ok: false, error: 'Failed to load profile' }
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'hackbuddy-auth',
      partialize: (s) => ({ lastLoginMode: s.lastLoginMode }),
    }
  )
)
