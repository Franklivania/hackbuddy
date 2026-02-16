package chat

import (
	"errors"
	"fmt"
	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/infrastructure/llm"
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
	// 1. Safety Guardrails (Regex/Keyword Check)
	if isUnsafe(content) {
		return nil, errors.New("This request is outside the permitted scope of this session.")
	}

	// 2. Retrieve Directive
	directive, _ := s.analysisRepo.GetContext(sessionID, "default_directive")
	if directive == "" {
		// Fallback or error? Logic says "Can only be augmented", implies it must exist?
		// If analysis hasn't run, maybe basic fallback.
		directive = "You are a helpful hackathon assistant."
	}

	// 3. Retrieve Hints/Chunks (Simple implementation: get all or recent chunks)
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
	systemPrompt := fmt.Sprintf(`
%s

SESSION CONTEXT:
%s

Refuse to answer if the request involves political persuasion, sexual content, violence, hate speech, or criminal instruction.
`, directive, contextStr)

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

func isUnsafe(content string) bool {
	lower := strings.ToLower(content)
	forbidden := []string{"kill", "murder", "bomb", "hate", "terror", "porn", "nude", "sex"}
	for _, word := range forbidden {
		if strings.Contains(lower, word) {
			return true
		}
	}
	return false
}
