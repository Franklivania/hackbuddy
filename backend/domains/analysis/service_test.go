package analysis

import (
	"strings"

	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/infrastructure/llm"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func contains(s, sub string) bool { return strings.Contains(s, sub) }

// --- Mocks ---

type MockRepository struct {
	mock.Mock
}

func (m *MockRepository) CreateAnalysis(analysis *Analysis) error {
	args := m.Called(analysis)
	return args.Error(0)
}

func (m *MockRepository) GetAnalysesBySession(sessionID string) ([]Analysis, error) {
	args := m.Called(sessionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]Analysis), args.Error(1)
}

func (m *MockRepository) GetLatestAnalysis(sessionID string) (*Analysis, error) {
	args := m.Called(sessionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Analysis), args.Error(1)
}

func (m *MockRepository) SetContext(sessionID, key, value string) error {
	args := m.Called(sessionID, key, value)
	return args.Error(0)
}

func (m *MockRepository) GetContext(sessionID, key string) (string, error) {
	args := m.Called(sessionID, key)
	return args.String(0), args.Error(1)
}

func (m *MockRepository) FindAll() ([]Analysis, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]Analysis), args.Error(1)
}

func (m *MockRepository) UnscopedDeleteAllBySessionIDs(sessionIDs []string) error {
	args := m.Called(sessionIDs)
	return args.Error(0)
}

type MockSourceRepository struct {
	mock.Mock
}

func (m *MockSourceRepository) CreateSource(source *source.Source) error { return nil }
func (m *MockSourceRepository) FindSourcesBySession(sessionID string) ([]source.Source, error) {
	return nil, nil
}
func (m *MockSourceRepository) FindSourceByID(id string) (*source.Source, error) { return nil, nil }
func (m *MockSourceRepository) UpdateSourceStatus(id, status string) error       { return nil }
func (m *MockSourceRepository) CreateDocument(doc *source.SessionDocument) error  { return nil }
func (m *MockSourceRepository) CreateChunk(chunk *source.SessionChunk) error      { return nil }
func (m *MockSourceRepository) FindChunksBySession(sessionID string) ([]source.SessionChunk, error) {
	args := m.Called(sessionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]source.SessionChunk), args.Error(1)
}

func (m *MockSourceRepository) UnscopedDeleteAllBySessionIDs(sessionIDs []string) error {
	args := m.Called(sessionIDs)
	return args.Error(0)
}

type MockLLMClient struct {
	mock.Mock
}

func (m *MockLLMClient) Chat(messages []llm.Message, jsonMode bool) (string, *llm.Usage, error) {
	args := m.Called(messages, jsonMode)
	var u *llm.Usage
	if args.Get(1) != nil {
		u = args.Get(1).(*llm.Usage)
	}
	return args.String(0), u, args.Error(2)
}

// --- Tests ---

func TestAnalyzeSession(t *testing.T) {
	mockRepo := new(MockRepository)
	mockSourceRepo := new(MockSourceRepository)
	mockLLM := new(MockLLMClient)

	svc := NewService(mockRepo, mockSourceRepo, mockLLM, nil, nil)
	sessionID := "test-session"

	chunks := []source.SessionChunk{
		{
			Content:    "Winner project content",
			Summary:    `{"hackathon_name":"TestHack","project_name":"WinnerBot","winning_strategies":["rapid prototyping"],"reason_won":"Clean demo"}`,
			SourceType: "winner",
		},
	}
	mockSourceRepo.On("FindChunksBySession", sessionID).Return(chunks, nil)

	// Step 1: Pattern recognition (system contains "pattern recognition")
	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		return len(msgs) == 2 && msgs[0].Role == "system" &&
			contains(msgs[0].Content, "pattern recognition")
	}), true).Return(`{"what_actually_wins":"clean demos"}`, (*llm.Usage)(nil), nil)

	// Step 2: Strategic synthesis (system contains "strategy engine")
	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		return len(msgs) == 2 && msgs[0].Role == "system" &&
			contains(msgs[0].Content, "strategy engine")
	}), true).Return(`{"final_recommendation":"Build a focused MVP"}`, (*llm.Usage)(nil), nil)

	mockRepo.On("CreateAnalysis", mock.AnythingOfType("*analysis.Analysis")).Return(nil)

	// Step 3: Directive generation
	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		return len(msgs) == 3 && contains(msgs[2].Content, "default directive")
	}), false).Return("Focus on clean demos and rapid prototyping", (*llm.Usage)(nil), nil)

	mockRepo.On("SetContext", sessionID, "default_directive", "Focus on clean demos and rapid prototyping").Return(nil)

	result, err := svc.AnalyzeSession(sessionID, "user-1", nil)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Contains(t, result.ResultJSON, "final_recommendation")

	mockRepo.AssertExpectations(t)
	mockSourceRepo.AssertExpectations(t)
	mockLLM.AssertExpectations(t)
}

func TestAnalyzeSession_WithDirectives(t *testing.T) {
	mockRepo := new(MockRepository)
	mockSourceRepo := new(MockSourceRepository)
	mockLLM := new(MockLLMClient)

	svc := NewService(mockRepo, mockSourceRepo, mockLLM, nil, nil)
	sessionID := "test-session"
	directives := []string{"focus on devtools"}

	chunks := []source.SessionChunk{
		{
			Content:    "Winner project content",
			Summary:    `{"hackathon_name":"TestHack","project_name":"DevKit","winning_strategies":["tooling focus"],"reason_won":"Solved real pain"}`,
			SourceType: "winner",
		},
	}
	mockSourceRepo.On("FindChunksBySession", sessionID).Return(chunks, nil)

	mockRepo.On("SetContext", sessionID, CustomDirectivesKey, mock.MatchedBy(func(s string) bool {
		return len(s) > 0 && (s[0] == '[' || s[0] == '"')
	})).Return(nil)

	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		return len(msgs) == 2 && msgs[0].Role == "system" &&
			contains(msgs[0].Content, "pattern recognition")
	}), true).Return(`{"what_actually_wins":"developer tooling"}`, (*llm.Usage)(nil), nil)

	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		return len(msgs) == 2 && msgs[0].Role == "system" &&
			contains(msgs[0].Content, "strategy engine")
	}), true).Return(`{"final_recommendation":"Build dev tools"}`, (*llm.Usage)(nil), nil)

	mockRepo.On("CreateAnalysis", mock.AnythingOfType("*analysis.Analysis")).Return(nil)

	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		return len(msgs) == 3 && contains(msgs[2].Content, "default directive")
	}), false).Return("Help build developer tools", (*llm.Usage)(nil), nil)

	mockRepo.On("SetContext", sessionID, "default_directive", "Help build developer tools").Return(nil)

	result, err := svc.AnalyzeSession(sessionID, "user-1", directives)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	mockRepo.AssertExpectations(t)
	mockSourceRepo.AssertExpectations(t)
	mockLLM.AssertExpectations(t)
}

func TestAnalyzeSession_MixedSources(t *testing.T) {
	mockRepo := new(MockRepository)
	mockSourceRepo := new(MockSourceRepository)
	mockLLM := new(MockLLMClient)

	svc := NewService(mockRepo, mockSourceRepo, mockLLM, nil, nil)
	sessionID := "test-mixed"

	chunks := []source.SessionChunk{
		{
			Content:    "Winner content",
			Summary:    `{"hackathon_name":"ETHGlobal","project_name":"DeFiPro","winning_strategies":["rapid MVP"],"reason_won":"Working demo"}`,
			SourceType: "winner",
		},
		{
			Content:    "Hackathon event page",
			Summary:    `{"event_name":"ETHGlobal 2025","tracks":["DeFi","Infrastructure"],"judging_criteria":["Innovation","Impact"]}`,
			SourceType: "subject",
		},
	}
	mockSourceRepo.On("FindChunksBySession", sessionID).Return(chunks, nil)

	// Pattern recognition (winners only)
	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		return len(msgs) == 2 && contains(msgs[0].Content, "pattern recognition")
	}), true).Return(`{"what_actually_wins":"working demos with DeFi integrations"}`, (*llm.Usage)(nil), nil)

	// Strategic synthesis (receives both patterns and hackathon profile)
	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		return len(msgs) == 2 && contains(msgs[0].Content, "strategy engine") &&
			contains(msgs[1].Content, "ETHGlobal 2025")
	}), true).Return(`{"final_recommendation":"Target DeFi track with working MVP"}`, (*llm.Usage)(nil), nil)

	mockRepo.On("CreateAnalysis", mock.AnythingOfType("*analysis.Analysis")).Return(nil)

	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		return len(msgs) == 3 && contains(msgs[2].Content, "default directive")
	}), false).Return("Target DeFi track at ETHGlobal", (*llm.Usage)(nil), nil)

	mockRepo.On("SetContext", sessionID, "default_directive", "Target DeFi track at ETHGlobal").Return(nil)

	result, err := svc.AnalyzeSession(sessionID, "user-1", nil)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Contains(t, result.ResultJSON, "DeFi")

	mockRepo.AssertExpectations(t)
	mockSourceRepo.AssertExpectations(t)
	mockLLM.AssertExpectations(t)
}

func TestAnalyzeSession_SubjectOnly(t *testing.T) {
	mockRepo := new(MockRepository)
	mockSourceRepo := new(MockSourceRepository)
	mockLLM := new(MockLLMClient)

	svc := NewService(mockRepo, mockSourceRepo, mockLLM, nil, nil)
	sessionID := "test-subject-only"

	chunks := []source.SessionChunk{
		{
			Content:    "Hackathon event page",
			Summary:    `{"event_name":"HackMIT","tracks":["AI","Climate"],"judging_criteria":["Creativity","Feasibility"]}`,
			SourceType: "subject",
		},
	}
	mockSourceRepo.On("FindChunksBySession", sessionID).Return(chunks, nil)

	// No pattern recognition (no winners) — goes straight to synthesis
	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		return len(msgs) == 2 && contains(msgs[0].Content, "strategy engine") &&
			contains(msgs[1].Content, "No winner pattern data")
	}), true).Return(`{"final_recommendation":"Focus on AI track with climate angle"}`, (*llm.Usage)(nil), nil)

	mockRepo.On("CreateAnalysis", mock.AnythingOfType("*analysis.Analysis")).Return(nil)

	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		return len(msgs) == 3 && contains(msgs[2].Content, "default directive")
	}), false).Return("Focus on AI for climate impact", (*llm.Usage)(nil), nil)

	mockRepo.On("SetContext", sessionID, "default_directive", "Focus on AI for climate impact").Return(nil)

	result, err := svc.AnalyzeSession(sessionID, "user-1", nil)

	assert.NoError(t, err)
	assert.NotNil(t, result)

	mockRepo.AssertExpectations(t)
	mockSourceRepo.AssertExpectations(t)
	mockLLM.AssertExpectations(t)
}

func TestAnalyzeSession_NoChunks(t *testing.T) {
	mockRepo := new(MockRepository)
	mockSourceRepo := new(MockSourceRepository)
	mockLLM := new(MockLLMClient)

	svc := NewService(mockRepo, mockSourceRepo, mockLLM, nil, nil)
	mockSourceRepo.On("FindChunksBySession", "empty-session").Return([]source.SessionChunk{}, nil)

	result, err := svc.AnalyzeSession("empty-session", "user-1", nil)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "no content to analyze")
}
