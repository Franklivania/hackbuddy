package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"hackbuddy-backend/config"
	"hackbuddy-backend/db"
	"hackbuddy-backend/domains/admin"
	"hackbuddy-backend/domains/analysis"
	"hackbuddy-backend/domains/auth"
	"hackbuddy-backend/domains/chat"
	"hackbuddy-backend/domains/session"
	"hackbuddy-backend/domains/source"
	"hackbuddy-backend/domains/user"
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

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

// BasePath for the API. Change this to update the URL prefix.
const BasePath = "/api/v1"

func main() {
	// 1. Load Config
	cfg := config.LoadConfig()

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
		// Register Routes
		auth.RegisterRoutes(api, cfg)
		user.RegisterRoutes(api, cfg)
		session.RegisterRoutes(api, cfg)
		source.RegisterRoutes(api, cfg)
		analysis.RegisterRoutes(api, cfg)
		chat.RegisterRoutes(api, cfg)
		admin.RegisterRoutes(api, cfg)
	}

	return r
}

func runMigrations() {
	// Order matters for foreign keys
	// Users first, then Sessions, then others
	err := db.DB.AutoMigrate(
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
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	log.Println("Migrations completed successfully")
}
