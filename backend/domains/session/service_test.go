package session

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockRepository struct {
	mock.Mock
}

func (m *MockRepository) Create(session *Session) error {
	args := m.Called(session)
	return args.Error(0)
}

func (m *MockRepository) FindByID(id string, userID string) (*Session, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Session), args.Error(1)
}

func (m *MockRepository) FindAllByUser(userID string) ([]Session, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]Session), args.Error(1)
}

func (m *MockRepository) FindAll() ([]Session, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]Session), args.Error(1)
}

func (m *MockRepository) Delete(id, userID string) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func (m *MockRepository) UnscopedDeleteAllByUserID(userID string) error {
	args := m.Called(userID)
	return args.Error(0)
}

func TestCreateSession(t *testing.T) {
	mockRepo := new(MockRepository)
	service := NewService(mockRepo)

	userID := "user-123"
	name := "Hackathon 1"

	mockRepo.On("Create", mock.MatchedBy(func(s *Session) bool {
		return s.UserID == userID && s.Name == name
	})).Return(nil)

	session, err := service.CreateSession(userID, name)

	assert.NoError(t, err)
	assert.Equal(t, userID, session.UserID)
	assert.Equal(t, name, session.Name)
	mockRepo.AssertExpectations(t)
}
