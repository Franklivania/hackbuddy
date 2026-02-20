package chat

import (
	"encoding/json"
	"errors"
	"fmt"
	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/domains/usage"
	"hackbuddy-backend/infrastructure/llm"
	"hackbuddy-backend/pkg/guardrails"
	"strings"
)

const maxContextChars = 5000

type Service interface {
	SendMessage(sessionID string, userID string, content string) (*Message, error)
	GetHistory(sessionID string) ([]Message, error)
}

type service struct {
	repo          Repository
	sourceRepo    source.Repository
	analysisRepo  analysis.Repository
	llmClient     llm.LLMClient
	usageRecorder *usage.Recorder
	modelResolver llm.ModelResolver
}

func NewService(repo Repository, sourceRepo source.Repository, analysisRepo analysis.Repository, llmClient llm.LLMClient, usageRecorder *usage.Recorder, modelResolver llm.ModelResolver) Service {
	return &service{
		repo:          repo,
		sourceRepo:    sourceRepo,
		analysisRepo:  analysisRepo,
		llmClient:     llmClient,
		usageRecorder: usageRecorder,
		modelResolver: modelResolver,
	}
}

func (s *service) SendMessage(sessionID string, userID string, content string) (*Message, error) {
	if guardrails.IsBlocked(content) {
		return nil, errors.New(guardrails.BlockedResponse)
	}

	directive, _ := s.analysisRepo.GetContext(sessionID, "default_directive")
	if directive == "" {
		directive = "You are a helpful hackathon assistant."
	}
	var customDirectives []string
	if raw, _ := s.analysisRepo.GetContext(sessionID, analysis.CustomDirectivesKey); raw != "" {
		_ = json.Unmarshal([]byte(raw), &customDirectives)
	}
	if len(customDirectives) > 0 {
		directive += "\nUser directives: " + strings.Join(customDirectives, "; ")
	}

	contextStr := s.buildSessionContext(sessionID)

	history, _ := s.repo.GetMessagesBySession(sessionID)

	systemPrompt := fmt.Sprintf(`%s

SESSION CONTEXT:
%s

GUARDRAIL INSTRUCTIONS (you MUST follow these):
%s
`, directive, contextStr, guardrails.SystemInstructions())

	messages := []llm.Message{
		{Role: "system", Content: systemPrompt},
	}

	for _, h := range history {
		messages = append(messages, llm.Message{Role: h.Role, Content: h.Content})
	}

	messages = append(messages, llm.Message{Role: "user", Content: content})

	respContent, use, err := s.llmClient.Chat(messages, false)
	if err != nil {
		return nil, err
	}
	if s.usageRecorder != nil && s.modelResolver != nil && use != nil {
		s.usageRecorder.Record(userID, sessionID, s.modelResolver.GetActiveModel(), use)
	}

	userMsg := &Message{SessionID: sessionID, Role: "user", Content: content}
	s.repo.CreateMessage(userMsg)

	aiMsg := &Message{SessionID: sessionID, Role: "assistant", Content: respContent}
	s.repo.CreateMessage(aiMsg)

	return aiMsg, nil
}

func (s *service) GetHistory(sessionID string) ([]Message, error) {
	return s.repo.GetMessagesBySession(sessionID)
}

// buildSessionContext separates subject and winner chunks, prioritizing the
// hackathon profile so the assistant always knows the target event.
func (s *service) buildSessionContext(sessionID string) string {
	chunks, _ := s.sourceRepo.FindChunksBySession(sessionID)
	if len(chunks) == 0 {
		return "No session context available yet."
	}

	var b strings.Builder

	var subjectChunks, winnerChunks []source.SessionChunk
	for _, c := range chunks {
		if c.SourceType == "subject" {
			subjectChunks = append(subjectChunks, c)
		} else {
			winnerChunks = append(winnerChunks, c)
		}
	}

	if len(subjectChunks) > 0 {
		b.WriteString("TARGET HACKATHON:\n")
		for _, c := range subjectChunks {
			b.WriteString(c.Summary)
			b.WriteByte('\n')
		}
	}

	if len(winnerChunks) > 0 {
		b.WriteString("\nWINNER INTELLIGENCE:\n")
		for _, c := range winnerChunks {
			b.WriteString("- ")
			b.WriteString(c.Summary)
			b.WriteByte('\n')
			if b.Len() > maxContextChars {
				break
			}
		}
	}

	return b.String()
}
