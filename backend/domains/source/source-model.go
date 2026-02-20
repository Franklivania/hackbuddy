package source

import (
	"time"

	"gorm.io/gorm"
)

type Source struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SessionID string         `gorm:"index;not null" json:"session_id"`
	URL       string         `gorm:"not null" json:"url"`
	Type      string         `gorm:"not null" json:"type"`            // winner (strategy links), subject (hackathon to compete in)
	Status    string         `gorm:"default:'pending'" json:"status"` // pending, scraped, processed, failed
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type SessionDocument struct {
	ID           string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SessionID    string    `gorm:"index;not null" json:"session_id"`
	SourceID     string    `gorm:"index;not null" json:"source_id"`
	ContentClean string    `gorm:"type:text" json:"content_clean"` // Normalized content
	CreatedAt    time.Time `json:"created_at"`
}

type SessionChunk struct {
	ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SessionID  string    `gorm:"index;not null" json:"session_id"`
	DocID      string    `gorm:"index;not null" json:"doc_id"`
	SourceType string    `gorm:"not null;default:'winner'" json:"source_type"` // "winner" or "subject"
	Content    string    `gorm:"type:text" json:"content"`
	Summary    string    `gorm:"type:text" json:"summary"` // Structured JSON extraction
	TokenCount int       `json:"token_count"`
	CreatedAt  time.Time `json:"created_at"`
}
