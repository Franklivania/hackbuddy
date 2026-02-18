/**
 * Health (no auth): readiness/liveness.
 */

export interface HealthResponse {
  status: 'ok'
}

export interface HealthDbResponse {
  status: 'ok' | 'error'
  message?: string
}
