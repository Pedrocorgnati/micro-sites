# D01 — Production URL Registry

**Site slug:** `d01-calculadora-custo-site`
**Categoria:** D (Ferramenta — calculadora)
**Branch deploy:** `deploy-01`
**Versao:** v1.0 (2026-04-25 — TASK-16 ST004)

> Este documento e o registro canonico da URL publica de D01 (primeiro site Cat D
> ao vivo) e da evidencia Lighthouse atual. Vincula `BUDGET.md`, `INTAKE.md` e
> validacao do gap CL-343.

---

## URL publica

**Producao:** _<a definir — preencher apos primeiro deploy real>_

**Status:** PENDENTE — domino real ainda nao apontado para producao Hostinger.
Vide `PENDING-ACTIONS.md` bloco `d01-production-url-2026-04`.

Ate la, validacao usa subdominio:
- **Staging:** `https://d01-calculadora-custo-site.staging.example.com` _(placeholder)_

## Lighthouse score atual

**Ultima auditoria:** `output/reports/lighthouse-monthly/{YYYY-MM}.md`

| Categoria | Score | Threshold |
|---|---|---|
| Performance | _pendente primeira auditoria producao_ | 85 (Cat D) |
| Accessibility | - | 85 |
| SEO | - | 90 |
| Best Practices | - | 90 |

Lighthouse mensal automatico: workflow `.github/workflows/lighthouse-ci.yml`
(cron `0 3 1 * *`). Relatorio anexo no PR mensal.

## Smoke check

Apos deploy, smoke automatico em `.github/workflows/deploy.yml` valida:

- `/` 200 + HTML
- `/privacidade`, `/termos`, `/cookies`, `/contato` — 200 + HTML
- `/quanto-custa`, `/diagnostico` — 200 (Cat D)
- `/resultado` — 200 (se leadMagnet enabled)

Manual:
```bash
DOMAIN_TEMPLATE='https://{slug}.example.com' \
SLUGS_FILTER=d01 \
npx tsx scripts/smoke-post-deploy.ts
```

## Screenshot da home

Anexar `docs/operations/screenshots/d01-home-{YYYY-MM}.png` apos cada deploy
de marco mensal. Fluxo:

```bash
# Capturar local apos build:
npx playwright install chromium
SITE_SLUG=d01-calculadora-custo-site bash scripts/build-site.sh
npx http-server dist/d01-calculadora-custo-site -p 4173 -s &
npx playwright screenshot --viewport-size=1280,720 --full-page \
  http://localhost:4173 docs/operations/screenshots/d01-home-$(date +%Y-%m).png
kill %1
```

## Historico de releases

| Data | Versao/SHA | Highlights | Lighthouse Perf |
|---|---|---|---|
| 2026-04-25 | TASK-16 register | Doc inicial (sem URL real ainda) | n/a |

---

## Acoes humanas pendentes

Vide `PENDING-ACTIONS.md` bloco `d01-production-url-2026-04`:

- [ ] Apontar dominio real para deploy-01 no Hostinger
- [ ] Configurar SSL (Let's Encrypt automatico)
- [ ] Registrar URL publica neste arquivo + `sites/d01.../config.json` campo `siteUrl`
- [ ] Rodar primeira auditoria Lighthouse contra producao real e atualizar tabela
- [ ] Registrar o dominio no GSC (vide GSC-AUTOMATION.md bulk-verify)
- [ ] Configurar Uptime monitor (UPTIME-MONITORING.md)
- [ ] Tirar screenshot e anexar
