package analysis

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

func (h *Handler) Analyze(c *gin.Context) {
	sessionID := c.Param("id")
	// Note: Authentication middleware provides user_id,
	// here we assume caller (Router) ensures proper middleware stack.

	analysis, err := h.service.AnalyzeSession(sessionID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Created(c, analysis, "Analysis completed")
}

func (h *Handler) GetAnalyses(c *gin.Context) {
	sessionID := c.Param("id")
	analyses, err := h.service.GetAnalyses(sessionID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, analyses, "Analyses retrieved")
}
