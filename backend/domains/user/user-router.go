package user

import (
	"hackbuddy-backend/config"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config, authMiddleware gin.HandlerFunc) {
	repo := NewRepository()
	service := NewService(repo)
	handler := NewHandler(service)

	userGroup := r.Group("/users")
	userGroup.Use(authMiddleware)
	{
		userGroup.GET("/me", handler.GetProfile)
		userGroup.DELETE("/me/delete", handler.SoftDeleteMe)
		userGroup.GET("/:id", handler.GetByID)
	}
}
