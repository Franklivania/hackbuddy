/**
 * Admin: update role, etc.
 */

export interface UpdateRoleRequest {
  role: 'user' | 'admin'
}

export interface UpdateRoleSuccessData {
  role: 'user' | 'admin'
}
