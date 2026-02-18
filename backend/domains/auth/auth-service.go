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
	Logout(tokenID string, expiresAt time.Time) error
	VerifyEmail(email, code string) error
	ResendVerification(email string) error
	GoogleCallback(code string) (string, error)
	GithubCallback(code string) (string, error)
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
		FullName:     input.FullName,
		PasswordHash: hashedPassword,
		Role:         "user",
		Provider:     "email",
		Verified:     false, // manual signup: must verify email before login
	}

	if err := s.repo.CreateUser(user); err != nil {
		return err
	}

	// Generate verification code
	code := generateVerificationCode()
	if err := s.repo.StoreVerificationCode(user.Email, code); err != nil {
		return err
	}

	go s.mailer.SendOTPVerification(user.Email, code)

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

func (s *service) Logout(tokenID string, expiresAt time.Time) error {
	return s.repo.AddRevokedToken(tokenID, expiresAt)
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

// ResendVerification generates and sends a new verification code for a given email.
// It only applies to manual email-provider users that are not yet verified.
func (s *service) ResendVerification(email string) error {
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return errors.New("user not found")
	}

	if user.Verified || user.Provider != "email" {
		return errors.New("email already verified or not eligible for resend")
	}

	code := generateVerificationCode()
	if err := s.repo.StoreVerificationCode(user.Email, code); err != nil {
		return err
	}

	go s.mailer.SendOTPVerification(user.Email, code)
	return nil
}

func (s *service) GoogleCallback(code string) (string, error) {
	if s.cfg.GoogleClientID == "" || s.cfg.GoogleClientSecret == "" {
		return "", errors.New("Google OAuth not configured")
	}
	profile, err := ExchangeGoogleCode(s.cfg, code)
	if err != nil {
		return "", err
	}
	return s.oauthLogin(profile)
}

func (s *service) GithubCallback(code string) (string, error) {
	if s.cfg.GithubClientID == "" || s.cfg.GithubClientSecret == "" {
		return "", errors.New("GitHub OAuth not configured")
	}
	profile, err := ExchangeGithubCode(s.cfg, code)
	if err != nil {
		return "", err
	}
	return s.oauthLogin(profile)
}

// oauthLogin finds or creates a user from OAuth profile and returns a JWT.
func (s *service) oauthLogin(profile *OAuthProfile) (string, error) {
	user, err := s.repo.FindByProvider(profile.Provider, profile.ProviderID)
	if err == nil {
		token, err := security.GenerateToken(user.ID, user.Role, s.cfg.JWTSecret)
		return token, err
	}
	// Not found by provider+id; try by email (account linking)
	user, err = s.repo.FindByEmail(profile.Email)
	if err == nil {
		user.Provider = profile.Provider
		user.ProviderID = profile.ProviderID
		user.Verified = true
		if profile.Name != "" && user.FullName == "" {
			user.FullName = profile.Name
		}
		if err := s.repo.UpdateUser(user); err != nil {
			return "", err
		}
		token, err := security.GenerateToken(user.ID, user.Role, s.cfg.JWTSecret)
		return token, err
	}
	// New user: OAuth users are treated as verified (provider already attested the email)
	user = &User{
		Email:      profile.Email,
		FullName:   profile.Name,
		Provider:   profile.Provider,
		ProviderID: profile.ProviderID,
		Role:       "user",
		Verified:   true,
	}
	if err := s.repo.CreateUser(user); err != nil {
		return "", err
	}
	return security.GenerateToken(user.ID, user.Role, s.cfg.JWTSecret)
}

func generateVerificationCode() string {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	code := rng.Intn(900000) + 100000
	return strconv.Itoa(code)
}

type RegisterInput struct {
	Email    string `json:"email" binding:"required,email"`
	FullName string `json:"full_name" binding:"required"`
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
