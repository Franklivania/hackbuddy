package auth

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"net/url"

	"hackbuddy-backend/config"
	"hackbuddy-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
	cfg     *config.Config
}

func NewHandler(service Service, cfg *config.Config) *Handler {
	return &Handler{service: service, cfg: cfg}
}

// Register godoc
// @Summary Register a new user (manual / email)
// @Description Register with email, full name, and password. A verification code is sent by email; user must verify before login. OAuth (Google/GitHub) users are auto-verified.
// @Tags auth
// @Accept json
// @Produce json
// @Param input body RegisterInput true "Registration data (email, full_name, password)"
// @Success 201 {object} response.Response "User registered, verify email"
// @Failure 400 {object} response.Response "Validation or email already in use"
// @Router /auth/register [post]
func (h *Handler) Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BindValidationError(c, err)
		return
	}

	if err := h.service.Register(input); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Created(c, nil, "User registered successfully. Please verify your email.")
}

// Login godoc
// @Summary Log in
// @Description Authenticate with email and password. Returns JWT. Email must be verified for email provider.
// @Tags auth
// @Accept json
// @Produce json
// @Param input body LoginInput true "Credentials"
// @Success 200 {object} response.Response "Token in data.token"
// @Failure 401 {object} response.Response "Invalid credentials or email not verified"
// @Router /auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BindValidationError(c, err)
		return
	}

	token, err := h.service.Login(input)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, err.Error())
		return
	}

	response.Success(c, gin.H{"token": token}, "Login successful")
}

// VerifyEmail godoc
// @Summary Verify email
// @Description Confirm email with the code sent after registration.
// @Tags auth
// @Accept json
// @Produce json
// @Param input body VerifyEmailInput true "Email and 6-digit code"
// @Success 200 {object} response.Response "Email verified"
// @Failure 400 {object} response.Response "Invalid or expired code"
// @Router /auth/verify-email [post]
func (h *Handler) VerifyEmail(c *gin.Context) {
	var input VerifyEmailInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BindValidationError(c, err)
		return
	}

	if err := h.service.VerifyEmail(input.Email, input.Code); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, nil, "Email verified successfully")
}

type ResendVerificationInput struct {
	Email string `json:"email" binding:"required,email"`
}

// ResendVerification godoc
// @Summary Resend email verification code
// @Description Resend a new verification code for a manual (email) account that is not yet verified.
// @Tags auth
// @Accept json
// @Produce json
// @Param input body ResendVerificationInput true "Email to resend verification code to"
// @Success 200 {object} response.Response "Verification code resent"
// @Failure 400 {object} response.Response "Validation or resend not allowed"
// @Router /auth/resend-otp [post]
func (h *Handler) ResendVerification(c *gin.Context) {
	var input ResendVerificationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BindValidationError(c, err)
		return
	}

	if err := h.service.ResendVerification(input.Email); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, nil, "Verification code resent successfully")
}

// GoogleStart godoc
// @Summary Start Google OAuth
// @Description Redirects the user to Google sign-in. On success they are sent to the callback URL.
// @Tags auth
// @Produce json
// @Success 302 "Redirect to Google"
// @Router /auth/google [get]
func (h *Handler) GoogleStart(c *gin.Context) {
	if h.cfg.GoogleClientID == "" {
		response.Error(c, http.StatusServiceUnavailable, "Google OAuth not configured")
		return
	}
	state, _ := randomState()
	redirectURL := GoogleAuthURL(h.cfg, state)
	c.Redirect(http.StatusFound, redirectURL)
}

// GoogleCallback godoc
// @Summary Google OAuth callback
// @Description Handles the redirect from Google with the authorization code. Exchanges code for user info, finds or creates user, then redirects to frontend with token.
// @Tags auth
// @Param code query string true "Authorization code from Google"
// @Param state query string false "State (optional)"
// @Success 302 "Redirect to frontend with token in query"
// @Failure 400 {object} response.Response "Missing code or exchange failed"
// @Router /auth/google/callback [get]
func (h *Handler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		redirectToFrontendWithError(c, h.cfg.FrontendURL, "missing_code")
		return
	}
	token, err := h.service.GoogleCallback(code)
	if err != nil {
		redirectToFrontendWithError(c, h.cfg.FrontendURL, "oauth_failed")
		return
	}
	redirectToFrontendWithToken(c, h.cfg.FrontendURL, token)
}

// GithubStart godoc
// @Summary Start GitHub OAuth
// @Description Redirects the user to GitHub sign-in. On success they are sent to the callback URL.
// @Tags auth
// @Produce json
// @Success 302 "Redirect to GitHub"
// @Router /auth/github [get]
func (h *Handler) GithubStart(c *gin.Context) {
	if h.cfg.GithubClientID == "" {
		response.Error(c, http.StatusServiceUnavailable, "GitHub OAuth not configured")
		return
	}
	state, _ := randomState()
	redirectURL := GithubAuthURL(h.cfg, state)
	c.Redirect(http.StatusFound, redirectURL)
}

// GithubCallback godoc
// @Summary GitHub OAuth callback
// @Description Handles the redirect from GitHub with the authorization code. Exchanges code for user info, finds or creates user, then redirects to frontend with token.
// @Tags auth
// @Param code query string true "Authorization code from GitHub"
// @Param state query string false "State (optional)"
// @Success 302 "Redirect to frontend with token in query"
// @Failure 400 {object} response.Response "Missing code or exchange failed"
// @Router /auth/github/callback [get]
func (h *Handler) GithubCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		redirectToFrontendWithError(c, h.cfg.FrontendURL, "missing_code")
		return
	}
	token, err := h.service.GithubCallback(code)
	if err != nil {
		redirectToFrontendWithError(c, h.cfg.FrontendURL, "oauth_failed")
		return
	}
	redirectToFrontendWithToken(c, h.cfg.FrontendURL, token)
}

func randomState() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func redirectToFrontendWithToken(c *gin.Context, frontendURL, token string) {
	u, _ := url.Parse(frontendURL)
	q := u.Query()
	q.Set("token", token)
	u.RawQuery = q.Encode()
	c.Redirect(http.StatusFound, u.String())
}

func redirectToFrontendWithError(c *gin.Context, frontendURL, errCode string) {
	u, _ := url.Parse(frontendURL)
	q := u.Query()
	q.Set("auth_error", errCode)
	u.RawQuery = q.Encode()
	c.Redirect(http.StatusFound, u.String())
}
