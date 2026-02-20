package llm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"hackbuddy-backend/config"
	"net/http"
	"sync"
	"time"
)

// Supported model IDs for automatic/manual switching (within provider limits).
var Models = []string{
	"llama-3.3-70b-versatile",                      // Meta Llama 3.3 70B — 12K/min, 100K/day
	"openai/gpt-oss-20b",                           // GPT OSS 20B — 8K/min, 200K/day
	"meta-llama/llama-4-maverick-17b-128e-instruct", // Llama 4 Maverick 17B — 6K/min, 500K/day
}

const (
	SettingKeyActiveModel = "llm_active_model"
	apiURL                = "https://api.groq.com/openai/v1/chat/completions"
	minRequestInterval    = 2100 * time.Millisecond // ~28 req/min, safe under 30/min limit
	maxRetries            = 3
)

// Global rate limiter shared by all GroqClient instances so concurrent
// services (source, analysis, chat) collectively stay under the API limit.
var (
	rateMu  sync.Mutex
	lastReq time.Time
)

func throttle() {
	rateMu.Lock()
	defer rateMu.Unlock()
	if wait := minRequestInterval - time.Since(lastReq); wait > 0 {
		time.Sleep(wait)
	}
	lastReq = time.Now()
}

// ModelResolver returns the active model ID (from DB override or config).
type ModelResolver interface {
	GetActiveModel() string
}

// NewModelResolver returns a ModelResolver that uses getter(); getter should return DB override or empty for default.
func NewModelResolver(getter func() string, defaultModel string) ModelResolver {
	return &modelResolver{getter: getter, defaultModel: defaultModel}
}

type modelResolver struct {
	getter       func() string
	defaultModel string
}

func (r *modelResolver) GetActiveModel() string {
	if m := r.getter(); m != "" {
		return m
	}
	return r.defaultModel
}

// Usage holds token counts from the API for tracking.
type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type LLMClient interface {
	Chat(messages []Message, jsonMode bool) (string, *Usage, error)
}

type GroqClient struct {
	cfg        *config.Config
	resolver   ModelResolver
	httpClient *http.Client
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type CompletionRequest struct {
	Model          string          `json:"model"`
	Messages       []Message       `json:"messages"`
	Temperature    float64         `json:"temperature"`
	MaxTokens      int             `json:"max_tokens,omitempty"`
	ResponseFormat *ResponseFormat `json:"response_format,omitempty"`
}

type ResponseFormat struct {
	Type string `json:"type"` // "json_object"
}

type CompletionResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
	Usage *struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// NewGroqClient creates a Groq client. resolver may be nil to use cfg.GroqModel only.
func NewGroqClient(cfg *config.Config, resolver ModelResolver) *GroqClient {
	return &GroqClient{
		cfg:      cfg,
		resolver: resolver,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

func (c *GroqClient) Chat(messages []Message, jsonMode bool) (string, *Usage, error) {
	throttle()

	model := c.cfg.GroqModel
	if c.resolver != nil {
		if m := c.resolver.GetActiveModel(); m != "" {
			model = m
		}
	}
	maxTokens := c.cfg.GroqMaxTokens
	if maxTokens <= 0 {
		maxTokens = 8192
	}
	reqBody := CompletionRequest{
		Model:       model,
		Messages:    messages,
		Temperature: 0.7,
		MaxTokens:   maxTokens,
	}
	if jsonMode {
		reqBody.ResponseFormat = &ResponseFormat{Type: "json_object"}
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", nil, err
	}

	resp, err := c.doWithRetry(jsonData)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", nil, fmt.Errorf("LLM API returned status: %d", resp.StatusCode)
	}

	var completion CompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&completion); err != nil {
		return "", nil, err
	}

	if len(completion.Choices) == 0 {
		return "", nil, fmt.Errorf("no completion choices returned")
	}

	var usage *Usage
	if completion.Usage != nil {
		usage = &Usage{
			PromptTokens:     completion.Usage.PromptTokens,
			CompletionTokens: completion.Usage.CompletionTokens,
			TotalTokens:      completion.Usage.TotalTokens,
		}
	}
	return completion.Choices[0].Message.Content, usage, nil
}

// doWithRetry sends the request with exponential backoff on 429 (rate-limited) responses.
func (c *GroqClient) doWithRetry(body []byte) (*http.Response, error) {
	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			time.Sleep(time.Duration(attempt) * 2 * time.Second)
			throttle()
		}

		req, err := http.NewRequest("POST", apiURL, bytes.NewReader(body))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+c.cfg.GroqAPIKey)

		resp, err := c.httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode != http.StatusTooManyRequests {
			return resp, nil
		}
		resp.Body.Close()
	}
	return nil, fmt.Errorf("LLM API rate limited after %d attempts", maxRetries+1)
}
