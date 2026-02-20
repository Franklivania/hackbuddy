package source

import (
	"errors"
	"fmt"
	"hackbuddy-backend/infrastructure/scraper"
	"hackbuddy-backend/pkg/logger"
	"html"
	"strings"
	"time"

	"go.uber.org/zap"
)

const (
	TypeWinner  = "winner"
	TypeSubject = "subject"

	maxConcurrentProcessing = 3
)

type Service interface {
	AddSourcesBatch(sessionID string, links []string, subjectLink string) ([]*Source, error)
	ProcessSource(sourceID string) error
	GetSessionSources(sessionID string) ([]Source, error)
	GetSessionChunks(sessionID string) ([]SessionChunk, error)
}

type service struct {
	repo        Repository
	scraper     scraper.Scraper
	knowService KnowledgeService
	sem         chan struct{}
}

func NewService(repo Repository, scraper scraper.Scraper, knowService KnowledgeService) Service {
	return &service{
		repo:        repo,
		scraper:     scraper,
		knowService: knowService,
		sem:         make(chan struct{}, maxConcurrentProcessing),
	}
}

func (s *service) AddSourcesBatch(sessionID string, links []string, subjectLink string) ([]*Source, error) {
	if len(links) == 0 && subjectLink == "" {
		return nil, nil
	}

	existing, err := s.repo.FindSourcesBySession(sessionID)
	if err != nil {
		return nil, fmt.Errorf("check existing sources: %w", err)
	}
	seen := make(map[string]bool, len(existing)+len(links)+1)
	for _, src := range existing {
		seen[src.URL] = true
	}

	var created []*Source
	for _, u := range links {
		if u == "" || seen[u] {
			continue
		}
		seen[u] = true
		src := &Source{
			SessionID: sessionID,
			URL:       u,
			Type:      TypeWinner,
			Status:    "pending",
		}
		if err := s.repo.CreateSource(src); err != nil {
			if errors.Is(err, ErrDuplicateSource) {
				continue
			}
			return created, err
		}
		created = append(created, src)
		go s.ProcessSource(src.ID)
	}
	if subjectLink != "" && !seen[subjectLink] {
		src := &Source{
			SessionID: sessionID,
			URL:       subjectLink,
			Type:      TypeSubject,
			Status:    "pending",
		}
		if err := s.repo.CreateSource(src); err != nil {
			if !errors.Is(err, ErrDuplicateSource) {
				return created, err
			}
		} else {
			created = append(created, src)
			go s.ProcessSource(src.ID)
		}
	}
	return created, nil
}

func (s *service) ProcessSource(sourceID string) error {
	s.sem <- struct{}{}
	defer func() { <-s.sem }()

	source, err := s.repo.FindSourceByID(sourceID)
	if err != nil {
		return err
	}

	s.repo.UpdateSourceStatus(sourceID, "scraping")

	content, err := s.scraper.Scrape(source.URL)
	if err != nil {
		logger.Log.Warn("ProcessSource: scrape failed", zap.String("source_id", sourceID), zap.String("url", source.URL), zap.Error(err))
		_ = s.repo.UpdateSourceStatus(sourceID, "failed")
		return err
	}

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

	s.repo.UpdateSourceStatus(sourceID, "processing")
	if err := s.knowService.ProcessDocument(doc, source.Type); err != nil {
		logger.Log.Warn("ProcessSource: knowledge process failed", zap.String("source_id", sourceID), zap.Error(err))
		_ = s.repo.UpdateSourceStatus(sourceID, "failed")
		return err
	}

	return s.repo.UpdateSourceStatus(sourceID, "completed")
}

func (s *service) GetSessionSources(sessionID string) ([]Source, error) {
	return s.repo.FindSourcesBySession(sessionID)
}

func (s *service) GetSessionChunks(sessionID string) ([]SessionChunk, error) {
	return s.repo.FindChunksBySession(sessionID)
}

// normalizeContent strips residual HTML tags, unescapes entities, and collapses whitespace.
func normalizeContent(raw string) string {
	var b strings.Builder
	b.Grow(len(raw))
	inTag, lastSpace := false, false
	for _, r := range raw {
		switch {
		case r == '<':
			inTag = true
		case r == '>':
			inTag = false
		case inTag:
			continue
		case r == ' ' || r == '\t' || r == '\n' || r == '\r':
			if !lastSpace {
				b.WriteByte(' ')
				lastSpace = true
			}
		default:
			b.WriteRune(r)
			lastSpace = false
		}
	}
	return strings.TrimSpace(html.UnescapeString(b.String()))
}
