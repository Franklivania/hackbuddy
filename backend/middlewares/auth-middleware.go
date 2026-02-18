package middlewares

import (
	"hackbuddy-backend/config"
	"hackbuddy-backend/db"
	"hackbuddy-backend/domains/auth"
	"hackbuddy-backend/pkg/response"
	"hackbuddy-backend/pkg/security"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// TokenRevocationChecker is used to reject revoked (logged-out) tokens. Pass nil to skip revocation check.
type TokenRevocationChecker interface {
	IsTokenRevoked(tokenID string) (bool, error)
}

func AuthMiddleware(cfg *config.Config, revokeChecker TokenRevocationChecker) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, http.StatusUnauthorized, "Authorization header required")
			c.Abort()
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		claims, err := security.ValidateToken(tokenString, cfg.JWTSecret)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "Invalid token")
			c.Abort()
			return
		}

		if revokeChecker != nil {
			revoked, err := revokeChecker.IsTokenRevoked(claims.ID)
			if err != nil {
				response.Error(c, http.StatusInternalServerError, "Authorization check failed")
				c.Abort()
				return
			}
			if revoked {
				response.Error(c, http.StatusUnauthorized, "Token has been revoked")
				c.Abort()
				return
			}
		}

		var u auth.User
		if err := db.DB.Where("id = ?", claims.UserID).First(&u).Error; err != nil {
			response.Error(c, http.StatusUnauthorized, "User not found or invalidated")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Set("claims", claims)
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			response.Error(c, http.StatusForbidden, "Admin access required")
			c.Abort()
			return
		}
		c.Next()
	}
}
