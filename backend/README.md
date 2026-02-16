# Hackbuddy Backend

Production-grade Go backend for the Hackathon Intelligence Platform. Provides auth, sessions, URL sourcing with scraping, LLM-powered analysis, and session-scoped chat.

## Requirements

- Go 1.24+
- PostgreSQL 15+
- (Optional) Groq API key for LLM features; SMTP for email verification

## Setup

1. Copy environment template and set variables:

   ```bash
   cp .env.example .env
   ```

   Required for production:

   - `DATABASE_URL` – PostgreSQL connection string
   - `JWT_SECRET` – at least 16 characters (never use default in production)
   - `APP_ENV=production` – enforces JWT_SECRET and safe defaults

   Optional:

   - `GROQ_API_KEY` – for analysis and chat
   - `SMTP_*` – for email verification
   - `FRONTEND_URL` – allowed CORS origin (e.g. `http://localhost:3000`)
   - `ALLOWED_SCRAPE_DOMAINS` – comma-separated domains for scraping (empty = allow any except SSRF blocks)

2. Run migrations (auto on startup):

   The server runs GORM AutoMigrate on startup. Ensure DB is reachable.

3. Start the server:

   ```bash
   go run ./cmd/main.go
   ```

   Or with Make:

   ```bash
   make run
   ```

## API

- Base path: `/api/v1`
- Health: `GET /health`, `GET /health/db`
- Swagger UI: `GET /docs/index.html`
- Auth: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/verify-email`
- Protected routes use `Authorization: Bearer <token>`

## Docker

Build and run with Docker Compose (config via environment; do not bake `.env` into the image):

```bash
docker-compose up -d
```

Set `DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, and optionally `APP_ENV=production` in the environment or a compose env file.

## Development

- Run tests: `make test` or `go test -v ./... -cover`
- Generate Swagger: `make swagger` (requires [swag](https://github.com/swaggo/swag))

## Rate limiting

In-memory rate limiter (10 req/s, burst 20 per IP). For production at scale, use a shared store (e.g. Redis) and configure accordingly.
