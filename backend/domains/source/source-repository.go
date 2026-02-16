package source

import (
	"hackbuddy-backend/db"
)

type Repository interface {
	CreateSource(source *Source) error
	FindSourcesBySession(sessionID string) ([]Source, error)
	FindSourceByID(id string) (*Source, error)
	UpdateSourceStatus(id string, status string) error

	CreateDocument(doc *SessionDocument) error
	CreateChunk(chunk *SessionChunk) error
	FindChunksBySession(sessionID string) ([]SessionChunk, error)
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) CreateSource(source *Source) error {
	return db.DB.Create(source).Error
}

func (r *repository) FindSourcesBySession(sessionID string) ([]Source, error) {
	var sources []Source
	err := db.DB.Where("session_id = ?", sessionID).Find(&sources).Error
	return sources, err
}

func (r *repository) FindSourceByID(id string) (*Source, error) {
	var source Source
	err := db.DB.First(&source, "id = ?", id).Error
	return &source, err
}

func (r *repository) UpdateSourceStatus(id string, status string) error {
	return db.DB.Model(&Source{}).Where("id = ?", id).Update("status", status).Error
}

func (r *repository) CreateDocument(doc *SessionDocument) error {
	return db.DB.Create(doc).Error
}

func (r *repository) CreateChunk(chunk *SessionChunk) error {
	return db.DB.Create(chunk).Error
}

func (r *repository) FindChunksBySession(sessionID string) ([]SessionChunk, error) {
	var chunks []SessionChunk
	err := db.DB.Where("session_id = ?", sessionID).Find(&chunks).Error
	return chunks, err
}
