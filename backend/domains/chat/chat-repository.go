package chat

import (
	"hackbuddy-backend/db"
)

type Repository interface {
	CreateMessage(msg *Message) error
	GetMessagesBySession(sessionID string) ([]Message, error)
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) CreateMessage(msg *Message) error {
	return db.DB.Create(msg).Error
}

func (r *repository) GetMessagesBySession(sessionID string) ([]Message, error) {
	var messages []Message
	// Limit history for "Retrieval Discipline" - e.g. last 50 messages
	err := db.DB.Where("session_id = ?", sessionID).Order("created_at asc").Limit(50).Find(&messages).Error
	return messages, err
}
