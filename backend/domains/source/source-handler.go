package source

import (
	"hackbuddy-backend/pkg/response"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// AddSourcesInput is the batch payload: winning-strategy links and the target hackathon URL.
type AddSourcesInput struct {
	Links       []string `json:"links" binding:"omitempty,dive,url"`
	SubjectLink string   `json:"subject_link" binding:"omitempty,url"`
}

// AddSource godoc
// @Summary Add sources to a session (batch)
// @Description Add winning-strategy links and the subject hackathon URL. Scraping and processing run asynchronously. Provide at least one of links or subject_link.
// @Tags sources
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Session ID"
// @Param input body AddSourcesInput true "links (winning strategies), subject_link (hackathon to compete in)"
// @Success 201 {object} response.Response "Sources array in data"
// @Failure 400 {object} response.Response "Validation error"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "Session not found"
// @Router /sessions/{id}/sources [post]
func (h *Handler) AddSource(c *gin.Context) {
	sessionID := c.Param("id")

	var input AddSourcesInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BindValidationError(c, err)
		return
	}

	// At least one of links or subject_link required
	trimmed := make([]string, 0, len(input.Links))
	for _, u := range input.Links {
		if s := strings.TrimSpace(u); s != "" {
			trimmed = append(trimmed, s)
		}
	}
	subjectLink := strings.TrimSpace(input.SubjectLink)
	if len(trimmed) == 0 && subjectLink == "" {
		response.Error(c, http.StatusBadRequest, "provide at least one link in links or subject_link")
		return
	}

	sources, err := h.service.AddSourcesBatch(sessionID, trimmed, subjectLink)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	if len(sources) == 0 {
		existing, err := h.service.GetSessionSources(sessionID)
		if err == nil && len(existing) > 0 {
			response.Success(c, existing, "All sources already exist for this session")
			return
		}
		response.Error(c, http.StatusBadRequest, "provide at least one valid link in links or subject_link")
		return
	}

	response.Created(c, sources, "Sources added and processing started")
}

// GetSources godoc
// @Summary List sources for a session
// @Description Returns all sources (URLs) added to the session.
// @Tags sources
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Session ID"
// @Success 200 {object} response.Response "Sources array in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "Session not found"
// @Router /sessions/{id}/sources [get]
func (h *Handler) GetSources(c *gin.Context) {
	sessionID := c.Param("id")
	sources, err := h.service.GetSessionSources(sessionID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, sources, "Sources retrieved")
}

// GetChunks godoc
// @Summary List chunks for a session
// @Description Returns all chunks (with content and summary) for the session, used for analysis context.
// @Tags sources
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Session ID"
// @Success 200 {object} response.Response "Chunks array in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "Session not found"
// @Router /sessions/{id}/chunks [get]
func (h *Handler) GetChunks(c *gin.Context) {
	sessionID := c.Param("id")
	chunks, err := h.service.GetSessionChunks(sessionID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, chunks, "Chunks retrieved")
}
