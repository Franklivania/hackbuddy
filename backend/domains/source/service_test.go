package source

import (
	"fmt"
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

func (mockKnowledgeService) ProcessDocument(doc *SessionDocument, sourceType string) error {
	return nil
}

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

	mockRepo.On("FindSourcesBySession", "s1").Return([]Source{}, nil)
	mockRepo.On("CreateSource", mock.MatchedBy(func(s *Source) bool {
		return s.URL == "https://example.com/w1" && s.Type == TypeWinner
	})).Return(nil).Once()
	mockRepo.On("CreateSource", mock.MatchedBy(func(s *Source) bool {
		return s.URL == "https://example.com/subject" && s.Type == TypeSubject
	})).Return(nil).Once()
	mockRepo.On("FindSourceByID", mock.Anything).Return(&Source{ID: "id", URL: "https://example.com"}, nil).Maybe()
	mockRepo.On("UpdateSourceStatus", mock.Anything, mock.Anything).Return(nil).Maybe()
	mockRepo.On("CreateDocument", mock.Anything).Return(nil).Maybe()

	out, err := svc.AddSourcesBatch("s1", []string{"https://example.com/w1"}, "https://example.com/subject")
	assert.NoError(t, err)
	assert.Len(t, out, 2)
	mockRepo.AssertNumberOfCalls(t, "CreateSource", 2)
}

func TestAddSourcesBatch_SkipsDuplicateURLs(t *testing.T) {
	mockRepo := new(MockRepository)
	svc := NewService(mockRepo, mockScraper{}, mockKnowledgeService{})

	mockRepo.On("FindSourcesBySession", "s1").Return([]Source{
		{URL: "https://example.com/existing", Type: TypeWinner},
	}, nil)
	mockRepo.On("CreateSource", mock.MatchedBy(func(s *Source) bool {
		return s.URL == "https://example.com/new"
	})).Return(nil).Once()
	mockRepo.On("FindSourceByID", mock.Anything).Return(&Source{ID: "id", URL: "https://example.com/new"}, nil).Maybe()
	mockRepo.On("UpdateSourceStatus", mock.Anything, mock.Anything).Return(nil).Maybe()
	mockRepo.On("CreateDocument", mock.Anything).Return(nil).Maybe()

	out, err := svc.AddSourcesBatch("s1", []string{
		"https://example.com/existing",
		"https://example.com/new",
		"https://example.com/new",
	}, "")

	assert.NoError(t, err)
	assert.Len(t, out, 1)
	assert.Equal(t, "https://example.com/new", out[0].URL)
	mockRepo.AssertNumberOfCalls(t, "CreateSource", 1)
}

func TestAddSourcesBatch_SkipsDuplicateSubject(t *testing.T) {
	mockRepo := new(MockRepository)
	svc := NewService(mockRepo, mockScraper{}, mockKnowledgeService{})

	mockRepo.On("FindSourcesBySession", "s1").Return([]Source{
		{URL: "https://example.com/hackathon", Type: TypeSubject},
	}, nil)

	out, err := svc.AddSourcesBatch("s1", nil, "https://example.com/hackathon")
	assert.NoError(t, err)
	assert.Nil(t, out)
}

func TestAddSourcesBatch_DBConstraintCatchesDuplicate(t *testing.T) {
	mockRepo := new(MockRepository)
	svc := NewService(mockRepo, mockScraper{}, mockKnowledgeService{})

	mockRepo.On("FindSourcesBySession", "s1").Return([]Source{}, nil)
	mockRepo.On("CreateSource", mock.MatchedBy(func(s *Source) bool {
		return s.URL == "https://example.com/race"
	})).Return(ErrDuplicateSource).Once()

	out, err := svc.AddSourcesBatch("s1", []string{"https://example.com/race"}, "")
	assert.NoError(t, err)
	assert.Nil(t, out)
	mockRepo.AssertNumberOfCalls(t, "CreateSource", 1)
}

func TestAddSourcesBatch_FailsOnLookupError(t *testing.T) {
	mockRepo := new(MockRepository)
	svc := NewService(mockRepo, mockScraper{}, mockKnowledgeService{})

	mockRepo.On("FindSourcesBySession", "s1").Return(nil, fmt.Errorf("db connection lost"))

	out, err := svc.AddSourcesBatch("s1", []string{"https://example.com/w1"}, "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "check existing sources")
	assert.Nil(t, out)
	mockRepo.AssertNumberOfCalls(t, "CreateSource", 0)
}
