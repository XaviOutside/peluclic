.PHONY: dev up down logs seed migrate prod prod-up prod-down prod-build prod-logs

# ──────────────────────────────────────────────────────────────
# Development Environment
# ──────────────────────────────────────────────────────────────

dev:          ## Start development environment (build + up)
	docker compose up -d --build

up:           ## Start development environment without rebuild
	docker compose up -d

down:         ## Stop development environment
	docker compose down

logs:         ## Tail development logs (api, db, app)
	docker compose logs -f

seed:         ## Run database seed
	docker compose exec api npx prisma db seed

migrate:      ## Run pending migrations
	docker compose exec api npx prisma migrate deploy

# ──────────────────────────────────────────────────────────────
# Production Environment
# ──────────────────────────────────────────────────────────────

prod-build:   ## Build production images (no cache)
	docker compose -f docker-compose.prod.yml build --no-cache

prod-up:      ## Start production environment
	docker compose -f docker-compose.prod.yml up -d

prod-down:    ## Stop production environment
	docker compose -f docker-compose.prod.yml down

prod-logs:    ## Tail production logs
	docker compose -f docker-compose.prod.yml logs -f

prod-seed:    ## Run seed in production
	docker compose -f docker-compose.prod.yml exec api npx prisma db seed

prod-migrate: ## Run migrations in production
	docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

prod-restart: ## Restart production API (zero-downtime if behind load balancer)
	docker compose -f docker-compose.prod.yml restart api

# ──────────────────────────────────────────────────────────────
# Utility
# ──────────────────────────────────────────────────────────────

help:         ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
