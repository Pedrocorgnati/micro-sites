# CI — Micro Sites

## Lighthouse Gate

Gate bloqueante per-site com thresholds diferenciados por categoria.

### Thresholds

| Categoria | Perf | A11y | SEO | BP | Metrica extra |
|-----------|------|------|-----|-----|----------------|
| A, B, C, E, F | ≥ 0.95 | ≥ 0.95 | ≥ 0.95 | ≥ 0.90 | LCP<2.5s, CLS<0.1, TBT<200ms |
| D (calculadoras/diagnosticos) | ≥ 0.85 | ≥ 0.95 | ≥ 0.95 | ≥ 0.90 | INP<200ms, CLS<0.1 |

### Arquivos

- `lighthouserc.json` — config base (A/B/C/E/F, 95+)
- `lighthouserc-d.json` — config D (85+ + INP<200ms)
- `scripts/lighthouse-gate.ts` — runner por site (detecta categoria, seleciona config)
- `scripts/lighthouse-batch.sh` — batch em modo gate (`GATE=1`)
- `.github/workflows/lighthouse-ci.yml` — CI em PRs para `main` e pushes em `deploy-*`

### Execucao local

```bash
# Single site
npx tsx scripts/lighthouse-gate.ts d01-calculadora-custo-site

# Todos os sites (local dist/)
GATE=1 bash scripts/lighthouse-batch.sh
```

### Execucao CI

O workflow `lighthouse-ci.yml`:
1. Checkout + `npm ci`
2. `bash scripts/build-all.sh` (gera `dist/{slug}/` por site)
3. `GATE=1 bash scripts/lighthouse-batch.sh` — falha se qualquer site < threshold da sua categoria
4. Upload de artifacts: `.lighthouseci/**` + `docs/LIGHTHOUSE-RESULTS.json`

PRs que reduzem performance sao bloqueados ate correcao.

### Gaps cobertos

- **CL-066** Lighthouse 90+ static → 95+/85+ gate
- **CL-143** LCP<2.5s, CLS<0.1, INP<200ms → thresholds per-metric
- **CL-222** Meta 95+/85+ → diferencial por categoria
- **CL-267** A/B/C/E/F 95+ → config base
- **CL-268** D 85+ INP<200ms → config dedicada D
