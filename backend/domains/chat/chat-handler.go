package chat

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

type ChatInput struct {
	Message string `json:"message" binding:"required"`
}

// Chat godoc
// @Summary Send a chat message
// @Description Send a message in a session. Uses session context and directive. Returns assistant reply.
// @Tags chat
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Session ID"
// @Param input body ChatInput true "Message content"
// @Success 200 {object} response.Response "Assistant message in data"
// @Failure 400 {object} response.Response "Validation or guardrail"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "Session not found"
// @Router /sessions/{id}/chat [post]
func (h *Handler) Chat(c *gin.Context) {
	sessionID := c.Param("id")
	userID := c.MustGet("user_id").(string)
	var input ChatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BindValidationError(c, err)
		return
	}

	msg, err := h.service.SendMessage(sessionID, userID, input.Message)
	if err != nil {
		// handle guardrail error specially if needed
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, msg, "Message sent")
}

// GetHistory godoc
// @Summary Get chat history for a session
// @Description Returns all chat messages (user and assistant) for the session, ordered by creation time.
// @Tags chat
// @Produce json
// @Security BearerAuth
// @Param id path string true "Session ID"
// @Success 200 {object} response.Response "Messages array in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "Session not found"
// @Failure 500 {object} response.Response "Internal error"
// @Router /sessions/{id}/chat [get]
func (h *Handler) GetHistory(c *gin.Context) {
	sessionID := c.Param("id")
	messages, err := h.service.GetHistory(sessionID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, messages, "Chat history retrieved")
}
