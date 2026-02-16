package analysis

import (
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/infrastructure/llm"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mocks
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

type MockSourceRepository struct {
	mock.Mock
}

func (m *MockSourceRepository) CreateSource(source *source.Source) error { return nil }
func (m *MockSourceRepository) FindSourcesBySession(sessionID string) ([]source.Source, error) {
	return nil, nil
}
func (m *MockSourceRepository) FindSourceByID(id string) (*source.Source, error) { return nil, nil }
func (m *MockSourceRepository) UpdateSourceStatus(id, status string) error       { return nil }
func (m *MockSourceRepository) CreateDocument(doc *source.SessionDocument) error { return nil }
func (m *MockSourceRepository) CreateChunk(chunk *source.SessionChunk) error     { return nil }
func (m *MockSourceRepository) FindChunksBySession(sessionID string) ([]source.SessionChunk, error) {
	args := m.Called(sessionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]source.SessionChunk), args.Error(1)
}

type MockLLMClient struct {
	mock.Mock
}

func (m *MockLLMClient) Chat(messages []llm.Message, jsonMode bool) (string, error) {
	args := m.Called(messages, jsonMode)
	return args.String(0), args.Error(1)
}

func TestAnalyzeSession(t *testing.T) {
	mockRepo := new(MockRepository)
	mockSourceRepo := new(MockSourceRepository)
	mockLLM := new(MockLLMClient)

	service := NewService(mockRepo, mockSourceRepo, mockLLM)
	sessionID := "test-session"

	chunks := []source.SessionChunk{
		{Content: "Chunk 1", Summary: "Summary 1"},
	}
	mockSourceRepo.On("FindChunksBySession", sessionID).Return(chunks, nil)

	// Analysis call
	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		// Strict check: Is this the analysis prompt?
		return len(msgs) == 2 && msgs[0].Content == "You are a strategic analyst. Output strict JSON."
	}), true).Return(`{"result": "success"}`, nil)

	mockRepo.On("CreateAnalysis", mock.AnythingOfType("*analysis.Analysis")).Return(nil)

	// Directive Generation call
	mockLLM.On("Chat", mock.MatchedBy(func(msgs []llm.Message) bool {
		// Strict check: Is this the directive prompt?
		return len(msgs) == 3 && msgs[2].Content == "Based on the analysis, generate a simplified default directive for an AI assistant helping a user win this hackathon. Keep it under 50 words."
	}), false).Return("Directive", nil)

	mockRepo.On("SetContext", sessionID, "default_directive", "Directive").Return(nil)

	result, err := service.AnalyzeSession(sessionID)

	assert.NoError(t, err)
	assert.NotNil(t, result)

	mockRepo.AssertExpectations(t)
	mockSourceRepo.AssertExpectations(t)
	mockLLM.AssertExpectations(t)
}
