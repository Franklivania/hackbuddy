package user

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config) {
	repo := NewRepository()
	service := NewService(repo)
	handler := NewHandler(service)

	userGroup := r.Group("/users")
	userGroup.Use(middlewares.AuthMiddleware(cfg))
	{
		userGroup.GET("/me", handler.GetProfile)
		userGroup.DELETE("/me/delete", handler.SoftDeleteMe)
		userGroup.GET("/:id", handler.GetByID)
	}
}
