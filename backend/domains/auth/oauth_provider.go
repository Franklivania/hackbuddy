package auth

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"hackbuddy-backend/config"
)

const (
	googleAuthURL  = "https://accounts.google.com/o/oauth2/v2/auth"
	googleTokenURL = "https://oauth2.googleapis.com/token"
	googleUserURL  = "https://www.googleapis.com/oauth2/v2/userinfo"
	githubAuthURL  = "https://github.com/login/oauth/authorize"
	githubTokenURL = "https://github.com/login/oauth/access_token"
	githubUserURL  = "https://api.github.com/user"
	githubEmailsURL = "https://api.github.com/user/emails"
)

// OAuthProfile holds the minimal user info we need from a provider.
type OAuthProfile struct {
	Provider   string // "google" or "github"
	ProviderID string
	Email      string
	Name       string // Full name from provider (optional)
}

// GoogleAuthURL returns the URL to redirect the user to for Google sign-in.
func GoogleAuthURL(cfg *config.Config, state string) string {
	redirectURI := cfg.BackendURL + "/api/v1/auth/google/callback"
	v := url.Values{}
	v.Set("client_id", cfg.GoogleClientID)
	v.Set("redirect_uri", redirectURI)
	v.Set("response_type", "code")
	v.Set("scope", "openid email profile")
	if state != "" {
		v.Set("state", state)
	}
	return googleAuthURL + "?" + v.Encode()
}

// GithubAuthURL returns the URL to redirect the user to for GitHub sign-in.
func GithubAuthURL(cfg *config.Config, state string) string {
	redirectURI := cfg.BackendURL + "/api/v1/auth/github/callback"
	v := url.Values{}
	v.Set("client_id", cfg.GithubClientID)
	v.Set("redirect_uri", redirectURI)
	v.Set("scope", "user:email read:user")
	if state != "" {
		v.Set("state", state)
	}
	return githubAuthURL + "?" + v.Encode()
}

// ExchangeGoogleCode exchanges the authorization code for an access token and fetches user profile.
func ExchangeGoogleCode(cfg *config.Config, code string) (*OAuthProfile, error) {
	redirectURI := cfg.BackendURL + "/api/v1/auth/google/callback"
	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", cfg.GoogleClientID)
	data.Set("client_secret", cfg.GoogleClientSecret)
	data.Set("redirect_uri", redirectURI)
	data.Set("grant_type", "authorization_code")

	req, err := http.NewRequest("POST", googleTokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google token exchange: %s", string(body))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, err
	}
	if tokenResp.AccessToken == "" {
		return nil, fmt.Errorf("google: no access_token in response")
	}

	// Userinfo
	req2, _ := http.NewRequest("GET", googleUserURL, nil)
	req2.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)
	resp2, err := client.Do(req2)
	if err != nil {
		return nil, err
	}
	defer resp2.Body.Close()
	body2, err := io.ReadAll(resp2.Body)
	if err != nil {
		return nil, err
	}
	if resp2.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google userinfo: %s", string(body2))
	}

	var userInfo struct {
		ID            string `json:"id"`
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
	}
	if err := json.Unmarshal(body2, &userInfo); err != nil {
		return nil, err
	}
	if userInfo.Email == "" {
		return nil, fmt.Errorf("google: no email in userinfo")
	}

	return &OAuthProfile{
		Provider:   "google",
		ProviderID: userInfo.ID,
		Email:      userInfo.Email,
		Name:       userInfo.Name,
	}, nil
}

// ExchangeGithubCode exchanges the authorization code for an access token and fetches user profile and primary email.
func ExchangeGithubCode(cfg *config.Config, code string) (*OAuthProfile, error) {
	redirectURI := cfg.BackendURL + "/api/v1/auth/github/callback"
	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", cfg.GithubClientID)
	data.Set("client_secret", cfg.GithubClientSecret)
	data.Set("redirect_uri", redirectURI)

	req, err := http.NewRequest("POST", githubTokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github token exchange: %s", string(body))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, err
	}
	if tokenResp.AccessToken == "" {
		return nil, fmt.Errorf("github: no access_token in response")
	}

	// User
	req2, _ := http.NewRequest("GET", githubUserURL, nil)
	req2.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)
	req2.Header.Set("Accept", "application/vnd.github.v3+json")
	resp2, err := client.Do(req2)
	if err != nil {
		return nil, err
	}
	defer resp2.Body.Close()
	body2, err := io.ReadAll(resp2.Body)
	if err != nil {
		return nil, err
	}
	if resp2.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github user: %s", string(body2))
	}

	var userInfo struct {
		ID    int    `json:"id"`
		Login string `json:"login"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.Unmarshal(body2, &userInfo); err != nil {
		return nil, err
	}

	providerID := fmt.Sprintf("%d", userInfo.ID)
	email := userInfo.Email

	if email == "" {
		// Some GitHub users hide email; fetch from /user/emails
		req3, _ := http.NewRequest("GET", githubEmailsURL, nil)
		req3.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)
		req3.Header.Set("Accept", "application/vnd.github.v3+json")
		resp3, err := client.Do(req3)
		if err != nil {
			return nil, err
		}
		defer resp3.Body.Close()
		body3, _ := io.ReadAll(resp3.Body)
		if resp3.StatusCode == http.StatusOK {
			var emails []struct {
				Email   string `json:"email"`
				Primary bool   `json:"primary"`
			}
			if json.Unmarshal(body3, &emails) == nil {
				for _, e := range emails {
					if e.Primary {
						email = e.Email
						break
					}
				}
				if email == "" && len(emails) > 0 {
					email = emails[0].Email
				}
			}
		}
	}
	if email == "" {
		return nil, fmt.Errorf("github: no email available (user may need to grant user:email)")
	}

	return &OAuthProfile{
		Provider:   "github",
		ProviderID: providerID,
		Email:      email,
		Name:       userInfo.Name,
	}, nil
}
