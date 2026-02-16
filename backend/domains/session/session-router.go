package session

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r gin.IRouter, cfg *config.Config) {
	repo := NewRepository()
	service := NewService(repo)
	handler := NewHandler(service)

	sessionGroup := r.Group("/sessions")
	sessionGroup.Use(middlewares.AuthMiddleware(cfg))
	{
		sessionGroup.POST("", handler.Create)
		sessionGroup.GET("", handler.GetAll)
		sessionGroup.GET("/:id", handler.GetOne)
		sessionGroup.DELETE("/:id", handler.Delete)
	}
}
