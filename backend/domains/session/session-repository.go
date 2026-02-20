package session

import (
	"hackbuddy-backend/db"

	"gorm.io/gorm"
)

type Repository interface {
	Create(session *Session) error
	Update(session *Session) error
	FindByID(id string, userID string) (*Session, error)
	FindAllByUser(userID string) ([]Session, error)
	FindAll() ([]Session, error) // for admin
	Delete(id string, userID string) error
	UnscopedDeleteAllByUserID(userID string) error
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) Create(session *Session) error {
	return db.DB.Create(session).Error
}

func (r *repository) Update(session *Session) error {
	return db.DB.Save(session).Error
}

func (r *repository) FindByID(id string, userID string) (*Session, error) {
	var session Session
	// Strict isolation: Must match both ID and UserID
	err := db.DB.Where("id = ? AND user_id = ?", id, userID).First(&session).Error
	return &session, err
}

func (r *repository) FindAllByUser(userID string) ([]Session, error) {
	var sessions []Session
	err := db.DB.Where("user_id = ?", userID).Find(&sessions).Error
	return sessions, err
}

func (r *repository) FindAll() ([]Session, error) {
	var sessions []Session
	err := db.DB.Find(&sessions).Error
	return sessions, err
}

func (r *repository) Delete(id string, userID string) error {
	// Strict isolation: Must match both ID and UserID to delete
	result := db.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&Session{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *repository) UnscopedDeleteAllByUserID(userID string) error {
	return db.DB.Unscoped().Where("user_id = ?", userID).Delete(&Session{}).Error
}
