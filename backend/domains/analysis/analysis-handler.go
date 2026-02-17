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

// AnalyzeInput optional body for directives.
type AnalyzeInput struct {
	Directives []string `json:"directives"`
}

// Analyze godoc
// @Summary Run analysis on a session
// @Description Analyzes session sources and stores structured results plus a default directive. Optional body: directives (strings) to steer the analysis and assistant.
// @Tags analysis
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Session ID"
// @Param input body AnalyzeInput false "Optional directives"
// @Success 201 {object} response.Response "Analysis in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "Session not found"
// @Failure 500 {object} response.Response "Analysis failed"
// @Router /sessions/{id}/analyze [post]
func (h *Handler) Analyze(c *gin.Context) {
	sessionID := c.Param("id")

	var input AnalyzeInput
	_ = c.ShouldBindJSON(&input)

	analysis, err := h.service.AnalyzeSession(sessionID, input.Directives)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Created(c, analysis, "Analysis completed")
}

// GetAnalyses godoc
// @Summary List analyses for a session
// @Description Returns all analyses run for the session.
// @Tags analysis
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Session ID"
// @Success 200 {object} response.Response "Analyses array in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "Session not found"
// @Router /sessions/{id}/analyses [get]
func (h *Handler) GetAnalyses(c *gin.Context) {
	sessionID := c.Param("id")
	analyses, err := h.service.GetAnalyses(sessionID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, analyses, "Analyses retrieved")
}
