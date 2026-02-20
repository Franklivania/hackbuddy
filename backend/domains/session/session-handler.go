package session

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

type CreateSessionInput struct {
	Name string `json:"name" binding:"required"`
}

type PatchSessionInput struct {
	Name string `json:"name" binding:"omitempty,min=1"`
}

// Create godoc
// @Summary Create a session
// @Description Create a new hackathon session for the authenticated user.
// @Tags sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body CreateSessionInput true "Session name"
// @Success 201 {object} response.Response "Session in data"
// @Failure 400 {object} response.Response "Validation error"
// @Failure 401 {object} response.Response "Unauthorized"
// @Router /sessions [post]
func (h *Handler) Create(c *gin.Context) {
	userID := c.MustGet("user_id").(string)

	var input CreateSessionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BindValidationError(c, err)
		return
	}

	session, err := h.service.CreateSession(userID, input.Name)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Created(c, session, "Session created successfully")
}

// GetAll godoc
// @Summary List my sessions
// @Description Returns all sessions for the authenticated user.
// @Tags sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.Response "Sessions array in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Router /sessions [get]
func (h *Handler) GetAll(c *gin.Context) {
	userID := c.MustGet("user_id").(string)

	sessions, err := h.service.GetUserSessions(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, sessions, "Sessions retrieved")
}

// Patch godoc
// @Summary Update a session
// @Description Update session name. Must belong to the authenticated user.
// @Tags sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Session ID"
// @Param input body PatchSessionInput true "Name to set"
// @Success 200 {object} response.Response "Updated session in data"
// @Failure 400 {object} response.Response "Validation error"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "Session not found"
// @Router /sessions/{id} [patch]
func (h *Handler) Patch(c *gin.Context) {
	userID := c.MustGet("user_id").(string)
	sessionID := c.Param("id")

	var input PatchSessionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BindValidationError(c, err)
		return
	}
	if input.Name == "" {
		response.Error(c, http.StatusBadRequest, "name is required")
		return
	}

	session, err := h.service.UpdateSession(sessionID, userID, input.Name)
	if err != nil {
		response.Error(c, http.StatusNotFound, "Session not found")
		return
	}
	response.Success(c, session, "Session updated")
}

// GetOne godoc
// @Summary Get a session
// @Description Get a single session by ID (must belong to the user).
// @Tags sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Session ID"
// @Success 200 {object} response.Response "Session in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "Session not found"
// @Router /sessions/{id} [get]
func (h *Handler) GetOne(c *gin.Context) {
	userID := c.MustGet("user_id").(string)
	sessionID := c.Param("id")

	session, err := h.service.GetSession(sessionID, userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "Session not found")
		return
	}

	response.Success(c, session, "Session retrieved")
}

// Delete godoc
// @Summary Delete a session
// @Description Delete a session by ID (must belong to the user).
// @Tags sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Session ID"
// @Success 200 {object} response.Response "Session deleted"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "Session not found"
// @Router /sessions/{id} [delete]
func (h *Handler) Delete(c *gin.Context) {
	userID := c.MustGet("user_id").(string)
	sessionID := c.Param("id")

	if err := h.service.DeleteSession(sessionID, userID); err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.Success(c, nil, "Session deleted")
}
