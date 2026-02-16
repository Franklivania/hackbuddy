package auth

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/infrastructure/mailer"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config) {
	repo := NewRepository()
	mailerService := mailer.NewSMTPMailer(cfg)
	service := NewService(repo, mailerService, cfg)
	handler := NewHandler(service)

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", handler.Register)
		authGroup.POST("/login", handler.Login)
		authGroup.POST("/verify-email", handler.VerifyEmail)
		// OAuth routes would go here
	}
}
