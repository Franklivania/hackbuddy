package auth

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	FullName     string         `gorm:"type:varchar(255)" json:"full_name"` // Set on manual register; OAuth may leave empty or set from provider
	PasswordHash string         `json:"-"`
	Role         string         `gorm:"default:'user'" json:"role"`        // user, admin
	Provider     string         `gorm:"default:'email'" json:"provider"`    // email, google, github
	ProviderID   string         `gorm:"index:idx_provider_uid" json:"-"`    // OAuth provider's user id (sub/id)
	Verified     bool           `gorm:"default:false" json:"verified"`      // OAuth users are auto-verified; email users need verify-email
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type EmailVerification struct {
	Email     string    `gorm:"primaryKey" json:"email"`
	Code      string    `gorm:"not null" json:"code"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
}

// RevokedToken stores JWT IDs (jti) that have been invalidated on logout.
type RevokedToken struct {
	TokenID   string    `gorm:"primaryKey;type:varchar(64)" json:"token_id"`
	ExpiresAt time.Time `gorm:"not null;index" json:"expires_at"`
}
