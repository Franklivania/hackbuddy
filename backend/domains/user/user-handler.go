package user

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

// GetProfile godoc
// @Summary Get current user profile
// @Description Returns the authenticated user's profile.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.Response "User in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "User not found"
// @Router /users/me [get]
func (h *Handler) GetProfile(c *gin.Context) {
	userID := c.MustGet("user_id").(string)

	user, err := h.service.GetProfile(userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "User not found")
		return
	}

	response.Success(c, user, "User profile retrieved")
}

// GetByID godoc
// @Summary Get user by ID
// @Description Returns a user by ID. Authenticated users only.
// @Tags users
// @Produce json
// @Security BearerAuth
// @Param id path string true "User ID"
// @Success 200 {object} response.Response "User in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "User not found"
// @Router /users/{id} [get]
func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, http.StatusBadRequest, "id required")
		return
	}
	user, err := h.service.GetByID(id)
	if err != nil {
		response.Error(c, http.StatusNotFound, "User not found")
		return
	}
	response.Success(c, user, "User retrieved")
}

// SoftDeleteMe godoc
// @Summary Soft delete own account
// @Description Invalidates/revokes access; user details are retained.
// @Tags users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.Response "Account soft-deleted"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 404 {object} response.Response "User not found"
// @Router /users/me/delete [delete]
func (h *Handler) SoftDeleteMe(c *gin.Context) {
	userID := c.MustGet("user_id").(string)
	err := h.service.SoftDeleteMe(userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "User not found")
		return
	}
	response.Success(c, nil, "Account soft-deleted")
}
