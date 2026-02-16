package session

// OwnershipChecker implements middlewares.SessionOwnershipChecker without creating an import cycle.
// Use NewOwnershipChecker(repo) and pass to SessionOwnershipMiddleware.
type OwnershipChecker struct {
	Repo Repository
}

// NewOwnershipChecker returns a checker that uses the given repository.
func NewOwnershipChecker(repo Repository) *OwnershipChecker {
	return &OwnershipChecker{Repo: repo}
}

// HasAccess returns true if the session exists and belongs to the user.
func (c *OwnershipChecker) HasAccess(sessionID, userID string) bool {
	_, err := c.Repo.FindByID(sessionID, userID)
	return err == nil
}
