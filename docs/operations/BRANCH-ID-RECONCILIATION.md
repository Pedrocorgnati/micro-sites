# Branch ID Reconciliation

**Versao:** v1.0 (2026-04-25 — TASK-23 ST003)
**Vincula:** `scripts/deploy-map.sh`, `scripts/audit-branch-ids.ts`, `INTAKE-CHECKLIST.md`

> Este documento registra a decisao final sobre divergencias entre os IDs de
> branch (`deploy-NN`) mencionados no INTAKE-CHECKLIST e o `scripts/deploy-map.sh`
> autoritativo. Quando o auditor (`audit-branch-ids.ts`) reporta divergencia,
> este e o local para documentar a resolucao.

---

## Princípio canonico

`scripts/deploy-map.sh` e a **fonte da verdade** operacional. INTAKE-CHECKLIST e
documento estrategico — quando divergir, o INTAKE deve ser atualizado para
refletir o deploy-map, NAO o contrario.

Excecao: se a divergencia indicar erro real no deploy-map (slug deploy errado para
o domino atual), corrigir o deploy-map e fazer migration de branch — vide
"Procedimento de re-numeracao" abaixo.

## Divergencias conhecidas

Audit baseline rodado em 2026-04-25:

| Slug | INTAKE menciona | deploy-map atual | Decisao | Acao tomada |
|---|---|---|---|---|
| d03-diagnostico-maturidade-digital | (CL-358 menciona deploy-12) | deploy-03 | **Manter deploy-03** | INTAKE-CHECKLIST atualizar (P3) |
| d04-calculadora-roi-automacao | (CL-362 menciona deploy-24) | deploy-04 | **Manter deploy-04** | INTAKE atualizar |
| d05-checklist-presenca-digital | (CL-367 menciona deploy-32) | deploy-05 | **Manter deploy-05** | INTAKE atualizar |
| f01-cases-digitais | (CL-389) | deploy-XX (verificar) | rodar audit | aplicar acao |
| f02-* | (CL-390) | deploy-XX (verificar) | rodar audit | aplicar acao |

Para audit atualizado:

```bash
npx tsx scripts/audit-branch-ids.ts
cat output/reports/branch-ids-audit-*.md
```

## Procedimento de re-numeracao (raro — apenas se deploy-map errado)

1. Pausar deploys (deploy lock — `npx tsx scripts/dev-deploy-lock.ts acquire`)
2. Criar nova branch `deploy-NEW` a partir do commit atual de `deploy-OLD`
3. Push para remoto: `git push origin deploy-NEW`
4. Editar `scripts/deploy-map.sh` substituindo `deploy-OLD` por `deploy-NEW` para o slug
5. Rodar `npx tsx scripts/audit-branch-ids.ts` para confirmar zero divergencia
6. Reapontar Hostinger (HPanel -> Git -> trocar branch ativa para `deploy-NEW`)
7. Apos validar deploy: `git push origin --delete deploy-OLD`
8. Liberar lock: `npx tsx scripts/dev-deploy-lock.ts release`

## Procedimento de update INTAKE (caso comum — INTAKE divergente)

1. Identificar entrada(s) divergentes em `INTAKE-CHECKLIST.md`
2. Editar a referencia para refletir o branch real
3. Commit `docs(intake): align deploy-NN with deploy-map.sh`
4. Re-rodar audit para confirmar zero divergencia

## Cron de auditoria

Recomendado adicionar `audit-branch-ids` ao cron mensal (ex: dia 1 de cada mes
no workflow `audit-noscript-monthly.yml` ou similar). Por ora rodar manualmente.

## Versionamento

- v1.0 (2026-04-25) — TASK-23 ST003: princípio canonico + divergencias conhecidas + procedimentos
