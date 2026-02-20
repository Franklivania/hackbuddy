package usage

import (
	"time"
)

// TokenUsage records LLM token consumption per user/session for admin tracking.
type TokenUsage struct {
	ID               string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID           string    `gorm:"index;not null" json:"user_id"`
	SessionID        string    `gorm:"index;not null" json:"session_id"`
	Model            string    `gorm:"not null" json:"model"`
	PromptTokens     int       `json:"prompt_tokens"`
	CompletionTokens int      `json:"completion_tokens"`
	TotalTokens      int       `json:"total_tokens"`
	CreatedAt        time.Time `json:"created_at"`
}
