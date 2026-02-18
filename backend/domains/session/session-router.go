package session

import (
	"hackbuddy-backend/config"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config, authMiddleware gin.HandlerFunc) {
	repo := NewRepository()
	service := NewService(repo)
	handler := NewHandler(service)

	sessionGroup := r.Group("/sessions")
	sessionGroup.Use(authMiddleware)
	{
		sessionGroup.POST("", handler.Create)
		sessionGroup.GET("", handler.GetAll)
		sessionGroup.GET("/:id", handler.GetOne)
		sessionGroup.DELETE("/:id", handler.Delete)
	}
}
