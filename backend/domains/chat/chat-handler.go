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
	var input ChatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BindValidationError(c, err)
		return
	}

	msg, err := h.service.SendMessage(sessionID, input.Message)
	if err != nil {
		// handle guardrail error specially if needed
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, msg, "Message sent")
}
