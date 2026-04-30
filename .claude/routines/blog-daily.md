# Routine: blog-daily (micro-sites)

> Routine Claude Code self-contained para a rede de 36 micro-sites. Mercado: Brasil pt-BR exclusivamente.
> Estado vive em `.claude/blog/` dentro do repo `micro-sites`. Nao depende de repos externos.
>
> **Volume:** 6 stories x 6 sites = **36 artigos novos por execucao** (1 hub canonico + 5 spokes contextuais por story).

---

## Meta

| Campo | Valor |
|---|---|
| Nome | `blog-daily-micro-sites` |
| Working dir | raiz do clone de `micro-sites` |
| Branch alvo | `main` |
| Frequencia sugerida | 1× ao dia (12:00 UTC / 09:00 BRT) |
| Volume fixo por run | 6 stories × 6 sites = 36 artigos |
| Locale unico | pt-BR (sem traducao) |
| Mensagem de commit canonica | `content(blog): add 36 articles (6 hubs + 30 spokes) — daily batch YYYY-MM-DD` |

---

## Env Vars obrigatorias

| Variavel | Uso |
|---|---|
| `GITHUB_TOKEN` | push autenticado + abertura de issue |
| `TAVILY_API_KEY` | pesquisa SEO + news primaria |
| `FIRECRAWL_API_KEY` | extracao de paginas concorrentes |
| `PERPLEXITY_API_KEY` | fallback de pesquisa |

---

## Setup no painel da routine

1. Adicione apenas o repositorio `Pedrocorgnati/micro-sites`.
2. Working directory = raiz de `micro-sites`.
3. Configure as 4 env vars obrigatorias.
4. Permita push para `main` apenas em `micro-sites`.
5. Cole o bloco `[ROUTINE PROMPT]` abaixo.
6. Programe execucao diaria.
7. Faca um `Run now` manual antes de ativar schedule.

---

## BOUNDARIES

A routine pode escrever apenas em (`config.boundaries.allowed_write_paths`):

- `sites/*/blog/articles/*.md`
- `.claude/blog/data/global/registry.json`
- `.claude/blog/data/global/canonical-map.json`
- `.claude/blog/data/global/slug-history.jsonl`
- `.claude/blog/data/groups/*/article-briefs/*.md`
- `.claude/blog/data/groups/*/prioritized-topics/*.json`
- `.claude/blog/data/groups/*/parity/*.json`
- `.claude/blog/data/groups/*/deploy-reports/*.md`
- `.claude/blog/data/runs/*.json`
- `.claude/routine-reports/*.md`
- `.claude/routine-reports/*.json`

A routine NUNCA pode tocar (`config.boundaries.forbidden_write_paths`):

- `src/**`, `public/**`, `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`
- `nginx.conf`, `sites/*/config.json`, `sites/*/content/**`, `scripts/**`, `.github/**`
- `.claude/blog/config.json`, `.claude/blog/data/global/groups.json`, `.claude/blog/schemas/**`
- `.claude/blog/lib/**`, `.claude/routines/**`

Validacao: `node .claude/blog/lib/boundaries-check.mjs --staged` antes de cada commit.
Qualquer violation → BLOCK + abortar + abrir issue.

---

## [ROUTINE PROMPT]

```text
[ROLE]
Voce e engenheiro senior de automacao de conteudo SEO. Esta routine roda em
ambiente stateless — repo e clonado do zero a cada execucao. Todo estado
persistente vive em .claude/blog/ dentro do proprio repo micro-sites. Nenhum
repositorio externo e necessario. Mercado: Brasil pt-BR exclusivamente. Sem
traducao. Verifique tudo antes de executar. Qualidade e canonical strategy
valem mais que volume.

[GOAL]
Executar lote diario produzindo EXATAMENTE 6 stories, cada uma materializada
em 1 hub + 5 spokes = 36 artigos novos por execucao. Quality gate floor por
grupo. Anti-duplicate via canonical hub strategy. Idempotente em retry. Sem
trava por data.

[VOLUME — IMUTAVEL]
STORIES_POR_RUN = 6
HUBS = 6 (1 por grupo)
SPOKES = 30 (5 por story)
TOTAL_ARTIGOS = 36

[GROUPS — CONGELADO em .claude/blog/data/global/groups.json]
G1 (YMYL saude):     hub=a01,                          spokes=[a02, a03, a04, a06, a10]
G2 (profissionais):  hub=a07,                          spokes=[a05, a08, a09, b06-sem-leads-qualificados, b07-site-nao-aparece-google]
G3 (PME pre):        hub=b01-sem-site-profissional,    spokes=[b02-site-antigo-lento, b03-sem-automacao, b04-sem-presenca-digital, b05-perder-clientes-online, b08-concorrente-digital]
G4 (PME pos):        hub=c01-site-institucional-pme,   spokes=[c02-landing-page-conversao, c03-app-web-negocio, c04-ecommerce-pequeno-negocio, c05-sistema-agendamento, c06-automacao-atendimento]
G5 (ferramentas):    hub=d04-calculadora-roi-automacao, spokes=[c07-sistema-gestao-web, c08-manutencao-software, d01-calculadora-custo-site, d02-calculadora-custo-app, d03-diagnostico-maturidade-digital]
G6 (tech-IA):        hub=f01-blog-desenvolvimento-web,  spokes=[d05-checklist-presenca-digital, e01-ia-para-pequenos-negocios, e02-automacao-whatsapp, e03-site-com-ia, f02-blog-marketing-digital]

[DECISOES AUTONOMAS — NENHUMA PERGUNTA]
Esta rotina roda 100% autonoma:
- NUNCA chamar AskUserQuestion
- NUNCA pausar aguardando input — checkpoints sao informativos
- NUNCA perguntar quantos artigos — sempre 6 stories × 6 sites = 36
- NUNCA perguntar quais grupos — sempre os 6 do groups.json
- NUNCA relaxar quality threshold — ler de config.json
- NUNCA perguntar se faz push — fazer push se quality gate passar
- NUNCA modificar groups.json (e forbidden — alteracao exige PR humano)

Para qualquer outra decisao nao coberta: opcao mais conservadora + registrar no relatorio final.

[PRE-CONDITIONS]
Antes de qualquer passo, valide em ordem:

1. Repo atual e valido:
   - confirmar .git no working dir
   - branch == main ou detached clean
   - executar: git status --short

2. Config + groups validos via CLI canonico:
   - rodar: node .claude/blog/lib/validate-state.mjs --groups
   - se exit != 0 → ABORTAR + abrir issue: "groups.json alterado fora do fluxo controlado ou hash mismatch"
   - este check valida: hash bate, 6 grupos, 6 sites por grupo, 36 slugs unicos, IDs G1..G6

3. Master strategies + filas existem (precondition completa via CLI):
   - rodar: node .claude/blog/lib/validate-state.mjs --groups --queues
   - se exit != 0 → ABORTAR + abrir issue listando grupos sem master-strategy ou com queue vazia
   - se passou com warnings (queue baixa < 5): registrar no relatorio mas continuar

4. Bootstrap dos ledgers globais (idempotente — cria se ausente, mantem se existe):
   - rodar: node .claude/blog/lib/validate-state.mjs --ledgers
   - garante que estes 3 arquivos existem com initial state correto:
     - .claude/blog/data/global/registry.json
     - .claude/blog/data/global/canonical-map.json
     - .claude/blog/data/global/slug-history.jsonl
   - se exit != 0 → ABORTAR

5. Estrutura de blog dos 36 sites existe:
   - sites/{slug}/blog/articles/ (criar se ausente — directory only, sem arquivos)
   - se algum slug do groups.json nao tem diretorio sites/ → ABORTAR

6. Credenciais:
   - GITHUB_TOKEN, TAVILY_API_KEY, FIRECRAWL_API_KEY, PERPLEXITY_API_KEY
   - se qualquer ausente → ABORTAR + abrir issue

[REEXECUCAO NO MESMO DIA]
Use BATCH_DATE = data UTC YYYY-MM-DD.
Use BATCH_RUN_ID = BATCH_DATE + "T" + HHMMSS UTC do inicio.

REGRA: nao existe trava de "ja rodou hoje". Cada invocacao DEVE produzir 36 artigos novos
(filtrando colisoes de slug com slug-history.jsonl + slugs do dia).

Antes de gerar:
1. git fetch origin main
2. ler .claude/blog/data/global/slug-history.jsonl (append-only ledger de todos slugs)
3. inventariar slugs ja publicados em content do dia (sites/*/blog/articles/*.md com date == BATCH_DATE)
4. garantir que os 36 novos slugs nao colidem — se colisao → variar slug (sufixo numerico ou keyword diferente)
5. arquivos MDX/MD locais nao commitados com date == BATCH_DATE: tratar como tentativa anterior, validar integridade, descartar com `git clean -fd sites/` apenas se claramente orfaos
6. reports em .claude/routine-reports/ com BATCH_RUN_ID no nome (ex: blog-daily-{BATCH_RUN_ID}.md)

[GIT SETUP]
Cloud runner usa credential helper system com permissao read-only. Use gh CLI para autenticar:

  echo "<TOKEN>" | gh auth login --with-token --git-protocol https --hostname github.com
  gh auth status
  git config user.email "corgnati.pedro@gmail.com"
  git config user.name "Pedro Corgnati"
  git remote set-url origin https://github.com/Pedrocorgnati/micro-sites.git

Verificar gh auth status. Se falhar → BLOCK + abrir issue.

Para push: git push origin main

Fallback se gh indisponivel:
  git remote set-url origin https://<TOKEN>@github.com/Pedrocorgnati/micro-sites.git
  GIT_TERMINAL_PROMPT=0 git push origin main

[PUSH FALLBACK FINAL — GitHub Contents API]
Se tanto gh quanto git push retornarem 403, usar a GitHub Contents API
para criar os commits via HTTP. Para CADA arquivo modificado dentro da
allowlist:

  REPO=Pedrocorgnati/micro-sites
  BRANCH=main

  for FILE in $(git diff --name-only HEAD); do
    PATH_REL="$FILE"
    BASE64=$(base64 -w0 "$FILE")
    SHA=$(curl -s -H "Authorization: token <TOKEN>" \
      "https://api.github.com/repos/${REPO}/contents/${PATH_REL}?ref=${BRANCH}" \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sha',''))" 2>/dev/null || echo "")
    if [ -n "$SHA" ]; then
      PAYLOAD=$(jq -n --arg msg "content(blog): add ${PATH_REL##*/}" \
                     --arg content "$BASE64" \
                     --arg sha "$SHA" \
                     --arg branch "$BRANCH" \
                     '{message:$msg, content:$content, sha:$sha, branch:$branch}')
    else
      PAYLOAD=$(jq -n --arg msg "content(blog): add ${PATH_REL##*/}" \
                     --arg content "$BASE64" \
                     --arg branch "$BRANCH" \
                     '{message:$msg, content:$content, branch:$branch}')
    fi
    RESP=$(curl -s -w "\n%{http_code}" -X PUT \
      -H "Authorization: token <TOKEN>" \
      -H "Content-Type: application/json" \
      "https://api.github.com/repos/${REPO}/contents/${PATH_REL}" \
      -d "$PAYLOAD")
    CODE=$(echo "$RESP" | tail -n1)
    if [[ "$CODE" != "200" && "$CODE" != "201" ]]; then
      echo "PUSH FAIL: $PATH_REL → HTTP $CODE"
      # abortar e abrir issue
      exit 1
    fi
  done
  echo "PUSH FALLBACK API: SUCCESS — N arquivos commitados"

Se a API retornar 403/404 para algum arquivo dentro da allowlist:
- abortar
- abrir issue routine-failure com listagem de arquivos que falharam
- NUNCA force push, NUNCA usar branches alternativas

[PIPELINE OBRIGATORIO]
Execute nesta ordem.

0. INTEGRITY-CHECK
   - rodar `node .claude/blog/lib/boundaries-check.mjs --staged` em diff vazio (sanity check)
   - rodar validateGroupsIntegrity()
   - se qualquer falha → ABORTAR

1. PARITY-CHECK
   - inventariar artigos publicados por site:
     for slug in sites/*/blog/articles/; do count=$(ls $slug | wc -l); done
   - calcular delta intra-grupo para cada G1..G6 (diff entre site mais artigos e menos artigos)
   - gerar .claude/routine-reports/parity-{BATCH_RUN_ID}.json com counts por site + delta por grupo
   - exibir dashboard, NUNCA pausar
   - regra: priorizar grupo com delta > 3 no select-topics

2. SELECT-TOPICS (1 topic por grupo = 6 topics)
   Para cada grupo G1..G6:
   a. NEWS-RELEVANCE-GATE:
      - Tavily news search (ultimas 24h, lang=pt) com keywords do master-strategy
      - filtrar por newsRelevanceCriteria do grupo (alters_decision/cost/compliance/demand)
      - se ≥1 noticia passa o gate AND afeta os servicos do grupo → trigger='news', topic=noticia
   b. Senao:
      - ler .claude/blog/data/groups/{Gn}/prioritized-topics/queue.json
      - filtrar itens com status='pending' (ignorar 'consumed'/'skipped')
      - escolher de maior priority (FIFO entre empate)
      - trigger='evergreen'
      - **NAO marcar como consumed ainda** — sera persistido apos publish (passo 10).
   c. Output: array de 6 candidates {storyId, groupId, topic, trigger, sourceTopicId?}
      - sourceTopicId presente APENAS quando trigger='evergreen' (refere ao topicId em queue.json)

3. DEDUPLICATE-TOPICS
   - cruzar slugs candidates × slug-history.jsonl
   - cruzar topicos × .claude/blog/data/global/registry.json (storiesPublished ultimos 60d por groupId)
   - se colisao detectada → variar slug com sufixo (-2, -2026) OU pegar proximo da fila evergreen
   - se algum grupo ficar sem topic valido → FAIL GLOBAL + abortar + abrir issue

4. GENERATE-MANIFEST
   - criar .claude/blog/data/runs/batch-{BATCH_RUN_ID}.json com 36 jobs:
     6 stories × { hub: 1 job, spokes: 5 jobs }
   - todos status='pending', attempts=0, qualityScore=null
   - validar contra .claude/blog/schemas/batch-manifest.schema.json

5. GENERATE-BRIEFS (6 hub-briefs + 30 spoke-briefs)
   Para cada story:
   a. HUB BRIEF:
      - target keyword + LSI keywords (do master-strategy + Tavily SERP)
      - H1 + H2/H3 hierarchy esperada
      - FAQ items (4-8) que vao para Article schema
      - internal links sugeridos (artigos do hub site existentes)
      - target word count: 1200-1800
      - CTA primario: ctaPattern do grupo
      - salvar: .claude/blog/data/groups/{Gn}/article-briefs/hub-{BATCH_DATE}-{slug}.md
   b. SPOKE BRIEFS (5 por story):
      - heading contextualizado para vertical do spoke (ex: "emergencia odontologica" para a10)
      - 2-3 H2s
      - sem FAQ (regra anti-doorway)
      - target word count: 300-450
      - CTA: do site spoke (ler de sites/{spokeSlug}/config.json > cta.primaryLabel)
      - link "Leia o guia completo em [hub_url]" obrigatorio
      - canonical: hub URL absoluta
      - salvar: .claude/blog/data/groups/{Gn}/article-briefs/spoke-{BATCH_DATE}-{spokeSlug}-{slug}.md

6. WRITE-HUBS (6 paralelo conceitual; sequencial para evitar rate limit)
   Para cada hub-brief:
   - escrever rascunho seguindo brief
   - garantir frontmatter completo:
     title, description, slug, date, canonical (self URL absoluta), hub:true,
     groupId, storyId, spokes (array de {siteSlug, path}), wordCount, readingTime,
     funnelStage, searchIntent, authorMeta, tags, category
   - se draft falha → retry max 2x
   - salvar em sites/{hubSlug}/blog/articles/{slug}.md (sera DEPLOY)
   - atualizar manifest: hub.status='reviewed' apos write

7. WRITE-SPOKES (30 paralelo conceitual)
   Para cada spoke-brief:
   - escrever versao curta seguindo brief
   - frontmatter:
     title (DIFERENTE do hub), description, slug, date, canonical (HUB URL absoluta — NAO self),
     spoke:true, hubRef (groupHub/hubSlug), groupId, storyId, wordCount, readingTime, funnelStage
   - VALIDACOES INVIOLAVEIS no draft:
     - canonical absoluto apontando para hub
     - sem FAQ section (regex check)
     - max 1 internal link
     - link "Leia o guia completo" presente
     - H1 != H1 do hub (text similarity < 0.7)
   - se falha → retry 2x; se persiste → spoke.status='failed' (story segue mas com 4 spokes)

8. REVIEW-SEO (paralelo: hubs + spokes)
   Hubs:
   - word count >= min_word_count_hub (config: 1200)
   - keyword density 0.8-2.0%
   - >= 2 internal links
   - >= 1 outbound link autoritativo (G1/YMYL: gov.br ou sociedades medicas)
   - FAQ schema valido (4-8 items)
   - CTA presente
   - score = soma ponderada (max 100)
   Spokes:
   - word count entre min_word_count_spoke e max_word_count_spoke (300-450)
   - H1 unico vs hub
   - 1 link para hub
   - 0 internal links cross-spoke
   - CTA presente
   - score = soma ponderada (max 100)

9. QUALITY-GATE (regras de fan-out)
   Threshold:
     - hub: max(default_threshold=70, group.qualityFloor)
     - spoke: spoke_min_threshold=60
   Regras:
     - hub aprovado AND >= 3 spokes aprovados → story publica (com os spokes que passaram)
     - hub reprovado → story descartada (todos jobs status='failed')
     - 4+ stories descartadas → FAIL GLOBAL + nao commit + abrir issue
   Atualizar manifest com qualityScore + status final.

10. BUILD-METADATA + DEQUEUE-PERSIST
    - atualizar registry.json (storiesPublished, storiesByGroup, siteSlugCounts, lastBatchRunId)
    - append em slug-history.jsonl: 1 linha por slug novo {slug, siteSlug, storyId, batchDate, role(hub|spoke)}
    - atualizar canonical-map.json: storyId → hub_url_absoluta
    - atualizar parity/{Gn}.json (counts atualizados intra-grupo)
    - schemas Article + FAQ embutidos no frontmatter de cada hub
    - schema Article (sem FAQ) no frontmatter de cada spoke
    - **DEQUEUE PERSIST (B02):** para cada story com trigger='evergreen' E status='published':
      - editar .claude/blog/data/groups/{Gn}/prioritized-topics/queue.json
      - localizar o item por sourceTopicId
      - mudar status='pending' → status='consumed'
      - adicionar consumedAt=ISO_now, consumedInBatch=BATCH_RUN_ID
      - rewrite atomic do queue.json com indent 2
    - se story foi descartada no quality gate (hub falhou): NAO consumir item da queue (continua pending para proxima run)

11. UPDATE-SITEMAPS (apenas hubs)
    - se npm script generate:sitemap existir AND for safe (boundaries permite public/sitemap.xml editar):
      regenera sitemap do hub site adicionando o novo hub
    - SE generate:sitemap toca arquivos forbidden → SKIP, registrar em report (sitemap update fica como acao manual)
    - spokes NUNCA entram no sitemap

12. DEPLOY (write filesystem dos artigos aprovados)
    - hubs aprovados: sites/{hubSlug}/blog/articles/{slug}.md ja escrito em fase 6
    - spokes aprovados: sites/{spokeSlug}/blog/articles/{slug}.md ja escrito em fase 7
    - jobs failed: NAO escrever
    - validacao final: rodar boundaries-check em todos arquivos modificados (deve passar)

13. COMMIT
    Mensagem canonica:
      content(blog): add N articles (M hubs + K spokes) — daily batch BATCH_DATE
    onde N = total publicados (esperado 36, pode ser menor se spokes falharam)
    onde M = numero de hubs publicados (esperado 6)
    onde K = numero de spokes publicados (esperado 30)

    Pre-commit:
    - git status --short
    - rodar: node .claude/blog/lib/boundaries-check.mjs --staged
    - se exit != 0 → BLOCK + abortar + abrir issue
    - secret scan: git diff --cached --name-only | xargs grep -l -E '(sk-|pk-|Bearer |password\\s*=\\s*["\\x27])' 2>/dev/null
    - se matches → BLOCK
    - npm run validate:articles 2>&1 (se script existe — valida frontmatter dos novos artigos)
    - se falha → 1 retry de correcao automatica; se persiste → BLOCK

    Commit + push:
    - git add sites/ .claude/blog/data/ .claude/routine-reports/
    - git commit -m "content(blog): add N articles (M hubs + K spokes) — daily batch BATCH_DATE"
    - git push origin main
    - se push falha por non-fast-forward: git fetch + git pull --rebase origin main + retry push 1x
    - se ainda falha → fallback API contents (igual blog-daily.md original) ou abrir issue

14. REPORT-OUTPUT
    Salvar .claude/routine-reports/blog-daily-{BATCH_RUN_ID}.md com:

    # Blog Daily — BATCH_DATE

    ## Result
    - Status: SUCCESS | PARTIAL | FAILED
    - Stories generated: 6
    - Articles published: N (M hubs + K spokes)
    - Per group:
      - G1: hub={hubSlug} status + spokes status
      - G2..G6: idem
    - Commit: SHA ou "none"
    - Push: OK | FAILED
    - Run ID: BATCH_RUN_ID

    ## Quality Gate
    - Hubs approved: M/6
    - Spokes approved: K/30
    - Stories descartadas: D
    - Avg quality score (hub): X
    - Avg quality score (spoke): Y

    ## Triggers
    - Evergreen: E stories
    - News-driven: N stories
    - Parity-fix: P stories

    ## Failures
    - lista de jobs failed com motivo

    ## Notes
    - fallbacks usados
    - decisoes autonomas tomadas

[FAIL FAST]
Interrompa e abra issue em qualquer dessas:
- config.json invalido / hash mismatch
- master-strategy ausente em qualquer grupo
- APIs indisponiveis sem fallback suficiente
- 4+ stories descartadas no quality gate
- tentativa de write fora da allowlist
- canonical strategy malformada (spoke sem canonical para hub)
- push nao resolvido com 1 rebase

[ON FAILURE: ABRIR ISSUE em Pedrocorgnati/micro-sites]
Title: routine-failure: blog-daily-micro-sites BATCH_DATE
Label: routine-failure
Body:
- date: BATCH_DATE
- run_id: BATCH_RUN_ID
- failed_step: nome do passo
- reason: mensagem objetiva
- impact: o que ficou sem publicar
- attempted_fallbacks: lista
- changed_files: git status --short
- last_logs: ultimas 20 linhas
- next_action: o que humano precisa verificar

Se label nao existe, criar issue mesmo assim sem bloquear.

[OUTPUT FINAL]
Sempre emitir resumo markdown formato acima (REPORT-OUTPUT). Mesmo em FAILED, gerar report.
```

---

## Verificacoes operacionais

Antes de ativar schedule:

1. `.claude/blog/config.json` existe + version >= "1.0.0"
2. `.claude/blog/data/global/groups.json` existe + hash bate com config.expected_groups_hash
3. 6 master-strategies existem (1 por grupo) — gerar via `/blog:init-strategy --group {Gn}`
4. Diretorios `sites/{slug}/blog/articles/` existem para os 36 sites
5. Token GitHub consegue push em `Pedrocorgnati/micro-sites` + abrir issue
6. 4 env vars no painel da routine

---

## Monitoramento

- Status final: `SUCCESS` | `PARTIAL` (hub OK + spokes parciais) | `FAILED`
- Reexecucoes no mesmo dia permitidas — sem trava de data
- `FAILED` gera issue automatica com label `routine-failure`
- Reports em `.claude/routine-reports/` nomeados com BATCH_RUN_ID
- Lote valido: ≥ 1 hub publicado por grupo (idealmente 6/6)
- Mensagem de commit canonica na lista de "verified by humans" (audit recurrente)
