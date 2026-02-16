package user

import (
	"hackbuddy-backend/domains/auth"
)

// User imports the struct from auth to avoid circular dependencies if we move it here,
// or we just alias it. For now, we reuse the Auth model as the source of truth.
type User = auth.User
