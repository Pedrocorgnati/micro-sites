# Blog Daily — `.claude/blog/`

> Estado e libs da routine `blog-daily-micro-sites`.
>
> **Cadeia de docs (handoff):**
> 1. [`BLOG-DAILY-STRATEGY.md`](../../../../../scheduled-updates/micro-sites/BLOG-DAILY-STRATEGY.md) — estratégia + decisões P0
> 2. **README** (este arquivo) — setup operacional + estado atual
> 3. [`BLOG-DAILY-PROGRESS.md`](../../../../../scheduled-updates/micro-sites/BLOG-DAILY-PROGRESS.md) — status implementação
> 4. [`PENDING-ACTIONS.md`](../../../PENDING-ACTIONS.md) — checklist humano para go-live

## Estrutura

```
.claude/blog/
├── README.md                        # este arquivo
├── config.json                      # contrato global (versionado)
├── schemas/
│   ├── config.schema.json
│   ├── groups.schema.json
│   ├── batch-manifest.schema.json
│   ├── registry.schema.json
│   └── prioritized-topics.schema.json
├── lib/
│   ├── groups-loader.ts             # TS — load + validate integrity (hash)
│   ├── boundaries-check.mjs         # CLI — enforce write paths allowlist
│   ├── news-relevance-gate.ts       # TS — 4 critérios para news trigger
│   ├── validate-state.mjs           # CLI — wrapper para preflight da routine
│   └── smoke-test.mjs               # CLI — sanity check offline
├── data/
│   ├── global/
│   │   ├── groups.json              # 6×6 mapping CONGELADO (não editar fora de PR)
│   │   ├── registry.json            # ledger storiesPublished + counts
│   │   ├── canonical-map.json       # storyId → hub URL absoluta
│   │   └── slug-history.jsonl       # append-only, todos os slugs publicados
│   ├── groups/
│   │   ├── G1/   (saúde — YMYL)
│   │   ├── G2/   (profissionais liberais)
│   │   ├── G3/   (PME pré-digital)
│   │   ├── G4/   (PME pós-decisão)
│   │   ├── G5/   (ferramentas/avaliação)
│   │   └── G6/   (tech-curious + IA) — ÚNICO com master-strategy + queue inicial
│   │       ├── seeds/master-strategy.md
│   │       ├── prioritized-topics/queue.json
│   │       ├── article-briefs/      # gerado pela routine
│   │       ├── parity/              # gerado pela routine
│   │       └── deploy-reports/      # gerado pela routine
│   └── runs/                        # batch manifests por execução
└── (routine prompt em ../routines/blog-daily.md)
```

## Comandos úteis

```bash
# Preflight completo (groups + queues + ledgers bootstrap)
node .claude/blog/lib/validate-state.mjs

# Smoke test offline (8 checks)
node .claude/blog/lib/smoke-test.mjs

# Em modo strict (failha se master-strategy/queue ausente):
BLOG_SMOKE_STRICT=1 node .claude/blog/lib/smoke-test.mjs

# Boundaries check em arquivos arbitrários
node .claude/blog/lib/boundaries-check.mjs --files path1.md path2.md

# Boundaries check no diff staged (pre-commit)
node .claude/blog/lib/boundaries-check.mjs --staged

# Recompute do hash do groups.json (após PR validar mudança)
sha256sum .claude/blog/data/global/groups.json
# → atualizar manualmente .claude/blog/config.json > expected_groups_hash
```

## Estado atual

| Item | Status |
|------|--------|
| `config.json` v1.0.0 | ✅ |
| `groups.json` 6×6 (hash `4a81730e...`) | ✅ |
| TS loader + integrity validator | ✅ |
| 5 JSON Schemas | ✅ |
| Boundaries enforcement | ✅ (allow + forbid lists) |
| Routine prompt completo | ✅ `.claude/routines/blog-daily.md` |
| Master-strategy G6 (90 keywords) | ✅ |
| Master-strategy G1, G2, G3, G4, G5 | ⏳ pendente — gerar via `/blog:init-strategy --group {Gn}` |
| prioritized-topics G6 (10 itens — **abaixo do mínimo de 30 para go-live**) | ⚠️ subdimensionado |
| prioritized-topics G1..G5 (≥ 30 cada para go-live) | ⏳ pendente |
| Ledgers globais (registry, canonical-map, slug-history) | ✅ bootstrappados (vazios) |
| News-relevance-gate logic | ✅ |
| Smoke test (10 checks) | ✅ 10/10 pass |

## Próximos passos para go-live

> **Sequência obrigatória.** Cada passo é gate para o próximo. Não pular.

### Passo 1 — Validações iniciais (humanas)
- [ ] Revisar `groups.json` com Pedro (mapping 6×6 + hubs)
- [ ] Aprovar `BLOG-DAILY-STRATEGY.md`

### Passo 2 — Gerar master-strategies (G1..G5)
- [ ] `/blog:init-strategy --group G1` (saúde — atenção YMYL)
- [ ] `/blog:init-strategy --group G2` (profissionais)
- [ ] `/blog:init-strategy --group G3` (PME pré-digital)
- [ ] `/blog:init-strategy --group G4` (PME pós-decisão)
- [ ] `/blog:init-strategy --group G5` (ferramentas)

### Passo 3 — Gerar queues iniciais (≥30 itens por grupo)
**Threshold operacional:** mínimo 30 topics por queue antes do schedule. Com 1 consumo/dia/grupo, 30 = 30 dias de cobertura sem refresh.
- [ ] `/blog:expand-keywords --group G1` (verificar queue ≥ 30)
- [ ] `/blog:expand-keywords --group G2` (≥ 30)
- [ ] `/blog:expand-keywords --group G3` (≥ 30)
- [ ] `/blog:expand-keywords --group G4` (≥ 30)
- [ ] `/blog:expand-keywords --group G5` (≥ 30)
- [ ] **`/blog:expand-keywords --group G6`** — atual queue tem 10 itens, expandir para ≥ 30

### Passo 4 — Gates pré-schedule (obrigatórios)
- [ ] `node .claude/blog/lib/validate-state.mjs` retorna 0 erros (warnings de queue baixa OK aqui se acima de 30)
- [ ] `BLOG_SMOKE_STRICT=1 node .claude/blog/lib/smoke-test.mjs` retorna 10/10 com **0 warnings**
- [ ] `node .claude/blog/lib/boundaries-check.mjs --staged` em diff vazio retorna 0

### Passo 5 — Soft launch (2 grupos não-YMYL primeiro)
**Proteção de risco:** ativar antes G6 (tech) + G4 (PME pós-decisão), monitorar 7 dias antes de full launch.
- [ ] Setup routine no painel com `BLOG_DAILY_GROUPS_FILTER=G6,G4` env (se prompt suportar)
- [ ] **Alternativa simples:** mover queue.json dos grupos G1/G2/G3/G5 temporariamente para `queue.json.disabled` durante soft launch — routine vai pular grupos sem queue
- [ ] Run now manual e verificar 12 artigos publicados (2 hubs + 10 spokes)

### Passo 6 — Setup routine completa no painel
- Repo: `Pedrocorgnati/micro-sites`
- Working dir: raiz do repo
- Env vars: `GITHUB_TOKEN`, `TAVILY_API_KEY`, `FIRECRAWL_API_KEY`, `PERPLEXITY_API_KEY`
- Schedule: 1× ao dia 12:00 UTC
- Prompt: copiar bloco `[ROUTINE PROMPT]` de `.claude/routines/blog-daily.md`

### Passo 7 — Soft launch: monitorar 7 dias
- GSC `site:{hub_domain}/blog/` confirma indexação dos hubs
- GSC `site:{spoke_domain}/blog/` BAIXA indexação (esperado — canonical resolve)
- Console: zero "Google chose different canonical"
- Painel AdSense: hubs começam a registrar impressões em 3-7 dias

### Passo 8 — Full launch (após soft OK)
- Restaurar queues dos demais grupos
- Run now manual e verificar 36 artigos publicados (6 hubs + 30 spokes)
- Ativar schedule diário

## Boundaries

- **Allowlist:** `.claude/blog/data/{global/registry.json, global/canonical-map.json, global/slug-history.jsonl, groups/*/article-briefs/, groups/*/prioritized-topics/, groups/*/parity/, groups/*/deploy-reports/, runs/}`, `.claude/routine-reports/`, `sites/*/blog/articles/*.md`.
- **Forbidden:** `src/`, `public/`, `package.json`, `next.config.ts`, `nginx.conf`, `sites/*/config.json`, `.claude/blog/config.json`, `.claude/blog/data/global/groups.json`, `.claude/blog/schemas/`, `.claude/blog/lib/`, `.claude/routines/`.
- Toda execução roda `boundaries-check.mjs --staged` no pre-commit.

## Mudanças que exigem PR humano

- `config.json` (qualquer mudança)
- `groups.json` (qualquer mudança — bumpar `version` + recompute `expected_groups_hash`)
- `.claude/blog/schemas/*.json`
- `.claude/blog/lib/*.{ts,mjs}`
- `.claude/routines/blog-daily.md`

A routine **nunca** edita esses arquivos. Auditoria via `boundaries-check`.
