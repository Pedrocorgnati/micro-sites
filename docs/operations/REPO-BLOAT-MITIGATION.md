# Repo Bloat Mitigation — runbook

**Origem:** TASK-8 (intake-review) — gaps CL-070, CL-528-529
**Status:** Decisao recomendada — Opcao C + .gitattributes (curto prazo)

## Problema

O repo `micro-sites` mantem 36 branches `deploy-NN` (uma por site)
que recebem build estatico (~1-3 MB cada de assets versionados em
`dist/{slug}/`). Sem mitigacao, o repo cresce ~30-100 MB/onda.
Sintomas:
- `git clone` lento (>30s)
- diff/PR poluidos por bins
- GitHub mostra repo "majoritariamente" HTML/CSS por causa de `dist/`

## Opcoes consideradas

### Opcao A — Git LFS para PDFs/woff2
- **Pro:** sem mudanca de fluxo, transparente para dev
- **Contra:** Hostinger shared nao suporta LFS smudge; build CI precisa `git lfs pull`
- **Custo:** GitHub LFS free 1GB/mes (suficiente)
- **Veredito:** util para PDFs grandes mas adia o problema de branch bloat

### Opcao B — Repo `micro-sites-deploy` separado (drastica)
- **Pro:** elimina bloat do repo principal
- **Contra:** dois repos para manter sincronia, CI mais complexo, perde rastreabilidade source <-> deploy
- **Custo:** 1-2 dias para migrar
- **Veredito:** considerar se Opcao C nao for suficiente em 6 meses

### Opcao C — Archive tags + delete branches >90d (RECOMENDADA)
- **Pro:** mantem historico (tag `archive/deploy-XX-YYYY-MM`), reduz numero de branches ativas
- **Contra:** requer disciplina mensal (ou cron)
- **Custo:** baixo — `scripts/branch-cleanup.ts` automatiza
- **Veredito:** **adotar** + complementar com `.gitattributes` para diff/linguist

## Decisao

1. **Curto prazo (agora):** Opcao C + `.gitattributes`
2. **Cadencia:** rodar `scripts/branch-cleanup.ts --apply --threshold 90` no primeiro de cada mes (manual ate workflow)
3. **Reavaliar em 6 meses (2026-10):** se branches ativas > 50 ou clone >60s, migrar para Opcao B

## Procedimento operacional

### Limpeza mensal (1o de cada mes)

```bash
# Dry run
npx tsx scripts/branch-cleanup.ts

# Aplicar
npx tsx scripts/branch-cleanup.ts --apply
```

### Recuperar branch arquivada

```bash
# Listar tags archive
git tag -l 'archive/deploy-*'

# Restaurar branch a partir de tag
git checkout -b deploy-XX archive/deploy-XX-2026-04
git push -u origin deploy-XX
```

## Checklist PENDING-ACTIONS

Adicionar ao `PENDING-ACTIONS.md`:

- `repo-bloat-mitigation-mensal-2026`: rodar cleanup dia 1 de cada mes
- `repo-bloat-reavaliacao-2026-10`: revisar veredito Opcao B vs C
