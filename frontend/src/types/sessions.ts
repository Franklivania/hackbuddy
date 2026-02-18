/**
 * Sessions: create, list, get, delete.
 */

export interface CreateSessionInput {
  name: string
}

export interface Session {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}
