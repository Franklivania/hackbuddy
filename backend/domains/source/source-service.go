package source

import (
	"hackbuddy-backend/infrastructure/scraper"
	"hackbuddy-backend/pkg/logger"
	"strings"
	"time"

	"go.uber.org/zap"
)

const (
	TypeWinner  = "winner"
	TypeSubject = "subject"
)

type Service interface {
	AddSourcesBatch(sessionID string, links []string, subjectLink string) ([]*Source, error)
	ProcessSource(sourceID string) error
	GetSessionSources(sessionID string) ([]Source, error)
}

type service struct {
	repo        Repository
	scraper     scraper.Scraper
	knowService KnowledgeService
}

func NewService(repo Repository, scraper scraper.Scraper, knowService KnowledgeService) Service {
	return &service{
		repo:        repo,
		scraper:     scraper,
		knowService: knowService,
	}
}

func (s *service) AddSourcesBatch(sessionID string, links []string, subjectLink string) ([]*Source, error) {
	if len(links) == 0 && subjectLink == "" {
		return nil, nil
	}
	var created []*Source
	for _, u := range links {
		if u == "" {
			continue
		}
		src := &Source{
			SessionID: sessionID,
			URL:       u,
			Type:      TypeWinner,
			Status:    "pending",
		}
		if err := s.repo.CreateSource(src); err != nil {
			return created, err
		}
		created = append(created, src)
		go s.ProcessSource(src.ID)
	}
	if subjectLink != "" {
		src := &Source{
			SessionID: sessionID,
			URL:       subjectLink,
			Type:      TypeSubject,
			Status:    "pending",
		}
		if err := s.repo.CreateSource(src); err != nil {
			return created, err
		}
		created = append(created, src)
		go s.ProcessSource(src.ID)
	}
	return created, nil
}

func (s *service) ProcessSource(sourceID string) error {
	source, err := s.repo.FindSourceByID(sourceID)
	if err != nil {
		return err
	}

	s.repo.UpdateSourceStatus(sourceID, "scraping")

	// 1. Scrape
	content, err := s.scraper.Scrape(source.URL)
	if err != nil {
		logger.Log.Warn("ProcessSource: scrape failed", zap.String("source_id", sourceID), zap.String("url", source.URL), zap.Error(err))
		_ = s.repo.UpdateSourceStatus(sourceID, "failed")
		return err
	}

	// 2. Normalize (Simple stripping for now, could be more robust)
	cleanContent := normalizeContent(content)

	doc := &SessionDocument{
		SessionID:    source.SessionID,
		SourceID:     source.ID,
		ContentClean: cleanContent,
		CreatedAt:    time.Now(),
	}

	if err := s.repo.CreateDocument(doc); err != nil {
		logger.Log.Warn("ProcessSource: create document failed", zap.String("source_id", sourceID), zap.Error(err))
		_ = s.repo.UpdateSourceStatus(sourceID, "failed")
		return err
	}

	// 3. Handover to Knowledge Service for Chunking & Indexing
	s.repo.UpdateSourceStatus(sourceID, "processing")
	if err := s.knowService.ProcessDocument(doc); err != nil {
		logger.Log.Warn("ProcessSource: knowledge process failed", zap.String("source_id", sourceID), zap.Error(err))
		_ = s.repo.UpdateSourceStatus(sourceID, "failed")
		return err
	}

	return s.repo.UpdateSourceStatus(sourceID, "completed")
}

func (s *service) GetSessionSources(sessionID string) ([]Source, error) {
	return s.repo.FindSourcesBySession(sessionID)
}

func normalizeContent(htmlContent string) string {
	// In a real implementation this would use a library to strip HTML tags
	// For now, we assume the scraper returns mostly text or we do a basic pass
	// This is a placeholder for "Clean and normalize"
	return strings.TrimSpace(htmlContent)
}
