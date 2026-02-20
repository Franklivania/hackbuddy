package admin

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/chat"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/domains/usage"
	"hackbuddy-backend/domains/user"
	"hackbuddy-backend/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config, authMiddleware gin.HandlerFunc) {
	userRepo := user.NewRepository()
	sessionRepo := session.NewRepository()
	analysisRepo := analysis.NewRepository()
	chatRepo := chat.NewRepository()
	sourceRepo := source.NewRepository()
	usageRepo := usage.NewRepository()
	service := NewService(userRepo, sessionRepo, analysisRepo, chatRepo, sourceRepo, usageRepo)
	handler := NewHandler(service)

	adminGroup := r.Group("/admin")
	adminGroup.Use(authMiddleware, middlewares.AdminMiddleware())
	{
		adminGroup.GET("/users", handler.GetUsers)
		adminGroup.GET("/sessions", handler.GetSessions)
		adminGroup.GET("/analyses", handler.GetAnalyses)
		adminGroup.GET("/usage", handler.GetUsage)
		adminGroup.GET("/usage/summary", handler.GetUsageSummary)
		adminGroup.GET("/model", handler.GetModel)
		adminGroup.PATCH("/model", handler.SetModel)
		adminGroup.PATCH("/role/:user_id", handler.UpdateRole)
		adminGroup.DELETE("/user/:user_id/delete", handler.SoftDeleteUser)
		adminGroup.DELETE("/user/:user_id/hard-delete", handler.HardDeleteUser)
	}
}
