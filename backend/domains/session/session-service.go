package session

import (
	"errors"
)

type Service interface {
	CreateSession(userID string, name string) (*Session, error)
	UpdateSession(id string, userID string, name string) (*Session, error)
	GetSession(id string, userID string) (*Session, error)
	GetUserSessions(userID string) ([]Session, error)
	DeleteSession(id string, userID string) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) CreateSession(userID string, name string) (*Session, error) {
	session := &Session{
		UserID: userID,
		Name:   name,
	}
	if err := s.repo.Create(session); err != nil {
		return nil, err
	}
	return session, nil
}

func (s *service) UpdateSession(id string, userID string, name string) (*Session, error) {
	sess, err := s.repo.FindByID(id, userID)
	if err != nil {
		return nil, err
	}
	sess.Name = name
	if err := s.repo.Update(sess); err != nil {
		return nil, err
	}
	return sess, nil
}

func (s *service) GetSession(id string, userID string) (*Session, error) {
	return s.repo.FindByID(id, userID)
}

func (s *service) GetUserSessions(userID string) ([]Session, error) {
	return s.repo.FindAllByUser(userID)
}

func (s *service) DeleteSession(id string, userID string) error {
	// First check if it exists and belongs to user
	_, err := s.repo.FindByID(id, userID)
	if err != nil {
		return errors.New("session not found or access denied")
	}

	// Then delete
	return s.repo.Delete(id, userID)
}
