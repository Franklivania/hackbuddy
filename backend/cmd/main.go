package main

import (
	"context"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"hackbuddy-backend/config"
	"hackbuddy-backend/docs/swagger"
	"hackbuddy-backend/db"
	"hackbuddy-backend/domains/admin"
	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/auth"
	"hackbuddy-backend/domains/chat"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/domains/usage"
	"hackbuddy-backend/domains/user"
	"hackbuddy-backend/infrastructure/llm"
	"hackbuddy-backend/middlewares"
	"hackbuddy-backend/pkg/logger"
	"hackbuddy-backend/pkg/validator"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "hackbuddy-backend/docs/swagger"
)

// @title Hackathon Intelligence Platform API
// @version 1.0
// @description Production-grade Go backend for Hackathon Intelligence.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host https://hackbuddy-im66.onrender.com
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

// BasePath for the API. Change this to update the URL prefix.
const BasePath = "/api/v1"

func main() {
	// 1. Load Config
	cfg := config.LoadConfig()

	// Disable Gin debug mode in production (no debug logs, no stack traces in responses)
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Set Swagger host from BackendURL so "Try it out" on Render uses the deployed URL (avoids CORS/failed fetch)
	if cfg.BackendURL != "" {
		if u, err := url.Parse(cfg.BackendURL); err == nil {
			swagger.SwaggerInfo.Host = u.Host
			if u.Scheme != "" {
				swagger.SwaggerInfo.Schemes = []string{u.Scheme}
			}
		}
	}

	// 2. Init Infrastructure
	logger.InitLogger()
	validator.InitValidator()
	db.Connect(cfg)

	// 3. Auto-Migrate
	runMigrations()

	// 4. Setup Router
	r := SetupRouter(cfg)

	// 5. Run with timeouts and graceful shutdown
	srv := &http.Server{
		Addr:         ":" + cfg.AppPort,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout:  15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	go func() {
		log.Printf("Server starting on port %s", cfg.AppPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
	db.Close()
	log.Println("Server exited")
}

// SetupRouter configures the engine and routes. Exported for testing.
func SetupRouter(cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// CORS: allow frontend origin
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Global Middleware
	r.Use(middlewares.RateLimitMiddleware())

	// Health Checks (Outside BasePath usually, or inside?)
	// Usually checks are root or /health. Let's keep them at root for Docker/K8s.
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	r.GET("/health/db", func(c *gin.Context) {
		sqlDB, err := db.DB.DB()
		if err != nil || sqlDB.Ping() != nil {
			c.JSON(500, gin.H{"status": "error", "message": "database unreachable"})
			return
		}
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Swagger (At root usually)
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API Group
	api := r.Group(BasePath)
	{
		authRepo := auth.NewRepository()
		authMiddleware := middlewares.AuthMiddleware(cfg, authRepo)
		// Register Routes (auth needs repo + middleware for logout; others need middleware for protected routes)
		auth.RegisterRoutes(api, cfg, authRepo, authMiddleware)
		user.RegisterRoutes(api, cfg, authMiddleware)
		session.RegisterRoutes(api, cfg, authMiddleware)
		modelResolver := llm.NewModelResolver(func() string {
			v, _ := db.GetSetting(llm.SettingKeyActiveModel)
			return v
		}, cfg.GroqModel)
		usageRepo := usage.NewRepository()
		usageRecorder := usage.NewRecorder(usageRepo)
		source.RegisterRoutes(api, cfg, authMiddleware, modelResolver)
		analysis.RegisterRoutes(api, cfg, authMiddleware, modelResolver, usageRecorder)
		chat.RegisterRoutes(api, cfg, authMiddleware, modelResolver, usageRecorder)
		admin.RegisterRoutes(api, cfg, authMiddleware)
	}

	return r
}

func runMigrations() {
	db.RunMigrations([]db.Migration{
		{
			Version: 1,
			Run: func() error {
				// Order matters for foreign keys: users first, then sessions, then rest
				return db.DB.AutoMigrate(
					&auth.User{},
					&auth.EmailVerification{},
					&session.Session{},
					&source.Source{},
					&source.SessionDocument{},
					&source.SessionChunk{},
					&analysis.Analysis{},
					&analysis.SessionContext{},
					&chat.Message{},
				)
			},
		},
		{
			Version: 2,
			Run: func() error {
				return db.DB.AutoMigrate(&auth.RevokedToken{})
			},
		},
		{
			Version: 3,
			Run: func() error {
				return db.DB.AutoMigrate(&db.Setting{})
			},
		},
		{
			Version: 4,
			Run: func() error {
				return db.DB.AutoMigrate(&usage.TokenUsage{})
			},
		},
		{
			Version: 5,
			Run: func() error {
				return db.DB.AutoMigrate(&source.SessionChunk{})
			},
		},
		{
			Version: 6,
			Run: func() error {
				// Remove duplicate sources and their orphaned documents/chunks.
				// Keeps the earliest source per (session_id, url).
				db.DB.Exec(`
					DELETE FROM session_chunks WHERE doc_id IN (
						SELECT sd.id FROM session_documents sd
						JOIN (
							SELECT id FROM (
								SELECT id, ROW_NUMBER() OVER (
									PARTITION BY session_id, url ORDER BY created_at
								) AS rn FROM sources WHERE deleted_at IS NULL
							) t WHERE rn > 1
						) dup ON sd.source_id = dup.id
					)`)
				db.DB.Exec(`
					DELETE FROM session_documents WHERE source_id IN (
						SELECT id FROM (
							SELECT id, ROW_NUMBER() OVER (
								PARTITION BY session_id, url ORDER BY created_at
							) AS rn FROM sources WHERE deleted_at IS NULL
						) t WHERE rn > 1
					)`)
				db.DB.Exec(`
					DELETE FROM sources WHERE id IN (
						SELECT id FROM (
							SELECT id, ROW_NUMBER() OVER (
								PARTITION BY session_id, url ORDER BY created_at
							) AS rn FROM sources WHERE deleted_at IS NULL
						) t WHERE rn > 1
					)`)
				return db.DB.Exec(`
					CREATE UNIQUE INDEX IF NOT EXISTS idx_source_session_url
					ON sources (session_id, url)
					WHERE deleted_at IS NULL
				`).Error
			},
		},
	})
}
