package analysis

import (
	"time"

	"gorm.io/gorm"
)

type Analysis struct {
	ID             string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SessionID      string         `gorm:"index;not null" json:"session_id"`
	ResultJSON     string         `gorm:"type:jsonb" json:"result_json"` // Structured output from LLM
	Recommendation string         `gorm:"type:text" json:"recommendation"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

type SessionContext struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SessionID string    `gorm:"index;not null" json:"session_id"`
	Key       string    `gorm:"not null" json:"key"` // e.g., "default_directive"
	Value     string    `gorm:"type:text" json:"value"`
	CreatedAt time.Time `json:"created_at"`
}
