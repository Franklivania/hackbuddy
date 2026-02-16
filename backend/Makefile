.PHONY: all build run test swagger docker-build docker-up docker-down

all: swagger test docker-build docker-up

build:
	go build -o main ./cmd/main.go

run:
	go run ./cmd/main.go

test:
	go test -v ./... -cover

swagger:
	swag init -g cmd/main.go -o docs/swagger --parseDependency --parseInternal

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
