package validator

import (
	"github.com/go-playground/validator/v10"
)

var Validate *validator.Validate

func InitValidator() {
	Validate = validator.New()
}

func ValidateStruct(s interface{}) error {
	return Validate.Struct(s)
}
