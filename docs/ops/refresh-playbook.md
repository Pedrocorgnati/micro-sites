# Playbook — Refresh de Site

**Origem:** Intake Review — CL-276, CL-295

Runbook para refresh de site na rede de 36 micro-sites.

## 1. Deteccao (trigger)

Um site entra em fila de refresh quando **qualquer** destes criterios for verdade:

- Posicao media Google caiu >= 5 posicoes em 30d.
- CVR < 1% por 2 meses consecutivos.
- Mais de 90 dias sem atualizacao de conteudo.
- Sinais qualitativos: copy outdated, claim quebrado, stat sem fonte.

Fonte de verdade: `docs/ops/network-dashboard.md` (coluna Status).

## 2. Priorizacao

| Tier  | Criterio                                  | SLA refresh |
|-------|-------------------------------------------|-------------|
| P0    | CVR < 0.5% ou posicao > 30                | 7 dias      |
| P1    | Onda atual ativa + queda >= 5 posicoes    | 14 dias     |
| P2    | Onda 2 (sites medio-trafego)              | 30 dias     |
| P3    | Onda 3 (sites cauda-longa)                | 60 dias     |

## 3. Refactor

1. Abrir branch `refresh/<slug>-<YYYYMM>`.
2. Atualizar `sites/<slug>/content/` (copy, stats com fonte+data).
3. Regenerar OG: `npm run generate-og -- <slug>`.
4. Atualizar `config.json` (datas, CTAs se mudaram).
5. Se houver mudanca de header/variante: `scripts/migrate-header-variant.ts`.

## 4. Revalidar (gates obrigatorios)

- [ ] `npm run audit:contacts` PASS
- [ ] `npm run audit:animations` PASS
- [ ] `npx tsx scripts/audit-content-uniqueness.ts` PASS
- [ ] `npx tsx scripts/audit-headings-hierarchy.ts` PASS
- [ ] `npx tsx scripts/audit-cta-presence.ts` PASS (pos-build)
- [ ] `npx tsx scripts/audit-noscript.ts` PASS (pos-build)
- [ ] `npx tsx scripts/lighthouse-gate.ts <slug>` PASS
- [ ] LGPD/stat-claims audits PASS
- [ ] E2E `e2e/whatsapp-button.spec.ts` PASS

## 5. Redeploy

1. Branch `deploy-<NN>` (numero da onda) acumula refreshes.
2. Merge para `main` via PR com Lighthouse report attached.
3. `./scripts/deploy-all.sh` ou `./scripts/deploy-branch.sh <branch>`.
4. Pos-deploy: executar `docs/qa/whatsapp-fallback-test.md` amostralmente.
5. Monitorar GA4/GSC por 7 dias e registrar resultado no dashboard.

## 6. Rollback

Se regressao observada:
- `git revert <sha>` no main.
- Redeploy imediato.
- Documentar em `docs/DEPLOY-ROLLBACK-RUNBOOK.md` com causa raiz.
