package auth

import (
	"errors"
	"hackbuddy-backend/config"
	"hackbuddy-backend/infrastructure/mailer"
	"hackbuddy-backend/pkg/security"
	"math/rand"
	"strconv"
	"time"
)

type Service interface {
	Register(input RegisterInput) error
	Login(input LoginInput) (string, error)
	VerifyEmail(email, code string) error
}

type service struct {
	repo   Repository
	mailer mailer.Mailer
	cfg    *config.Config
}

func NewService(repo Repository, mailer mailer.Mailer, cfg *config.Config) Service {
	return &service{repo: repo, mailer: mailer, cfg: cfg}
}

func (s *service) Register(input RegisterInput) error {
	// Check if user exists
	_, err := s.repo.FindByEmail(input.Email)
	if err == nil {
		return errors.New("email already in use")
	}

	hashedPassword, err := security.HashPassword(input.Password)
	if err != nil {
		return err
	}

	user := &User{
		Email:        input.Email,
		PasswordHash: hashedPassword,
		Role:         "user",
		Provider:     "email",
		Verified:     false,
	}

	if err := s.repo.CreateUser(user); err != nil {
		return err
	}

	// Generate verification code
	code := generateVerificationCode()
	if err := s.repo.StoreVerificationCode(user.Email, code); err != nil {
		return err
	}

	// Send email
	go s.mailer.Send([]string{user.Email}, "Verify your email", "Your code is: "+code)

	return nil
}

func (s *service) Login(input LoginInput) (string, error) {
	user, err := s.repo.FindByEmail(input.Email)
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	if !security.CheckPasswordHash(input.Password, user.PasswordHash) {
		return "", errors.New("invalid credentials")
	}

	if !user.Verified && user.Provider == "email" {
		return "", errors.New("email not verified")
	}

	token, err := security.GenerateToken(user.ID, user.Role, s.cfg.JWTSecret)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *service) VerifyEmail(email, code string) error {
	storedCode, err := s.repo.GetVerificationCode(email)
	if err != nil {
		return errors.New("verification code not found or expired")
	}

	if storedCode != code {
		return errors.New("invalid verification code")
	}

	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return err
	}

	user.Verified = true
	if err := s.repo.UpdateUser(user); err != nil {
		return err
	}

	s.repo.DeleteVerificationCode(email)
	return nil
}

func generateVerificationCode() string {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	code := rng.Intn(900000) + 100000
	return strconv.Itoa(code)
}

type RegisterInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type VerifyEmailInput struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required,len=6"`
}
