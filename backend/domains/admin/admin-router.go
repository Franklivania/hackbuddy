package admin

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/chat"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/domains/user"
	"hackbuddy-backend/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config) {
	userRepo := user.NewRepository()
	sessionRepo := session.NewRepository()
	analysisRepo := analysis.NewRepository()
	chatRepo := chat.NewRepository()
	sourceRepo := source.NewRepository()
	service := NewService(userRepo, sessionRepo, analysisRepo, chatRepo, sourceRepo)
	handler := NewHandler(service)

	adminGroup := r.Group("/admin")
	adminGroup.Use(middlewares.AuthMiddleware(cfg), middlewares.AdminMiddleware())
	{
		adminGroup.GET("/users", handler.GetUsers)
		adminGroup.GET("/sessions", handler.GetSessions)
		adminGroup.GET("/analyses", handler.GetAnalyses)
		adminGroup.PATCH("/role/:user_id", handler.UpdateRole)
		adminGroup.DELETE("/user/:user_id/delete", handler.SoftDeleteUser)
		adminGroup.DELETE("/user/:user_id/hard-delete", handler.HardDeleteUser)
	}
}
