package admin

import (
	"errors"

	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/auth"
	"hackbuddy-backend/domains/chat"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/domains/usage"
	"hackbuddy-backend/domains/user"
	"hackbuddy-backend/db"
	"hackbuddy-backend/infrastructure/llm"
	"gorm.io/gorm"
)

type Service interface {
	GetAllUsers() ([]auth.User, error)
	GetAllSessions() ([]session.Session, error)
	GetAllAnalyses() ([]analysis.Analysis, error)
	GetTokenUsage(userID, sessionID *string) ([]usage.TokenUsage, error)
	GetUsageSummary() ([]UsageSummaryRow, error)
	GetActiveModel() (string, error)
	SetActiveModel(model string) error
	GetAvailableModels() []string
	UpdateRole(userID string, role string) error
	SoftDeleteUser(userID string) error
	HardDeleteUser(userID string) error
}

// UsageSummaryRow is one row for admin usage summary (by user and model).
type UsageSummaryRow struct {
	UserID        string `json:"user_id"`
	SessionID     string `json:"session_id"`
	Model         string `json:"model"`
	TotalTokens   int    `json:"total_tokens"`
	RequestCount  int    `json:"request_count"`
}

type service struct {
	userRepo     user.Repository
	sessionRepo  session.Repository
	analysisRepo analysis.Repository
	chatRepo     chat.Repository
	sourceRepo   source.Repository
	usageRepo    usage.Repository
}

func NewService(userRepo user.Repository, sessionRepo session.Repository, analysisRepo analysis.Repository, chatRepo chat.Repository, sourceRepo source.Repository, usageRepo usage.Repository) Service {
	return &service{
		userRepo:     userRepo,
		sessionRepo:  sessionRepo,
		analysisRepo: analysisRepo,
		chatRepo:     chatRepo,
		sourceRepo:   sourceRepo,
		usageRepo:    usageRepo,
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

func (s *service) GetTokenUsage(userID, sessionID *string) ([]usage.TokenUsage, error) {
	return s.usageRepo.FindAll(userID, sessionID)
}

func (s *service) GetUsageSummary() ([]UsageSummaryRow, error) {
	all, err := s.usageRepo.FindAll(nil, nil)
	if err != nil {
		return nil, err
	}
	// Aggregate by user_id, session_id, model
	type key struct{ userID, sessionID, model string }
	m := make(map[key]UsageSummaryRow)
	for _, u := range all {
		k := key{u.UserID, u.SessionID, u.Model}
		r := m[k]
		r.UserID = u.UserID
		r.SessionID = u.SessionID
		r.Model = u.Model
		r.TotalTokens += u.TotalTokens
		r.RequestCount++
		m[k] = r
	}
	out := make([]UsageSummaryRow, 0, len(m))
	for _, r := range m {
		out = append(out, r)
	}
	return out, nil
}

func (s *service) GetActiveModel() (string, error) {
	v, err := db.GetSetting(llm.SettingKeyActiveModel)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", err
	}
	return v, nil
}

func (s *service) SetActiveModel(model string) error {
	return db.SetSetting(llm.SettingKeyActiveModel, model)
}

func (s *service) GetAvailableModels() []string {
	return llm.Models
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
