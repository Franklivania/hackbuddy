/**
 * Chat (per-session): send message, message types.
 */

export interface ChatInput {
  message: string
}

export type MessageRole = 'system' | 'user' | 'assistant'

export interface Message {
  id: string
  session_id: string
  role: MessageRole
  content: string
  created_at: string
}
