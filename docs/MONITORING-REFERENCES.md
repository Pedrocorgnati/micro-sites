# MONITORING-REFERENCES — Auditoria de Integrações

> Criado por: module-13-monitoramento/TASK-0/ST006  
> Última atualização: 2026-04-12  
> Próxima revisão: 2026-07-12

---

## Mapa de Integrações por Arquivo

| Arquivo | Guardrails Referenciados | Blueprint | Status |
|---------|-------------------------|-----------|--------|
| `docs/MONITORING-ARCHITECTURE.md` | PERF-005, PERF-001, INFRA-006 | monitoring-alerting.md | ✓ |
| `docs/MONITORING-RUNBOOK.md` | PERF-005, PERF-001, INFRA-006 | — | ✓ |
| `config/sites-monitoring.json` | PERF-005, PERF-001, INFRA-006 | — | ✓ |
| `config/SITES-REGISTRY.md` | INFRA-006 | — | ✓ |
| `scripts/validate-sites-health.sh` | INFRA-006 | — | ✓ |
| `scripts/setup-uptime-monitors.sh` | INFRA-006 | — | ✓ |
| `scripts/lighthouse-monthly.sh` | PERF-005 | — | ✓ |
| `docs/MONITORING.md` | PERF-005, PERF-001, INFRA-006 | — | ✓ |

---

## Guardrails Requeridos

| ID | Arquivo | Existe? | Caminho |
|----|---------|---------|---------|
| PERF-005 | lighthouse-ci-threshold.md | ✓ | `ai-forge/guardrails/performance/lighthouse-ci-threshold.md` |
| PERF-001 | core-web-vitals.md | ✓ | `ai-forge/guardrails/performance/core-web-vitals.md` |
| INFRA-006 | uptime-monitoring.md | ☐ | `ai-forge/guardrails/infrastructure/uptime-monitoring.md` — **CRIAR** |

> **Ação necessária:** INFRA-006 (`uptime-monitoring.md`) não existe no repositório.  
> Criar `ai-forge/guardrails/infrastructure/uptime-monitoring.md` com regras de SLA ≥ 99.9%.  
> Ver PENDING-ACTIONS.md para detalhes.

---

## Blueprint Requerido

| Blueprint | Existe? | Caminho |
|-----------|---------|---------|
| monitoring-alerting.md | ☐ | `ai-forge/blueprints/monitoring-alerting.md` — **CRIAR** |

> **Ação necessária:** Blueprint `monitoring-alerting.md` não existe.  
> Criar com padrões de monitoramento para farm de sites estáticos.

---

## Componentes de Código Reutilizados

| Componente | Path no Workspace | Origem | Usado em |
|------------|------------------|--------|---------|
| GA4Loader | `src/components/lgpd/GA4Loader.tsx` | module-2/TASK-5 | Todos os 36 sites via layout.tsx |
| WebVitalsReporter | `src/components/lgpd/WebVitalsReporter.tsx` | module-2/TASK-5 | Todos os 36 sites via layout.tsx |
| CookieConsent | `src/components/lgpd/CookieConsent.tsx` | module-2/TASK-5 | Todos os 36 sites via layout.tsx |
| GA4_MEASUREMENT_ID | `src/types/index.ts` | module-1/TASK-1 | GA4Loader, sites-monitoring.json |

---

## Validação de Consistência de Thresholds

| Guardrail | Threshold Definido | Implementado em | Consistente? |
|-----------|-------------------|-----------------|--------------|
| PERF-005 | Performance ≥ 90 | sites-monitoring.json (cat A-C, E-F) | ✓ |
| PERF-005 | Performance ≥ 85 (Cat. D) | sites-monitoring.json (cat D) | ✓ (exceção documentada) |
| PERF-001 | LCP ≤ 2500ms | sites-monitoring.json (webvitals.lcp) | ✓ |
| PERF-001 | CLS ≤ 0.1 | sites-monitoring.json (webvitals.cls) | ✓ |
| PERF-001 | INP ≤ 200ms | sites-monitoring.json (webvitals.inp) | ✓ |
| INFRA-006 | Uptime ≥ 99.9% | setup-uptime-monitors.sh (2 falhas = 10 min) | ✓ |

---

## Histórico de Revisões

| Data | Autor | Mudança |
|------|-------|---------|
| 2026-04-12 | module-13/TASK-0 | Criação inicial — mapeamento de todas as integrações |

---

## Ações Pendentes (deste arquivo)

- [ ] **INFRA-006:** Criar `ai-forge/guardrails/infrastructure/uptime-monitoring.md`
- [ ] **monitoring-alerting:** Criar `ai-forge/blueprints/monitoring-alerting.md`
- [ ] **Próxima revisão:** 2026-07-12 — verificar novos guardrails criados após esta data
