package db

import (
	"log"
)

const schemaMigrationsTable = "schema_migrations"

// Migration represents a single versioned migration step.
type Migration struct {
	Version int
	Run     func() error
}

// RunMigrations ensures the schema_migrations table exists, then runs any
// pending migrations in order. Each migration runs only once (when current version < its version).
func RunMigrations(migrations []Migration) {
	if err := ensureSchemaMigrationsTable(); err != nil {
		log.Fatalf("Migration setup failed: %v", err)
	}

	current, err := getCurrentVersion()
	if err != nil {
		log.Fatalf("Migration: get current version: %v", err)
	}

	for _, m := range migrations {
		if current >= m.Version {
			continue
		}
		log.Printf("Running migration version %d", m.Version)
		if err := m.Run(); err != nil {
			log.Fatalf("Migration %d failed: %v", m.Version, err)
		}
		if err := recordVersion(m.Version); err != nil {
			log.Fatalf("Migration %d: record version: %v", m.Version, err)
		}
		current = m.Version
	}

	log.Println("Migrations completed successfully")
}

func ensureSchemaMigrationsTable() error {
	return DB.Exec(`
		CREATE TABLE IF NOT EXISTS ` + schemaMigrationsTable + ` (
			version INTEGER PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)
	`).Error
}

func getCurrentVersion() (int, error) {
	var version *int
	err := DB.Raw("SELECT MAX(version) FROM "+schemaMigrationsTable).Scan(&version).Error
	if err != nil {
		return 0, err
	}
	if version == nil || *version == 0 {
		return 0, nil
	}
	return *version, nil
}

func recordVersion(version int) error {
	return DB.Exec("INSERT INTO "+schemaMigrationsTable+" (version) VALUES (?)", version).Error
}
