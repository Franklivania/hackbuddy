package chat

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/infrastructure/llm"
	"hackbuddy-backend/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config, authMiddleware gin.HandlerFunc) {
	repo := NewRepository()
	sourceRepo := source.NewRepository()
	analysisRepo := analysis.NewRepository()
	llmClient := llm.NewGroqClient(cfg)

	service := NewService(repo, sourceRepo, analysisRepo, llmClient)
	handler := NewHandler(service)

	sessionGroup := r.Group("/sessions/:id")
	sessionGroup.Use(authMiddleware, middlewares.SessionOwnershipMiddleware(session.NewOwnershipChecker(session.NewRepository())))
	{
		sessionGroup.POST("/chat", handler.Chat)
	}
}
