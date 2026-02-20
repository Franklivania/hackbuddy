package analysis

import (
	"encoding/json"
	"errors"
	"fmt"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/domains/usage"
	"hackbuddy-backend/infrastructure/llm"
	"hackbuddy-backend/pkg/guardrails"
	"strings"
)

const CustomDirectivesKey = "custom_directives"

type AnalysisSummary struct {
	LatestAnalysis   *Analysis `json:"latest_analysis,omitempty"`
	DefaultDirective string    `json:"default_directive"`
	CustomDirectives []string  `json:"custom_directives,omitempty"`
}

type Service interface {
	AnalyzeSession(sessionID string, userID string, directives []string) (*Analysis, error)
	GetAnalyses(sessionID string) ([]Analysis, error)
	GetAnalysisSummary(sessionID string) (*AnalysisSummary, error)
}

type service struct {
	repo          Repository
	sourceRepo    source.Repository
	llmClient     llm.LLMClient
	usageRecorder *usage.Recorder
	modelResolver llm.ModelResolver
}

func NewService(repo Repository, sourceRepo source.Repository, llmClient llm.LLMClient, usageRecorder *usage.Recorder, modelResolver llm.ModelResolver) Service {
	return &service{
		repo:          repo,
		sourceRepo:    sourceRepo,
		llmClient:     llmClient,
		usageRecorder: usageRecorder,
		modelResolver: modelResolver,
	}
}

func (s *service) AnalyzeSession(sessionID string, userID string, directives []string) (*Analysis, error) {
	chunks, err := s.sourceRepo.FindChunksBySession(sessionID)
	if err != nil {
		return nil, err
	}
	if len(chunks) == 0 {
		return nil, fmt.Errorf("no content to analyze")
	}

	for _, d := range directives {
		if guardrails.IsBlocked(d) {
			return nil, errors.New(guardrails.BlockedResponse)
		}
	}

	if len(directives) > 0 {
		directivesJSON, _ := json.Marshal(directives)
		_ = s.repo.SetContext(sessionID, CustomDirectivesKey, string(directivesJSON))
	}

	var winnerSummaries, subjectSummaries []string
	for _, c := range chunks {
		if c.SourceType == "subject" {
			subjectSummaries = append(subjectSummaries, c.Summary)
		} else {
			winnerSummaries = append(winnerSummaries, c.Summary)
		}
	}

	// Step 1: Pattern recognition from winner intelligence
	patterns := ""
	if len(winnerSummaries) > 0 {
		patterns, err = s.recognizePatterns(winnerSummaries, userID, sessionID)
		if err != nil {
			return nil, err
		}
	}

	// Step 2: Strategic synthesis — hackathon profile + patterns + directives → full blueprint
	hackathonProfile := strings.Join(subjectSummaries, "\n")
	directivesBlock := ""
	if len(directives) > 0 {
		directivesBlock = strings.Join(directives, "; ")
	}

	result, err := s.strategicSynthesis(patterns, hackathonProfile, directivesBlock, userID, sessionID)
	if err != nil {
		return nil, err
	}

	analysis := &Analysis{
		SessionID:  sessionID,
		ResultJSON: result,
	}
	if err := s.repo.CreateAnalysis(analysis); err != nil {
		return nil, err
	}

	// Step 3: Generate default directive for the chat assistant
	s.generateDirective(sessionID, userID, result, directives)

	return analysis, nil
}

// recognizePatterns condenses winner profiles into recurring success patterns.
func (s *service) recognizePatterns(winnerSummaries []string, userID, sessionID string) (string, error) {
	winnersBlock := strings.Join(winnerSummaries, "\n---\n")

	messages := []llm.Message{
		{Role: "system", Content: "You are a hackathon pattern recognition engine. Analyze structured profiles of past winning projects and identify recurring success patterns. Output strictly valid JSON only. Stay within hackathon scope."},
		{Role: "user", Content: fmt.Sprintf(`Analyze these winning hackathon project profiles and identify recurring patterns that correlate with winning:

%s

Return ONLY valid JSON:
{
  "recurring_problem_types": [],
  "technical_depth_patterns": [],
  "innovation_framing_patterns": [],
  "demo_patterns": [],
  "winning_tech_stacks": [],
  "scope_patterns": [],
  "what_actually_wins": ""
}`, winnersBlock)},
	}

	result, use, err := s.llmClient.Chat(messages, true)
	if err != nil {
		return "", err
	}
	s.recordUsage(userID, sessionID, use)
	return result, nil
}

// strategicSynthesis combines patterns + hackathon context into a full tactical blueprint.
func (s *service) strategicSynthesis(patterns, hackathonProfile, directives, userID, sessionID string) (string, error) {
	patternsSection := "No winner pattern data available. Base recommendations on general hackathon best practices."
	if patterns != "" {
		patternsSection = patterns
	}

	hackathonSection := "No specific hackathon profile available. Produce general hackathon-winning recommendations."
	if hackathonProfile != "" {
		hackathonSection = hackathonProfile
	}

	directivesSection := ""
	if directives != "" {
		directivesSection = "\nUser directives to incorporate: " + directives + "\n"
	}

	prompt := fmt.Sprintf(`You are a hackathon strategy engine producing a tactical blueprint.

WINNER PATTERNS (what historically wins):
%s

TARGET HACKATHON PROFILE:
%s
%s
Produce a strictly structured JSON strategy blueprint. Every project recommendation must be tactical — targeting specific tracks, mapping to judging criteria, and including a concrete demo plan.

Return ONLY valid JSON:
{
  "hackathon_intelligence": {
    "event_details": {
      "name": "",
      "dates": "",
      "theme": "",
      "tracks": [],
      "judging_criteria": [],
      "prizes": [],
      "inferred_biases": []
    },
    "ecosystem_summary": ""
  },
  "past_winner_patterns": {
    "recurring_problem_types": [],
    "technical_depth_patterns": [],
    "innovation_framing_patterns": [],
    "demo_patterns": [],
    "what_actually_wins_here": ""
  },
  "systematic_execution_framework": {
    "strategic_positioning": "",
    "problem_narrowing_logic": "",
    "solution_architecture_direction": "",
    "differentiation_strategy": "",
    "demo_positioning_strategy": ""
  },
  "project_recommendations": [
    {
      "project_name": "",
      "target_track": "",
      "core_concept": "",
      "problem_statement": "",
      "impact": "",
      "focused_scope": "",
      "key_features": [],
      "what_is_intentionally_excluded": [],
      "technical_direction": "",
      "sponsor_tech_utilization": [],
      "judging_criteria_alignment": {},
      "demo_plan": "",
      "execution_timeline": "",
      "competitor_differentiation": "",
      "why_it_is_likely_to_win": ""
    }
  ],
  "ranking": {
    "most_likely_to_win": "",
    "second_best_option": "",
    "higher_risk_higher_upside": "",
    "ranking_rationale": ""
  },
  "risk_analysis": {
    "execution_risks": [],
    "misalignment_risks": [],
    "overengineering_traps": [],
    "demo_failure_risks": []
  },
  "final_recommendation": ""
}

Requirements:
- Provide at least 3 distinct project_recommendations.
- Each project must target a specific track (from the hackathon profile if available).
- judging_criteria_alignment must map each criterion to how the project scores against it.
- demo_plan must describe what to show judges in a 3-minute demo.
- execution_timeline must outline phases for the hackathon duration.
- All reasoning must trace back to the patterns and hackathon profile.
- Output strictly valid JSON only.`, patternsSection, hackathonSection, directivesSection)

	messages := []llm.Message{
		{Role: "system", Content: "You are a hackathon strategy engine. Output strict JSON. Do not include blocked topics (politics, religion, NSFW, violence, medical/legal/financial advice). Stay within hackathon-relevant intelligence only."},
		{Role: "user", Content: prompt},
	}

	result, use, err := s.llmClient.Chat(messages, true)
	if err != nil {
		return "", err
	}
	s.recordUsage(userID, sessionID, use)
	return result, nil
}

func (s *service) generateDirective(sessionID, userID, analysisJSON string, directives []string) {
	directivePrompt := "Based on the analysis, generate a simplified default directive for an AI assistant helping a user win this hackathon. Keep it under 50 words. Do not include any blocked topics. Stay within hackathon scope only."
	if len(directives) > 0 {
		directivePrompt += " Incorporate user focus: " + strings.Join(directives, "; ")
	}
	messages := []llm.Message{
		{Role: "system", Content: "You are a helpful assistant."},
		{Role: "user", Content: "Analysis Context: " + analysisJSON},
		{Role: "user", Content: directivePrompt},
	}

	directive, use, err := s.llmClient.Chat(messages, false)
	if err == nil {
		s.repo.SetContext(sessionID, "default_directive", directive)
		s.recordUsage(userID, sessionID, use)
	}
}

func (s *service) recordUsage(userID, sessionID string, use *llm.Usage) {
	if s.usageRecorder != nil && s.modelResolver != nil && use != nil {
		s.usageRecorder.Record(userID, sessionID, s.modelResolver.GetActiveModel(), use)
	}
}

func (s *service) GetAnalyses(sessionID string) ([]Analysis, error) {
	return s.repo.GetAnalysesBySession(sessionID)
}

func (s *service) GetAnalysisSummary(sessionID string) (*AnalysisSummary, error) {
	latest, _ := s.repo.GetLatestAnalysis(sessionID)
	defaultDir, _ := s.repo.GetContext(sessionID, "default_directive")
	rawCustom, _ := s.repo.GetContext(sessionID, CustomDirectivesKey)
	var customDirectives []string
	if rawCustom != "" {
		_ = json.Unmarshal([]byte(rawCustom), &customDirectives)
	}
	return &AnalysisSummary{
		LatestAnalysis:   latest,
		DefaultDirective: defaultDir,
		CustomDirectives: customDirectives,
	}, nil
}
