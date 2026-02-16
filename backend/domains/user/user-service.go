package user

import (
	"hackbuddy-backend/domains/auth"
)

type Service interface {
	GetProfile(userID string) (*auth.User, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetProfile(userID string) (*auth.User, error) {
	return s.repo.FindByID(userID)
}
