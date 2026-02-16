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

func (h *Handler) GetAll(c *gin.Context) {
	userID := c.MustGet("user_id").(string)

	sessions, err := h.service.GetUserSessions(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, sessions, "Sessions retrieved")
}

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

func (h *Handler) Delete(c *gin.Context) {
	userID := c.MustGet("user_id").(string)
	sessionID := c.Param("id")

	if err := h.service.DeleteSession(sessionID, userID); err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.Success(c, nil, "Session deleted")
}
