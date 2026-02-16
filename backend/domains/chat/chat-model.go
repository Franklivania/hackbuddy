package chat

import (
	"time"

	"gorm.io/gorm"
)

type Message struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SessionID string         `gorm:"index;not null" json:"session_id"`
	Role      string         `gorm:"not null" json:"role"` // system, user, assistant
	Content   string         `gorm:"type:text" json:"content"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
