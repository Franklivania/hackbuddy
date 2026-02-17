package chat

import (
	"encoding/json"
	"errors"
	"fmt"
	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/infrastructure/llm"
	"hackbuddy-backend/pkg/guardrails"
	"strings"
)

type Service interface {
	SendMessage(sessionID string, content string) (*Message, error)
}

type service struct {
	repo         Repository
	sourceRepo   source.Repository
	analysisRepo analysis.Repository
	llmClient    llm.LLMClient
}

func NewService(repo Repository, sourceRepo source.Repository, analysisRepo analysis.Repository, llmClient llm.LLMClient) Service {
	return &service{
		repo:         repo,
		sourceRepo:   sourceRepo,
		analysisRepo: analysisRepo,
		llmClient:    llmClient,
	}
}

func (s *service) SendMessage(sessionID string, content string) (*Message, error) {
	// 1. Safety Guardrails
	if guardrails.IsBlocked(content) {
		return nil, errors.New(guardrails.BlockedResponse)
	}

	// 2. Retrieve Directive and optional custom directives
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

	// 3. Retrieve Hints/Chunks
	// In production: Vector search. Here: fetching recent chunks.
	chunks, _ := s.sourceRepo.FindChunksBySession(sessionID)
	var contextStr string
	for _, c := range chunks {
		contextStr += fmt.Sprintf("- %s\n", c.Summary)
		// Retrieval Discipline: Limit tokens (naive limiter here)
		if len(contextStr) > 4000 {
			break
		}
	}

	// 4. Retrieve History
	history, _ := s.repo.GetMessagesBySession(sessionID)

	// 5. Assembly
	systemPrompt := fmt.Sprintf(`%s

SESSION CONTEXT:
%s

GUARDRAIL INSTRUCTIONS (you MUST follow these):
%s
`, directive, contextStr, guardrails.SystemInstructions())

	messages := []llm.Message{
		{Role: "system", Content: systemPrompt},
	}

	// Add history
	for _, h := range history {
		messages = append(messages, llm.Message{Role: h.Role, Content: h.Content})
	}

	// Add new message
	messages = append(messages, llm.Message{Role: "user", Content: content})

	// 6. Execution
	respContent, err := s.llmClient.Chat(messages, false)
	if err != nil {
		return nil, err
	}

	// 7. Persist
	userMsg := &Message{SessionID: sessionID, Role: "user", Content: content}
	s.repo.CreateMessage(userMsg)

	aiMsg := &Message{SessionID: sessionID, Role: "assistant", Content: respContent}
	s.repo.CreateMessage(aiMsg)

	return aiMsg, nil
}
