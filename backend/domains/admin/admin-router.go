package admin

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/domains/user"
	"hackbuddy-backend/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config) {
	userRepo := user.NewRepository()
	sessionRepo := session.NewRepository()
	analysisRepo := analysis.NewRepository()
	service := NewService(userRepo, sessionRepo, analysisRepo)
	handler := NewHandler(service)

	adminGroup := r.Group("/admin")
	adminGroup.Use(middlewares.AuthMiddleware(cfg), middlewares.AdminMiddleware())
	{
		adminGroup.GET("/users", handler.GetUsers)
		adminGroup.GET("/sessions", handler.GetSessions)
		adminGroup.GET("/analyses", handler.GetAnalyses)
	}
}
