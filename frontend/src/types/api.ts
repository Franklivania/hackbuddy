/**
 * Generic API response wrapper and validation types.
 * All JSON responses from the backend use the ApiResponse shape.
 */

export type ApiStatus = 'success' | 'error'

export interface ApiResponse<T = unknown> {
  status: ApiStatus
  data: T | null
  message: string
  success: boolean
}

export interface ValidationErrorItem {
  field: string
  message: string
}
