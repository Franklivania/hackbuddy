package analysis

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/infrastructure/llm"
	"hackbuddy-backend/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config) {
	repo := NewRepository()
	sourceRepo := source.NewRepository()
	llmClient := llm.NewGroqClient(cfg)

	service := NewService(repo, sourceRepo, llmClient)
	handler := NewHandler(service)

	sessionGroup := r.Group("/sessions/:id")
	sessionGroup.Use(middlewares.AuthMiddleware(cfg), middlewares.SessionOwnershipMiddleware(session.NewOwnershipChecker(session.NewRepository())))
	{
		sessionGroup.POST("/analyze", handler.Analyze)
		sessionGroup.GET("/analyses", handler.GetAnalyses)
	}
}
