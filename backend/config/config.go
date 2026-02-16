package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort          string
	AppEnv           string // "production", "development", etc.
	DBUrl            string
	JWTSecret        string
	GoogleClientID   string
	GoogleClientSecret string
	GithubClientID   string
	GithubClientSecret string
	GroqAPIKey       string
	SMTPServer       string
	SMTPPort         int
	SMTPUser         string
	SMTPPassword     string
	FrontendURL          string
	AllowedScrapeDomains string // Comma-separated; empty means allow any (except blocked SSRF targets)
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	appEnv := getEnv("APP_ENV", "development")
	jwtSecret := getEnv("JWT_SECRET", "secret")
	if appEnv == "production" {
		if jwtSecret == "" || jwtSecret == "secret" || len(jwtSecret) < 16 {
			log.Fatal("JWT_SECRET must be set and at least 16 characters in production")
		}
	}

	return &Config{
		AppPort:          getEnv("APP_PORT", "8080"),
		AppEnv:           appEnv,
		DBUrl:            getEnv("DATABASE_URL", ""),
		JWTSecret:        jwtSecret,
		GoogleClientID:   getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GithubClientID:   getEnv("GITHUB_CLIENT_ID", ""),
		GithubClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
		GroqAPIKey:       getEnv("GROQ_API_KEY", ""),
		SMTPServer:       getEnv("SMTP_SERVER", "smtp.gmail.com"),
		SMTPPort:         getEnvAsInt("SMTP_PORT", 587),
		SMTPUser:         getEnv("SMTP_USER", ""),
		SMTPPassword:     getEnv("SMTP_PASSWORD", ""),
		FrontendURL:          getEnv("FRONTEND_URL", "http://localhost:3000"),
		AllowedScrapeDomains: getEnv("ALLOWED_SCRAPE_DOMAINS", ""),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return fallback
}
