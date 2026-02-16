package source

import (
	"hackbuddy-backend/pkg/response"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

type AddSourceInput struct {
	URL  string `json:"url" binding:"required,url"`
	Type string `json:"type" binding:"required,oneof=event winner"`
}

func (h *Handler) AddSource(c *gin.Context) {
	sessionID := c.Param("id")
	// Session ownership enforced by SessionOwnershipMiddleware on this route group.

	var input AddSourceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BindValidationError(c, err)
		return
	}

	source, err := h.service.AddSource(sessionID, input.URL, input.Type)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Created(c, source, "Source added and processing started")
}

func (h *Handler) GetSources(c *gin.Context) {
	sessionID := c.Param("id")
	sources, err := h.service.GetSessionSources(sessionID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, sources, "Sources retrieved")
}
