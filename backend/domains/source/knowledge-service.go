package source

import (
	"fmt"
	"hackbuddy-backend/infrastructure/llm"
	"time"
	"unicode/utf8"
)

const maxContentChars = 24000

type KnowledgeService interface {
	ProcessDocument(doc *SessionDocument, sourceType string) error
}

type knowledgeService struct {
	repo      Repository
	llmClient llm.LLMClient
}

func NewKnowledgeService(repo Repository, llmClient llm.LLMClient) KnowledgeService {
	return &knowledgeService{
		repo:      repo,
		llmClient: llmClient,
	}
}

func (k *knowledgeService) ProcessDocument(doc *SessionDocument, sourceType string) error {
	content := truncateToRunes(doc.ContentClean, maxContentChars)

	var extraction string
	var err error

	switch sourceType {
	case TypeSubject:
		extraction, err = k.extractHackathonProfile(content)
	default:
		extraction, err = k.extractWinnerIntelligence(content)
	}
	if err != nil {
		return err
	}

	chunk := &SessionChunk{
		SessionID:  doc.SessionID,
		DocID:      doc.ID,
		SourceType: sourceType,
		Content:    content,
		Summary:    extraction,
		TokenCount: utf8.RuneCountInString(content) / 4,
		CreatedAt:  time.Now(),
	}
	return k.repo.CreateChunk(chunk)
}

func (k *knowledgeService) extractWinnerIntelligence(content string) (string, error) {
	system := `You extract structured intelligence from hackathon winning projects. Output ONLY valid JSON. No preamble, no markdown fences, no commentary.`

	prompt := fmt.Sprintf(`Analyze this hackathon winner content and extract structured intelligence.

Content:
%s

Return ONLY this JSON structure (fill every field, use "Unknown" for unavailable data):
{
  "hackathon_name": "",
  "project_name": "",
  "track_or_category": "",
  "tech_stack": [],
  "problem_solved": "",
  "winning_strategies": [],
  "demo_tactics": "",
  "differentiators": [],
  "reason_won": ""
}`, content)

	messages := []llm.Message{
		{Role: "system", Content: system},
		{Role: "user", Content: prompt},
	}

	out, _, err := k.llmClient.Chat(messages, true)
	return out, err
}

func (k *knowledgeService) extractHackathonProfile(content string) (string, error) {
	system := `You extract structured hackathon event profiles. Output ONLY valid JSON. No preamble, no markdown fences, no commentary.`

	prompt := fmt.Sprintf(`Analyze this hackathon event page and extract the event profile.

Content:
%s

Return ONLY this JSON structure (fill every field, use empty arrays/strings for unavailable data):
{
  "event_name": "",
  "dates": "",
  "duration": "",
  "tracks": [],
  "judging_criteria": [],
  "themes": [],
  "prizes": [],
  "sponsor_technologies": [],
  "constraints": [],
  "inferred_biases": [],
  "ecosystem_summary": ""
}`, content)

	messages := []llm.Message{
		{Role: "system", Content: system},
		{Role: "user", Content: prompt},
	}

	out, _, err := k.llmClient.Chat(messages, true)
	return out, err
}

func truncateToRunes(s string, maxRunes int) string {
	if maxRunes <= 0 {
		return s
	}
	r := []rune(s)
	if len(r) <= maxRunes {
		return s
	}
	return string(r[:maxRunes])
}
