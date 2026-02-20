import { create } from 'zustand'
import { getData, patchData, deleteData, postData } from '@/lib/services/api-actions'
import { ADMIN, AUTH } from '@/lib/services/API_ENDPOINTS'
import type { ApiResponse } from '@/types/api'
import type {
  AdminUser,
  AdminSession,
  AdminAnalysis,
  TokenUsage,
  UsageSummaryRow,
  ModelInfo,
  UpdateRoleRequest,
  UpdateModelRequest,
} from '@/types/admin'

type FeedbackEntry = { type: 'success' | 'error'; message: string }

interface AdminState {
  users: AdminUser[]
  sessions: AdminSession[]
  analyses: AdminAnalysis[]
  usage: TokenUsage[]
  usageSummary: UsageSummaryRow[]
  modelInfo: ModelInfo | null
  selectedUserId: string | null
  loading: Record<string, boolean>
  feedback: Record<string, FeedbackEntry>
  initialized: boolean
}

interface AdminActions {
  selectUser: (id: string | null) => void
  clearFeedback: (key: string) => void

  fetchUsers: () => Promise<void>
  fetchSessions: () => Promise<void>
  fetchAnalyses: () => Promise<void>
  fetchUsage: (userId?: string, sessionId?: string) => Promise<void>
  fetchUsageSummary: () => Promise<void>
  fetchModelInfo: () => Promise<void>

  updateRole: (userId: string, role: 'user' | 'admin') => Promise<boolean>
  updateModel: (model: string) => Promise<boolean>
  softDeleteUser: (userId: string) => Promise<boolean>
  hardDeleteUser: (userId: string) => Promise<boolean>
  resendVerification: (email: string) => Promise<boolean>

  bootstrap: () => Promise<void>
}

function unwrap<T>(res: { data: ApiResponse<T> | null }): T | null {
  const body = res.data
  if (!body?.success || body.data == null) return null
  return body.data as T
}

function extractError(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data?: { message?: string } }).data
    if (d?.message) return d.message
  }
  return err instanceof Error ? err.message : 'Something went wrong'
}

const initialState: AdminState = {
  users: [],
  sessions: [],
  analyses: [],
  usage: [],
  usageSummary: [],
  modelInfo: null,
  selectedUserId: null,
  loading: {},
  feedback: {},
  initialized: false,
}

export const useAdminStore = create<AdminState & AdminActions>()((set, get) => {
  const setLoading = (key: string, val: boolean) =>
    set((s) => ({ loading: { ...s.loading, [key]: val } }))
  const setFeedback = (key: string, entry: FeedbackEntry) =>
    set((s) => ({ feedback: { ...s.feedback, [key]: entry } }))
  const autoClean = (key: string) =>
    setTimeout(() => {
      set((s) => {
        const next = { ...s.feedback }
        delete next[key]
        return { feedback: next }
      })
    }, 4000)

  return {
    ...initialState,

    selectUser(id) {
      set({ selectedUserId: id })
    },
    clearFeedback(key) {
      set((s) => {
        const next = { ...s.feedback }
        delete next[key]
        return { feedback: next }
      })
    },

    async fetchUsers() {
      setLoading('users', true)
      try {
        const res = await getData<ApiResponse<AdminUser[]>>(ADMIN.users)
        const data = unwrap<AdminUser[]>(res)
        if (data) set({ users: data })
      } catch (err) {
        setFeedback('users', { type: 'error', message: extractError(err) })
      } finally {
        setLoading('users', false)
      }
    },

    async fetchSessions() {
      setLoading('sessions', true)
      try {
        const res = await getData<ApiResponse<AdminSession[]>>(ADMIN.sessions)
        const data = unwrap<AdminSession[]>(res)
        if (data) set({ sessions: data })
      } catch (err) {
        setFeedback('sessions', { type: 'error', message: extractError(err) })
      } finally {
        setLoading('sessions', false)
      }
    },

    async fetchAnalyses() {
      setLoading('analyses', true)
      try {
        const res = await getData<ApiResponse<AdminAnalysis[]>>(ADMIN.analyses)
        const data = unwrap<AdminAnalysis[]>(res)
        if (data) set({ analyses: data })
      } catch (err) {
        setFeedback('analyses', { type: 'error', message: extractError(err) })
      } finally {
        setLoading('analyses', false)
      }
    },

    async fetchUsage(userId?: string, sessionId?: string) {
      setLoading('usage', true)
      try {
        const params: Record<string, string> = {}
        if (userId) params.user_id = userId
        if (sessionId) params.session_id = sessionId
        const res = await getData<ApiResponse<TokenUsage[]>>(ADMIN.usage, { queryParams: params })
        const data = unwrap<TokenUsage[]>(res)
        if (data) set({ usage: data })
      } catch (err) {
        setFeedback('usage', { type: 'error', message: extractError(err) })
      } finally {
        setLoading('usage', false)
      }
    },

    async fetchUsageSummary() {
      setLoading('usageSummary', true)
      try {
        const res = await getData<ApiResponse<UsageSummaryRow[]>>(ADMIN.usageSummary)
        const data = unwrap<UsageSummaryRow[]>(res)
        if (data) set({ usageSummary: data })
      } catch (err) {
        setFeedback('usageSummary', { type: 'error', message: extractError(err) })
      } finally {
        setLoading('usageSummary', false)
      }
    },

    async fetchModelInfo() {
      setLoading('model', true)
      try {
        const res = await getData<ApiResponse<ModelInfo>>(ADMIN.model)
        const data = unwrap<ModelInfo>(res)
        if (data) set({ modelInfo: data })
      } catch (err) {
        setFeedback('model', { type: 'error', message: extractError(err) })
      } finally {
        setLoading('model', false)
      }
    },

    async updateRole(userId, role) {
      const key = `role-${userId}`
      setLoading(key, true)
      try {
        await patchData<ApiResponse<{ role: string }>, UpdateRoleRequest>(ADMIN.role(userId), { role })
        set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, role } : u)) }))
        setFeedback(key, { type: 'success', message: `Role updated to ${role}` })
        autoClean(key)
        return true
      } catch (err) {
        setFeedback(key, { type: 'error', message: extractError(err) })
        return false
      } finally {
        setLoading(key, false)
      }
    },

    async updateModel(model) {
      setLoading('model-update', true)
      try {
        await patchData<ApiResponse<{ active: string }>, UpdateModelRequest>(ADMIN.model, { model })
        set((s) => ({
          modelInfo: s.modelInfo ? { ...s.modelInfo, active: model } : { active: model, available: [] },
        }))
        setFeedback('model-update', { type: 'success', message: `Model switched to ${model}` })
        autoClean('model-update')
        return true
      } catch (err) {
        setFeedback('model-update', { type: 'error', message: extractError(err) })
        return false
      } finally {
        setLoading('model-update', false)
      }
    },

    async softDeleteUser(userId) {
      const key = `delete-${userId}`
      setLoading(key, true)
      try {
        await deleteData<ApiResponse<null>>(ADMIN.userSoftDelete(userId))
        set((s) => ({ users: s.users.filter((u) => u.id !== userId), selectedUserId: null }))
        setFeedback('users', { type: 'success', message: 'User soft-deleted' })
        autoClean('users')
        return true
      } catch (err) {
        setFeedback(key, { type: 'error', message: extractError(err) })
        return false
      } finally {
        setLoading(key, false)
      }
    },

    async hardDeleteUser(userId) {
      const key = `hard-delete-${userId}`
      setLoading(key, true)
      try {
        await deleteData<ApiResponse<null>>(ADMIN.userHardDelete(userId))
        set((s) => ({ users: s.users.filter((u) => u.id !== userId), selectedUserId: null }))
        setFeedback('users', { type: 'success', message: 'User permanently deleted' })
        autoClean('users')
        return true
      } catch (err) {
        setFeedback(key, { type: 'error', message: extractError(err) })
        return false
      } finally {
        setLoading(key, false)
      }
    },

    async resendVerification(email) {
      const key = `resend-${email}`
      setLoading(key, true)
      try {
        await postData<ApiResponse<unknown>, { email: string }>(AUTH.resendOtp, { email })
        setFeedback(key, { type: 'success', message: 'Verification email sent' })
        autoClean(key)
        return true
      } catch (err) {
        setFeedback(key, { type: 'error', message: extractError(err) })
        return false
      } finally {
        setLoading(key, false)
      }
    },

    async bootstrap() {
      if (get().initialized) return
      set({ initialized: true })
      await Promise.all([
        get().fetchUsers(),
        get().fetchSessions(),
        get().fetchAnalyses(),
        get().fetchUsageSummary(),
        get().fetchModelInfo(),
      ])
    },
  }
})
