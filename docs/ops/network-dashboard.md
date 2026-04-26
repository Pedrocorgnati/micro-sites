# Network Dashboard — Micro Sites

**Gerado em:** pendente primeira execucao de `npm run ops:dashboard`
**Fontes:** config/sites-monitoring.json, config/analytics-export.json

## Visao

Dashboard agregado dos 36 sites com metricas por onda e categoria. Este arquivo e **regenerado** automaticamente — nao editar manualmente.

## Como atualizar

1. Exportar GA4 (ultimos 30d) para `config/analytics-export.json` com shape:
   ```json
   { "slug-do-site": { "sessions30d": 1234, "cvr": 0.018, "avgPosition": 12.4, "lastRefresh": "2026-03-15", "status": "ok" } }
   ```
2. Rodar `npm run ops:dashboard`.
3. Abrir PR com o diff.

## Documentos relacionados

- [refresh-playbook.md](./refresh-playbook.md) — como refrescar um site.
- [raci-matrix.md](./raci-matrix.md) — papeis e responsabilidades.

> Primeira geracao automatica sera feita apos integracao com o exportador GA4.
