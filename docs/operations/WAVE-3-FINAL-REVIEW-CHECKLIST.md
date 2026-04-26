# Wave 3 Final Review Checklist

**Versao:** v1.0 (2026-04-25 — TASK-27 ST001 / CL-463)
**Quando rodar:** apos completar Onda 3 (ultima leva de sites em producao)
**Owner:** Pedro Corgnati

> Esta e a checklist exaustiva pos-onda-3 que confirma que a rede esta
> "saudavel" antes de declarar producao estavel. Cada item linka para o
> script/runbook canonico.

---

## 1. Cobertura tecnica (todos os 36 sites em producao)

- [ ] Todos os 36 dominios apontam para Hostinger (DNS apex + www)
- [ ] SSL valido em todos: `npx tsx scripts/ssl-expiry-watch.ts`
- [ ] Smoke pos-deploy passa em todos: `BASE_URL=... npx tsx scripts/smoke-post-deploy.ts`
- [ ] OG images valida em dist/: `npx tsx scripts/audit-og-images.ts`
- [ ] Nenhum CDN third-party de fontes: `npx tsx scripts/audit-third-party-fonts.ts`
- [ ] Markdown image refs OK: `npx tsx scripts/audit-markdown-image-refs.ts`
- [ ] Schemas JSON-LD validos: `npx tsx scripts/validate-schemas-rich-results.ts`

## 2. Cobertura SEO

- [ ] Sitemaps submetidos no GSC: `npx tsx scripts/gsc-submit-sitemaps.ts`
- [ ] Todos os 36 sites verificados no GSC: `output/reports/gsc-properties-status.md`
- [ ] Indexacao status: rodar `npx tsx scripts/gsc-indexing-watch.ts` e exigir >=80% sites com 1+ pag indexada
- [ ] Robots.txt sem `Disallow: /` acidental: `curl https://{dominio}/robots.txt`
- [ ] Canonical URLs corretas: amostra de 5 sites no `view-source` deve ter `<link rel="canonical">`

## 3. Cobertura de blog

- [ ] Volume blog na meta por categoria: `npx tsx scripts/audit-blog-volume.ts`
- [ ] Conteudo unico (sem duplicacao cross-site): `npx tsx scripts/refresh-duplication-gate.ts`
- [ ] Frontmatter valido: `npx tsx scripts/audit-frontmatter.ts`
- [ ] Heading hierarchy correta: `npx tsx scripts/audit-headings-hierarchy.ts`
- [ ] Cross-wave interlinking aplicado: `output/cross-wave-report.json` com 0 falhas

## 4. Cobertura de Conversao

- [ ] CTAs presentes em todas as pages: `npx tsx scripts/audit-cta-presence.ts`
- [ ] Forms passam por circuit breaker: tested in `circuit-breaker.test.ts`
- [ ] Calculadoras Cat D funcionam (teste manual em D01-D05)
- [ ] WhatsApp button visivel em mobile + desktop
- [ ] Sentry capturando errors em Cat D (verificar dashboard)

## 5. Cobertura LGPD/Compliance

- [ ] PrivacyPolicy + Terms + Cookies acessiveis em todos os 36
- [ ] CookieConsent renderiza apos 1s e respeita `12m` retention (TASK-18)
- [ ] LGPD-SLA quantificado publicado: `docs/compliance/LGPD-SLA.md` v1.1+
- [ ] DSR runbook usavel: `docs/compliance/DATA-SUBJECT-REQUEST-RUNBOOK.md`
- [ ] ROPA assinado disponivel: `docs/compliance/ROPA-SIGNED-{Q}.pdf` (manual Pedro)
- [ ] PII audit em GA4 events passou: `npx tsx scripts/audit-ga4-pii.ts`

## 6. Cobertura de Operacoes

- [ ] UptimeRobot monitors em todos os 36 + threshold 2 falhas: `setup-uptime-monitors.sh` rodado
- [ ] Lighthouse mensal automatico: workflow `lighthouse-ci.yml` ativo + cron
- [ ] Security headers audit: `npx tsx scripts/audit-security-headers.ts` em producao
- [ ] SF backup semanal funcionando: ultimo PR aberto < 7 dias
- [ ] Branch ID reconciliation OK: `npx tsx scripts/audit-branch-ids.ts`
- [ ] Monitoring snapshot commitado: `config/monitoring-snapshot.json` atualizado

## 7. Cobertura de KPIs (vide TASK-27 ST002)

- [ ] KPI 1 — 30% sites com pelo menos 1 keyword em 1a pag GSC: `kpi-tracker.ts` reporta >= 11 sites
- [ ] KPI 2 — 20+ leads/m: SF dashboard mensal > 20
- [ ] KPI 3 — 2-3 projetos fechados/m: `data/projects-closed.json` (manual)
- [ ] Alert configurado se KPI <50% por 2 meses (vide kpi-monthly.yml)

## 8. Cobertura de equipe & seguranca

- [ ] 2FA habilitado em todos os colaboradores: workflow `2fa-enforcement-audit.yml`
- [ ] Token rotation em dia: `list-credentials-age.ts` reporta 0 tokens >180d
- [ ] Dev junior offboarding template usado se aplicavel: DEV-JUNIOR-OFFBOARDING
- [ ] CODEOWNERS respeitado em PRs (verificar 5 PRs recentes)

## 9. Cross-checks finais

- [ ] Pedro consegue responder qualquer pedido LGPD em < 24h (drill em ticket sintetico)
- [ ] Hostinger storage <70%: `monitor-hostinger-storage.ts`
- [ ] Build CI <15min para shared change (avg 5 runs)
- [ ] Custo mensal real <= BUDGET.md previsao

## 10. Sign-off

Apos todos os 9 grupos OK:

```bash
# Tag de release
git tag -a wave-3-complete -m "Wave 3 final review passed — all 36 sites in producao"
git push origin wave-3-complete

# Documentar em PROGRESS
echo "Wave 3 sign-off: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> docs/operations/WAVE-HISTORY.md

# Comunicar publicamente (LinkedIn — vide LINKEDIN-PLAN-F01-F02.md)
```

## Cadencia recomendada

- Pos-deploy de cada onda (1, 2, 3): rodar checklist parcial (so se aplica a sites daquela onda)
- Pos-onda-3 (este doc): rodar exhaustivo
- Trimestral: re-rodar items 1-6 como health-check

## Versionamento

- v1.0 (2026-04-25) — TASK-27 ST001: 9 grupos + 50+ checks
