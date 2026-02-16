package middlewares

import (
	"hackbuddy-backend/pkg/response"
	"net/http"

	"github.com/gin-gonic/gin"
)

// SessionOwnershipChecker is used to avoid importing session domain (import cycle).
// Implement in the session package and pass to SessionOwnershipMiddleware.
type SessionOwnershipChecker interface {
	HasAccess(sessionID, userID string) bool
}

// SessionOwnershipMiddleware ensures the session :id belongs to the authenticated user.
// Must be used after AuthMiddleware on routes under /sessions/:id.
func SessionOwnershipMiddleware(checker SessionOwnershipChecker) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID := c.Param("id")
		if sessionID == "" {
			response.Error(c, http.StatusBadRequest, "Session ID required")
			c.Abort()
			return
		}

		userIDVal, exists := c.Get("user_id")
		if !exists {
			response.Error(c, http.StatusUnauthorized, "Authorization required")
			c.Abort()
			return
		}
		userID, ok := userIDVal.(string)
		if !ok {
			response.Error(c, http.StatusInternalServerError, "Invalid user context")
			c.Abort()
			return
		}

		if !checker.HasAccess(sessionID, userID) {
			response.Error(c, http.StatusNotFound, "Session not found")
			c.Abort()
			return
		}

		c.Next()
	}
}
