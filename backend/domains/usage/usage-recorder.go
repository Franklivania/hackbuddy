package usage

import (
	"hackbuddy-backend/infrastructure/llm"
	"time"
)

// Recorder records token usage for admin tracking. Safe to call with nil usage.
type Recorder struct {
	repo Repository
}

func NewRecorder(repo Repository) *Recorder {
	return &Recorder{repo: repo}
}

// Record persists one LLM call usage. No-op if usage is nil.
func (r *Recorder) Record(userID, sessionID, model string, usage *llm.Usage) {
	if usage == nil || r.repo == nil {
		return
	}
	_ = r.repo.Create(&TokenUsage{
		UserID:           userID,
		SessionID:        sessionID,
		Model:            model,
		PromptTokens:     usage.PromptTokens,
		CompletionTokens: usage.CompletionTokens,
		TotalTokens:      usage.TotalTokens,
		CreatedAt:        time.Now(),
	})
}
