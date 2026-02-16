package analysis

import (
	"fmt"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/infrastructure/llm"
)

type Service interface {
	AnalyzeSession(sessionID string) (*Analysis, error)
	GetAnalyses(sessionID string) ([]Analysis, error)
}

type service struct {
	repo       Repository
	sourceRepo source.Repository
	llmClient  llm.LLMClient
}

func NewService(repo Repository, sourceRepo source.Repository, llmClient llm.LLMClient) Service {
	return &service{
		repo:       repo,
		sourceRepo: sourceRepo,
		llmClient:  llmClient,
	}
}

func (s *service) AnalyzeSession(sessionID string) (*Analysis, error) {
	// 1. Fetch chunks/summaries
	chunks, err := s.sourceRepo.FindChunksBySession(sessionID)
	if err != nil {
		return nil, err
	}

	if len(chunks) == 0 {
		return nil, fmt.Errorf("no content to analyze")
	}

	// 2. Aggregate summaries (or robustly select them)
	var aggregatedSummaries string
	for _, chunk := range chunks {
		aggregatedSummaries += chunk.Summary + "\n"
	}

	// 3. Construct Reasoning Prompt
	prompt := fmt.Sprintf(`
Analyze the following hackathon materials and extract structured intelligence.
Focus on:
- Event Details (Dates, Theme, Prizes)
- Past Winners (Patterns, Tech Stack)
- Strategic Recommendations

Materials:
%s

Output MUST be valid JSON.
`, aggregatedSummaries)

	// 4. Call LLM
	messages := []llm.Message{
		{Role: "system", Content: "You are a strategic analyst. Output strict JSON."},
		{Role: "user", Content: prompt},
	}

	result, err := s.llmClient.Chat(messages, true) // Force JSON mode
	if err != nil {
		return nil, err
	}

	// 5. Store Analysis
	analysis := &Analysis{
		SessionID:  sessionID,
		ResultJSON: result,
	}

	if err := s.repo.CreateAnalysis(analysis); err != nil {
		return nil, err
	}

	// 6. Generate Default Directive (Locked)
	directivePrompt := "Based on the analysis, generate a simplified default directive for an AI assistant helping a user win this hackathon. Keep it under 50 words."
	directiveMsgs := []llm.Message{
		{Role: "system", Content: "You are a helpful assistant."},
		{Role: "user", Content: "Analysis Context: " + result},
		{Role: "user", Content: directivePrompt},
	}

	directive, err := s.llmClient.Chat(directiveMsgs, false)
	if err == nil {
		s.repo.SetContext(sessionID, "default_directive", directive)
	}

	return analysis, nil
}

func (s *service) GetAnalyses(sessionID string) ([]Analysis, error) {
	return s.repo.GetAnalysesBySession(sessionID)
}
