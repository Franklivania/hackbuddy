package admin

import (
	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/auth"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/domains/user"
)

type Service interface {
	GetAllUsers() ([]auth.User, error)
	GetAllSessions() ([]session.Session, error)   // Note: This needs a method in session repo to get ALL, not just by user
	GetAllAnalyses() ([]analysis.Analysis, error) // Similarly for analysis
}

type service struct {
	userRepo     user.Repository
	sessionRepo  session.Repository
	analysisRepo analysis.Repository
}

func NewService(userRepo user.Repository, sessionRepo session.Repository, analysisRepo analysis.Repository) Service {
	return &service{userRepo: userRepo, sessionRepo: sessionRepo, analysisRepo: analysisRepo}
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
