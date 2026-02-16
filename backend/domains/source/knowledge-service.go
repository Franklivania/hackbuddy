package source

import (
	"fmt"
	"hackbuddy-backend/infrastructure/llm"
	"time"
)

type KnowledgeService interface {
	ProcessDocument(doc *SessionDocument) error
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

func (k *knowledgeService) ProcessDocument(doc *SessionDocument) error {
	// 1. Chunk
	chunks := chunkContent(doc.ContentClean, 1000) // 1000 char tokens approx

	for _, content := range chunks {
		// 2. Summarize (Index) each chunk
		summary, err := k.summarizeChunk(content)
		if err != nil {
			// Log error but maybe continue? For strictness we fail.
			return err
		}

		chunk := &SessionChunk{
			SessionID:  doc.SessionID,
			DocID:      doc.ID,
			Content:    content,
			Summary:    summary,
			TokenCount: len(content) / 4, // Rough est
			CreatedAt:  time.Now(),
		}

		// 3. Store
		if err := k.repo.CreateChunk(chunk); err != nil {
			return err
		}
	}

	return nil
}

func (k *knowledgeService) summarizeChunk(content string) (string, error) {
	prompt := fmt.Sprintf("Summarize the following content concisely for retrieval purposes. Focus on facts and key details:\n\n%s", content)

	messages := []llm.Message{
		{Role: "system", Content: "You are a helpful assistant that summarizes text."},
		{Role: "user", Content: prompt},
	}

	return k.llmClient.Chat(messages, false)
}

func chunkContent(content string, size int) []string {
	// Simple chunking by size
	// A proper implementation would split by paragraphs/sentences
	var chunks []string
	runes := []rune(content)

	for i := 0; i < len(runes); i += size {
		end := i + size
		if end > len(runes) {
			end = len(runes)
		}
		chunks = append(chunks, string(runes[i:end]))
	}
	return chunks
}
