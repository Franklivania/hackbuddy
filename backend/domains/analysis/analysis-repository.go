package analysis

import (
	"hackbuddy-backend/db"
)

type Repository interface {
	CreateAnalysis(analysis *Analysis) error
	GetAnalysesBySession(sessionID string) ([]Analysis, error)
	GetLatestAnalysis(sessionID string) (*Analysis, error)
	FindAll() ([]Analysis, error) // for admin

	SetContext(sessionID string, key string, value string) error
	GetContext(sessionID string, key string) (string, error)
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) CreateAnalysis(analysis *Analysis) error {
	return db.DB.Create(analysis).Error
}

func (r *repository) GetAnalysesBySession(sessionID string) ([]Analysis, error) {
	var analyses []Analysis
	err := db.DB.Where("session_id = ?", sessionID).Find(&analyses).Error
	return analyses, err
}

func (r *repository) GetLatestAnalysis(sessionID string) (*Analysis, error) {
	var analysis Analysis
	err := db.DB.Where("session_id = ?", sessionID).Order("created_at desc").First(&analysis).Error
	return &analysis, err
}

func (r *repository) FindAll() ([]Analysis, error) {
	var analyses []Analysis
	err := db.DB.Find(&analyses).Error
	return analyses, err
}

func (r *repository) SetContext(sessionID string, key string, value string) error {
	// Upsert
	var ctx SessionContext
	result := db.DB.Where("session_id = ? AND key = ?", sessionID, key).First(&ctx)

	if result.Error == nil {
		// Update
		ctx.Value = value
		return db.DB.Save(&ctx).Error
	}

	// Create
	newCtx := SessionContext{
		SessionID: sessionID,
		Key:       key,
		Value:     value,
	}
	return db.DB.Create(&newCtx).Error
}

func (r *repository) GetContext(sessionID string, key string) (string, error) {
	var ctx SessionContext
	err := db.DB.Where("session_id = ? AND key = ?", sessionID, key).First(&ctx).Error
	if err != nil {
		return "", err
	}
	return ctx.Value, nil
}
