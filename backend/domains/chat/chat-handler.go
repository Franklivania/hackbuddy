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
