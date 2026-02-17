.PHONY: all all-local all-prod build run test swagger docker-build docker-up docker-down up-local down-local up-prod down-prod

# Environment-agnostic: docs + tests only (no docker)
all: swagger test

all-local: swagger test up-local

all-prod: swagger test up-prod

build:
	go build -o main ./cmd/main.go

run:
	go run ./cmd/main.go

test:
	go test -v ./... -cover

swagger:
	swag init -g cmd/main.go -o docs/swagger -d . --parseDependency --parseInternal

docker-build:
	docker compose -f docker-compose.yml build

docker-up:
	docker compose -f docker-compose.yml up -d

docker-down:
	docker compose -f docker-compose.yml down

up-local:
	docker compose -f docker-compose.yml up -d --build

down-local:
	docker compose -f docker-compose.yml down

up-prod:
	docker compose -f docker-compose-prod.yml up -d --build

down-prod:
	docker compose -f docker-compose-prod.yml down
