package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type Response struct {
	Status  string      `json:"status"` // "success" | "error"
	Data    interface{} `json:"data"`   // {} | [] | null
	Message string      `json:"message"`
	Success bool        `json:"success"`
}

func Success(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusOK, Response{
		Status:  "success",
		Data:    data,
		Message: message,
		Success: true,
	})
}

func Created(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusCreated, Response{
		Status:  "success",
		Data:    data,
		Message: message,
		Success: true,
	})
}

func Error(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, Response{
		Status:  "error",
		Data:    nil,
		Message: message,
		Success: false,
	})
}

func ValidationError(c *gin.Context, errors interface{}) {
	c.JSON(http.StatusBadRequest, Response{
		Status:  "error",
		Data:    errors,
		Message: "Validation failed",
		Success: false,
	})
}

// BindValidationError sends a 400 with validation details when err is from ShouldBindJSON.
// If err is validator.ValidationErrors, Data is a list of {field, message}; otherwise Data is err.Error().
func BindValidationError(c *gin.Context, err error) {
	if err == nil {
		return
	}
	if errs, ok := err.(validator.ValidationErrors); ok {
		details := make([]map[string]string, 0, len(errs))
		for _, e := range errs {
			details = append(details, map[string]string{"field": e.Field(), "message": e.Error()})
		}
		ValidationError(c, details)
		return
	}
	ValidationError(c, err.Error())
}
