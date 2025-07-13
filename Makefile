# TradeWiser Platform - Development Makefile

.PHONY: help setup dev build start stop logs clean docker-build docker-push

# Default target
help:
	@echo "TradeWiser Platform - Development Commands"
	@echo "=========================================="
	@echo ""
	@echo "Setup Commands:"
	@echo "  make setup          - Initial project setup"
	@echo "  make install        - Install dependencies"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev            - Start development server"
	@echo "  make build          - Build for production"
	@echo "  make start          - Start production server"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-start   - Start with Docker Compose"
	@echo "  make docker-stop    - Stop Docker services"
	@echo "  make docker-logs    - View Docker logs"
	@echo "  make docker-build   - Build Docker image"
	@echo "  make docker-clean   - Clean Docker resources"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-push        - Push database schema"
	@echo "  make db-migrate     - Run database migrations"
	@echo "  make db-studio      - Open database studio"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make logs           - View application logs"
	@echo "  make test           - Run tests"

# Setup and Installation
setup:
	@echo "Setting up TradeWiser Platform..."
	@cp .env.docker .env
	@mkdir -p uploads logs db
	@echo "✅ Setup complete!"

install:
	@echo "Installing dependencies..."
	@npm ci

# Development
dev:
	@echo "Starting development server..."
	@npm run dev

build:
	@echo "Building for production..."
	@npm run build

start:
	@echo "Starting production server..."
	@npm start

# Docker Commands
docker-start:
	@echo "Starting with Docker Compose..."
	@./start.sh

docker-stop:
	@echo "Stopping Docker services..."
	@docker-compose down

docker-logs:
	@echo "Viewing Docker logs..."
	@docker-compose logs -f

docker-build:
	@echo "Building Docker image..."
	@docker build -t tradewiser .

docker-clean:
	@echo "Cleaning Docker resources..."
	@docker-compose down -v
	@docker system prune -f

# Database Commands
db-push:
	@echo "Pushing database schema..."
	@npm run db:push

db-migrate:
	@echo "Running database migrations..."
	@npm run db:migrate

db-studio:
	@echo "Opening database studio..."
	@npm run db:studio

# Utility Commands
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist/
	@rm -rf node_modules/.cache/
	@rm -rf .vite/

logs:
	@echo "Viewing application logs..."
	@tail -f logs/app.log 2>/dev/null || echo "No log files found"

test:
	@echo "Running tests..."
	@curl -f http://localhost:5000/api/test || echo "Server not running"

# Quick deployment
deploy: build docker-build docker-start
	@echo "Deployment complete!"

# Development workflow
workflow: setup install dev
	@echo "Development workflow started!"