package source

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/infrastructure/llm"
	"hackbuddy-backend/infrastructure/scraper"
	"hackbuddy-backend/middlewares"
	"strings"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config, authMiddleware gin.HandlerFunc) {
	repo := NewRepository()
	// Shared clients
	llmClient := llm.NewGroqClient(cfg)
	allowedDomains := parseAllowedScrapeDomains(cfg.AllowedScrapeDomains)
	scraperService := scraper.NewCollyScraper(allowedDomains)

	knowService := NewKnowledgeService(repo, llmClient)
	service := NewService(repo, scraperService, knowService)
	handler := NewHandler(service)

	sessionGroup := r.Group("/sessions/:id")
	sessionGroup.Use(authMiddleware, middlewares.SessionOwnershipMiddleware(session.NewOwnershipChecker(session.NewRepository())))
	{
		sessionGroup.POST("/sources", handler.AddSource)
		sessionGroup.GET("/sources", handler.GetSources)
	}
}

func parseAllowedScrapeDomains(csv string) []string {
	if csv == "" {
		return nil
	}
	var out []string
	for _, s := range strings.Split(csv, ",") {
		if d := strings.TrimSpace(s); d != "" {
			out = append(out, d)
		}
	}
	return out
}
