package auth

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string         `json:"-"`
	Role         string         `gorm:"default:'user'" json:"role"`      // user, admin
	Provider     string         `gorm:"default:'email'" json:"provider"` // email, google, github
	Verified     bool           `gorm:"default:false" json:"verified"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type EmailVerification struct {
	Email     string    `gorm:"primaryKey" json:"email"`
	Code      string    `gorm:"not null" json:"code"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
}
