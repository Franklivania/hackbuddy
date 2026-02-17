package user

import (
	"hackbuddy-backend/domains/auth"
)

type Service interface {
	GetProfile(userID string) (*auth.User, error)
	GetByID(id string) (*auth.User, error)
	SoftDeleteMe(userID string) error
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

func (s *service) GetByID(id string) (*auth.User, error) {
	return s.repo.FindByID(id)
}

func (s *service) SoftDeleteMe(userID string) error {
	_, err := s.repo.FindByID(userID)
	if err != nil {
		return err
	}
	return s.repo.SoftDelete(userID)
}
