package auth

import (
	"errors"
	"hackbuddy-backend/config"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mocks
type MockRepository struct {
	mock.Mock
}

func (m *MockRepository) CreateUser(user *User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockRepository) FindByEmail(email string) (*User, error) {
	args := m.Called(email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*User), args.Error(1)
}

func (m *MockRepository) FindByProvider(provider, providerID string) (*User, error) {
	args := m.Called(provider, providerID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*User), args.Error(1)
}

func (m *MockRepository) FindByID(id string) (*User, error) {
	args := m.Called(id)
	return args.Get(0).(*User), args.Error(1)
}

func (m *MockRepository) UpdateUser(user *User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockRepository) StoreVerificationCode(email, code string) error {
	args := m.Called(email, code)
	return args.Error(0)
}

func (m *MockRepository) GetVerificationCode(email string) (string, error) {
	args := m.Called(email)
	return args.String(0), args.Error(1)
}

func (m *MockRepository) DeleteVerificationCode(email string) error {
	args := m.Called(email)
	return args.Error(0)
}

type MockMailer struct {
	mock.Mock
}

func (m *MockMailer) Send(to []string, subject string, body string) error {
	args := m.Called(to, subject, body)
	return args.Error(0)
}

func TestRegister(t *testing.T) {
	mockRepo := new(MockRepository)
	mockMailer := new(MockMailer)
	cfg := &config.Config{JWTSecret: "test"}
	service := NewService(mockRepo, mockMailer, cfg)

	input := RegisterInput{
		Email:    "test@example.com",
		FullName: "Test User",
		Password: "password",
	}

	// Expect FindByEmail to return error (user not found)
	mockRepo.On("FindByEmail", input.Email).Return(nil, errors.New("not found"))
	// Expect CreateUser
	mockRepo.On("CreateUser", mock.AnythingOfType("*auth.User")).Return(nil)
	// Expect StoreVerificationCode
	mockRepo.On("StoreVerificationCode", input.Email, mock.AnythingOfType("string")).Return(nil)
	// Expect Send email
	mockMailer.On("Send", []string{input.Email}, mock.Anything, mock.Anything).Return(nil)

	err := service.Register(input)
	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}
