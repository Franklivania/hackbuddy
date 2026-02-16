package db

import (
	"hackbuddy-backend/config"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg *config.Config) {
	var err error
	dsn := cfg.DBUrl
	if dsn == "" {
		// Fallback for local development if full URL not provided
		// This assumes standard postgres container settings but flexible header
		dsn = "host=localhost user=postgres password=postgres dbname=hackbuddy port=5432 sslmode=disable"
	}

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Connected to database successfully")
}

func Close() {
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Failed to close database connection: %v", err)
	}
	sqlDB.Close()
}
