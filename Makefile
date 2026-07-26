.PHONY: dev up down logs seed migrate prod prod-down prod-logs prod-restart

# ──────────────────────────────────────────────────────────────
# Development
# ──────────────────────────────────────────────────────────────

dev:          ## Start dev environment (build + up)
	docker compose up -d --build

up:           ## Start dev without rebuild
	docker compose up -d

down:         ## Stop dev environment
	docker compose down

logs:         ## Tail dev logs
	docker compose logs -f

seed:         ## Run database seed
	docker compose exec api npx prisma db seed

migrate:      ## Run pending migrations
	docker compose exec api npx prisma migrate deploy

# ──────────────────────────────────────────────────────────────
# Production
# ──────────────────────────────────────────────────────────────

prod:         ## Full production deploy (build + up + migrate + seed)
	docker compose -f docker-compose.prod.yml build --no-cache
	docker compose -f docker-compose.prod.yml up -d
	sleep 10
	docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
	docker compose -f docker-compose.prod.yml exec api npm run seed:prod

prod-down:    ## Stop production
	docker compose -f docker-compose.prod.yml down

prod-logs:    ## Tail production logs
	docker compose -f docker-compose.prod.yml logs -f

prod-restart: ## Restart production API
	docker compose -f docker-compose.prod.yml restart api

# ──────────────────────────────────────────────────────────────
# Help
# ──────────────────────────────────────────────────────────────

help:         ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
