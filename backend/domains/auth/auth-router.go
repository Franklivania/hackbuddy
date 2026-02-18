package auth

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/infrastructure/mailer"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config, repo Repository, authMiddleware gin.HandlerFunc) {
	mailerService := mailer.NewMailer(cfg)
	service := NewService(repo, mailerService, cfg)
	handler := NewHandler(service, cfg)

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", handler.Register)
		authGroup.POST("/login", handler.Login)
		authGroup.POST("/verify-email", handler.VerifyEmail)
		authGroup.POST("/resend-otp", handler.ResendVerification)
		authGroup.POST("/logout", authMiddleware, handler.Logout)
		// OAuth: start redirects to provider; callback is the redirect_uri registered with provider
		authGroup.GET("/google", handler.GoogleStart)
		authGroup.GET("/google/callback", handler.GoogleCallback)
		authGroup.GET("/github", handler.GithubStart)
		authGroup.GET("/github/callback", handler.GithubCallback)
	}
}
