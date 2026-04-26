# Makefile — Targets para desenvolvimento local
# Gerado por /dev-bootstrap-create (SystemForge)
# Uso: make [target]

.PHONY: help setup reset dev test health docker-down docker-clean

help:
	@echo "Targets disponiveis:"
	@echo "  setup            Setup inicial do ambiente local"
	@echo "  reset            Limpar e resetar tudo"
	@echo "  dev              Inicia servidor de desenvolvimento"
	@echo "  test             Roda suite de testes"
	@echo "  health           Verifica saude do ambiente"
	@echo "  docker-down      Para os servicos Docker"
	@echo "  docker-clean     Remove containers, volumes e dados"

setup:
	@./scripts/bootstrap.sh

reset:
	@./scripts/bootstrap.sh --reset

dev:
	npm run dev

test:
	npm test

health:
	@./scripts/bootstrap.sh --health

docker-down:
	docker compose down

docker-clean:
	docker compose down -v
