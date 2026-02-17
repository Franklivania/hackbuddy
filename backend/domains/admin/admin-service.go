package admin

import (
	"errors"

	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/auth"
	"hackbuddy-backend/domains/chat"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/domains/user"
)

type Service interface {
	GetAllUsers() ([]auth.User, error)
	GetAllSessions() ([]session.Session, error)
	GetAllAnalyses() ([]analysis.Analysis, error)
	UpdateRole(userID string, role string) error
	SoftDeleteUser(userID string) error
	HardDeleteUser(userID string) error
}

type service struct {
	userRepo     user.Repository
	sessionRepo  session.Repository
	analysisRepo analysis.Repository
	chatRepo     chat.Repository
	sourceRepo   source.Repository
}

func NewService(userRepo user.Repository, sessionRepo session.Repository, analysisRepo analysis.Repository, chatRepo chat.Repository, sourceRepo source.Repository) Service {
	return &service{
		userRepo:     userRepo,
		sessionRepo:  sessionRepo,
		analysisRepo: analysisRepo,
		chatRepo:     chatRepo,
		sourceRepo:   sourceRepo,
	}
}

func (s *service) GetAllUsers() ([]auth.User, error) {
	return s.userRepo.FindAll()
}

func (s *service) GetAllSessions() ([]session.Session, error) {
	return s.sessionRepo.FindAll()
}

func (s *service) GetAllAnalyses() ([]analysis.Analysis, error) {
	return s.analysisRepo.FindAll()
}

func (s *service) UpdateRole(userID string, role string) error {
	if role != "user" && role != "admin" {
		return errors.New("role must be user or admin")
	}
	u, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	u.Role = role
	return s.userRepo.UpdateUser(u)
}

func (s *service) SoftDeleteUser(userID string) error {
	_, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	return s.userRepo.SoftDelete(userID)
}

func (s *service) HardDeleteUser(userID string) error {
	_, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	sessions, err := s.sessionRepo.FindAllByUser(userID)
	if err != nil {
		return err
	}
	sessionIDs := make([]string, 0, len(sessions))
	for _, sess := range sessions {
		sessionIDs = append(sessionIDs, sess.ID)
	}
	if err := s.analysisRepo.UnscopedDeleteAllBySessionIDs(sessionIDs); err != nil {
		return err
	}
	if err := s.chatRepo.UnscopedDeleteAllBySessionIDs(sessionIDs); err != nil {
		return err
	}
	if err := s.sourceRepo.UnscopedDeleteAllBySessionIDs(sessionIDs); err != nil {
		return err
	}
	if err := s.sessionRepo.UnscopedDeleteAllByUserID(userID); err != nil {
		return err
	}
	return s.userRepo.UnscopedDelete(userID)
}
