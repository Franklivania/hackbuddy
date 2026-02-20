package chat

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/domains/usage"
	"hackbuddy-backend/infrastructure/llm"
	"hackbuddy-backend/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config, authMiddleware gin.HandlerFunc, modelResolver llm.ModelResolver, usageRecorder *usage.Recorder) {
	repo := NewRepository()
	sourceRepo := source.NewRepository()
	analysisRepo := analysis.NewRepository()
	llmClient := llm.NewGroqClient(cfg, modelResolver)

	service := NewService(repo, sourceRepo, analysisRepo, llmClient, usageRecorder, modelResolver)
	handler := NewHandler(service)

	sessionGroup := r.Group("/sessions/:id")
	sessionGroup.Use(authMiddleware, middlewares.SessionOwnershipMiddleware(session.NewOwnershipChecker(session.NewRepository())))
	{
		sessionGroup.POST("/chat", handler.Chat)
		sessionGroup.GET("/chat", handler.GetHistory)
	}
}
