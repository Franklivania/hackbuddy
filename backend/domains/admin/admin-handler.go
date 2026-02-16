package admin

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

func (h *Handler) GetUsers(c *gin.Context) {
	users, err := h.service.GetAllUsers()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, users, "All users retrieved")
}

func (h *Handler) GetSessions(c *gin.Context) {
	sessions, err := h.service.GetAllSessions()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, sessions, "All sessions retrieved")
}

func (h *Handler) GetAnalyses(c *gin.Context) {
	analyses, err := h.service.GetAllAnalyses()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, analyses, "All analyses retrieved")
}
