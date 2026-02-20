package usage

import (
	"hackbuddy-backend/db"
)

type Repository interface {
	Create(u *TokenUsage) error
	FindAll(userID, sessionID *string) ([]TokenUsage, error)
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) Create(u *TokenUsage) error {
	return db.DB.Create(u).Error
}

// FindAll returns token usage rows; pass nil for userID/sessionID to skip that filter.
func (r *repository) FindAll(userID, sessionID *string) ([]TokenUsage, error) {
	q := db.DB.Model(&TokenUsage{})
	if userID != nil && *userID != "" {
		q = q.Where("user_id = ?", *userID)
	}
	if sessionID != nil && *sessionID != "" {
		q = q.Where("session_id = ?", *sessionID)
	}
	var out []TokenUsage
	err := q.Order("created_at desc").Find(&out).Error
	return out, err
}
