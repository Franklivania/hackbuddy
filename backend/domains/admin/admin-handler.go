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

// GetUsers godoc
// @Summary List all users (admin)
// @Description Returns all users. Admin only.
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.Response "Users array in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 403 {object} response.Response "Admin required"
// @Router /admin/users [get]
func (h *Handler) GetUsers(c *gin.Context) {
	users, err := h.service.GetAllUsers()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, users, "All users retrieved")
}

// GetSessions godoc
// @Summary List all sessions (admin)
// @Description Returns all sessions. Admin only.
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.Response "Sessions array in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 403 {object} response.Response "Admin required"
// @Router /admin/sessions [get]
func (h *Handler) GetSessions(c *gin.Context) {
	sessions, err := h.service.GetAllSessions()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, sessions, "All sessions retrieved")
}

// GetAnalyses godoc
// @Summary List all analyses (admin)
// @Description Returns all analyses. Admin only.
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.Response "Analyses array in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 403 {object} response.Response "Admin required"
// @Router /admin/analyses [get]
func (h *Handler) GetAnalyses(c *gin.Context) {
	analyses, err := h.service.GetAllAnalyses()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, analyses, "All analyses retrieved")
}

// GetUsage godoc
// @Summary List token usage (admin)
// @Description Returns token usage rows. Optional query: user_id, session_id to filter.
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param user_id query string false "Filter by user ID"
// @Param session_id query string false "Filter by session ID"
// @Success 200 {object} response.Response "Token usage array in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 403 {object} response.Response "Admin required"
// @Router /admin/usage [get]
func (h *Handler) GetUsage(c *gin.Context) {
	var userID, sessionID *string
	if u := c.Query("user_id"); u != "" {
		userID = &u
	}
	if s := c.Query("session_id"); s != "" {
		sessionID = &s
	}
	list, err := h.service.GetTokenUsage(userID, sessionID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, list, "Usage retrieved")
}

// GetUsageSummary godoc
// @Summary Token usage summary by user/session/model (admin)
// @Description Returns aggregated token usage for gauging and manual model switching.
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.Response "Usage summary array in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 403 {object} response.Response "Admin required"
// @Router /admin/usage/summary [get]
func (h *Handler) GetUsageSummary(c *gin.Context) {
	summary, err := h.service.GetUsageSummary()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, summary, "Usage summary retrieved")
}

// GetModel godoc
// @Summary Get active LLM model and available models (admin)
// @Description Returns current active model (from override or config) and list of available model IDs.
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.Response "active, available in data"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 403 {object} response.Response "Admin required"
// @Router /admin/model [get]
func (h *Handler) GetModel(c *gin.Context) {
	active, _ := h.service.GetActiveModel()
	response.Success(c, gin.H{
		"active":    active,
		"available": h.service.GetAvailableModels(),
	}, "Model info retrieved")
}

// SetModelRequest is the body for PATCH /admin/model
type SetModelRequest struct {
	Model string `json:"model" binding:"required"`
}

// SetModel godoc
// @Summary Set active LLM model (admin)
// @Description Override the active model for all LLM calls. Use a value from GET /admin/model available list.
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body SetModelRequest true "Model ID"
// @Success 200 {object} response.Response "active model in data"
// @Failure 400 {object} response.Response "Invalid body"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 403 {object} response.Response "Admin required"
// @Router /admin/model [patch]
func (h *Handler) SetModel(c *gin.Context) {
	var req SetModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "model is required")
		return
	}
	if err := h.service.SetActiveModel(req.Model); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, gin.H{"active": req.Model}, "Model updated")
}

// UpdateRoleRequest is the body for PATCH /admin/role/:user_id
type UpdateRoleRequest struct {
	Role string `json:"role" binding:"required,oneof=user admin"`
}

// UpdateRole godoc
// @Summary Update user role (admin)
// @Description Set user role to user or admin. Admin only.
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param user_id path string true "User ID"
// @Param body body UpdateRoleRequest true "Role"
// @Success 200 {object} response.Response "Role updated"
// @Failure 400 {object} response.Response "Invalid role"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 403 {object} response.Response "Admin required"
// @Failure 404 {object} response.Response "User not found"
// @Router /admin/role/{user_id} [patch]
func (h *Handler) UpdateRole(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "user_id required")
		return
	}
	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid body: role must be user or admin")
		return
	}
	err := h.service.UpdateRole(userID, req.Role)
	if err != nil {
		response.Error(c, http.StatusNotFound, "User not found")
		return
	}
	response.Success(c, gin.H{"role": req.Role}, "Role updated")
}

// SoftDeleteUser godoc
// @Summary Soft delete a user (admin)
// @Description Invalidates the user; they can be permanently removed after 90 days. Admin only.
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Param user_id path string true "User ID"
// @Success 200 {object} response.Response "User soft-deleted"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 403 {object} response.Response "Admin required"
// @Failure 404 {object} response.Response "User not found"
// @Router /admin/user/{user_id}/delete [delete]
func (h *Handler) SoftDeleteUser(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "user_id required")
		return
	}
	err := h.service.SoftDeleteUser(userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "User not found")
		return
	}
	response.Success(c, nil, "User soft-deleted")
}

// HardDeleteUser godoc
// @Summary Permanently delete a user (admin)
// @Description Removes the user and all associated data. Admin only.
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Param user_id path string true "User ID"
// @Success 200 {object} response.Response "User deleted"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 403 {object} response.Response "Admin required"
// @Failure 404 {object} response.Response "User not found"
// @Router /admin/user/{user_id}/hard-delete [delete]
func (h *Handler) HardDeleteUser(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "user_id required")
		return
	}
	err := h.service.HardDeleteUser(userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "User not found")
		return
	}
	response.Success(c, nil, "User permanently deleted")
}
