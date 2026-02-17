package source

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockRepository struct {
	mock.Mock
}

func (m *MockRepository) CreateSource(source *Source) error {
	args := m.Called(source)
	return args.Error(0)
}

func (m *MockRepository) FindSourcesBySession(sessionID string) ([]Source, error) {
	args := m.Called(sessionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]Source), args.Error(1)
}

func (m *MockRepository) FindSourceByID(id string) (*Source, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Source), args.Error(1)
}

func (m *MockRepository) UpdateSourceStatus(id, status string) error {
	args := m.Called(id, status)
	return args.Error(0)
}

func (m *MockRepository) CreateDocument(doc *SessionDocument) error {
	args := m.Called(doc)
	return args.Error(0)
}

func (m *MockRepository) CreateChunk(chunk *SessionChunk) error {
	args := m.Called(chunk)
	return args.Error(0)
}

func (m *MockRepository) FindChunksBySession(sessionID string) ([]SessionChunk, error) {
	args := m.Called(sessionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]SessionChunk), args.Error(1)
}

func (m *MockRepository) UnscopedDeleteAllBySessionIDs(sessionIDs []string) error {
	args := m.Called(sessionIDs)
	return args.Error(0)
}

type mockScraper struct{}

func (mockScraper) Scrape(url string) (string, error) { return "", nil }

type mockKnowledgeService struct{}

func (mockKnowledgeService) ProcessDocument(doc *SessionDocument) error { return nil }

func TestAddSourcesBatch_EmptyReturnsNil(t *testing.T) {
	mockRepo := new(MockRepository)
	svc := NewService(mockRepo, mockScraper{}, mockKnowledgeService{})

	out, err := svc.AddSourcesBatch("s1", nil, "")
	assert.NoError(t, err)
	assert.Nil(t, out)

	out, err = svc.AddSourcesBatch("s1", []string{}, "")
	assert.NoError(t, err)
	assert.Nil(t, out)
}

func TestAddSourcesBatch_LinksAndSubject(t *testing.T) {
	mockRepo := new(MockRepository)
	svc := NewService(mockRepo, mockScraper{}, mockKnowledgeService{})

	mockRepo.On("CreateSource", mock.MatchedBy(func(s *Source) bool {
		return s.SessionID == "s1" && s.URL == "https://example.com/w1" && s.Type == TypeWinner && s.Status == "pending"
	})).Return(nil).Once()
	mockRepo.On("CreateSource", mock.MatchedBy(func(s *Source) bool {
		return s.SessionID == "s1" && s.URL == "https://example.com/subject" && s.Type == TypeSubject && s.Status == "pending"
	})).Return(nil).Once()
	// Async ProcessSource may call these
	mockRepo.On("FindSourceByID", mock.Anything).Return(&Source{ID: "id", URL: "https://example.com"}, nil).Maybe()
	mockRepo.On("UpdateSourceStatus", mock.Anything, mock.Anything).Return(nil).Maybe()
	mockRepo.On("CreateDocument", mock.Anything).Return(nil).Maybe()

	out, err := svc.AddSourcesBatch("s1", []string{"https://example.com/w1"}, "https://example.com/subject")
	assert.NoError(t, err)
	assert.Len(t, out, 2)
	mockRepo.AssertNumberOfCalls(t, "CreateSource", 2)
}
