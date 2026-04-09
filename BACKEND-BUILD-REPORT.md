# Backend Build Report — Micro Sites

Projeto: micro-sites
Stack: Static Site Factory (scripts Bash + TypeScript build-time)
Data: 2026-04-09

---

## Nota Arquitetural

Este projeto **não tem backend runtime**. A arquitetura é 100% estática:
- Lógica de build em **Node.js/Next.js** (build-time)
- Lógica de conversão em **JavaScript client-side** (browser)
- Sem servidor, sem banco de dados, sem autenticação

O `/back-end-build` foi adaptado para gerar o **pipeline de automação** (scripts Bash + generate-og.ts), que é o equivalente ao "backend" desta arquitetura.

---

## Arquivos Gerados

### Scripts de Automação (5)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `scripts/create-site.sh` | Cria nova pasta `sites/{slug}/` a partir do `_template`. Valida formato do slug, infere categoria/template/funnel. |
| `scripts/build-site.sh` | Pipeline completo: valida config.json → `SITE_SLUG={slug} next build` → gera .htaccess → chama generate-og.ts |
| `scripts/deploy-branch.sh` | Checkout da branch `deploy-{NN}` (ou orphan), rsync do dist, commit e push. Lock file previne deploys paralelos. |
| `scripts/deploy-all.sh` | Orquestra build+deploy de N sites com filtros por categoria, wave ou slug. Relatório de erros ao final. |
| `scripts/generate-og.ts` | Gera OG image 1200×630 via Satori + @resvg/resvg-js. Lê config para cor, título e categoria. |
| `scripts/deploy-map.sh` | Mapeamento slug → branch de deploy (26 sites, deploy-01 a deploy-26). Sourced por deploy-all.sh. |

### Template de Site (7)

| Arquivo | Conteúdo |
|---------|---------|
| `sites/_template/config.json` | Config com placeholders `__SLUG__`, `__NOME_DO_SITE__`, `__CATEGORY__`. Substituídos por create-site.sh. |
| `sites/_template/content/problem.md` | Markdown stub com frontmatter `headline:` |
| `sites/_template/content/solution.md` | Markdown stub com frontmatter `headline:` |
| `sites/_template/content/features.json` | 3 features default com ícones Lucide |
| `sites/_template/content/how-it-works.json` | 3 passos numerados |
| `sites/_template/content/trust.json` | Stats (50+, 98%, 5★) + array de testimonials vazio |
| `sites/_template/content/faq.json` | 3 FAQs padrão |

### Modificações em Arquivos Existentes (1)

| Arquivo | Mudança |
|---------|--------|
| `next.config.ts` | `distDir` agora é dinâmico: `dist/${SITE_SLUG}` quando env var está definida, `dist` como fallback. Permite builds per-slug independentes. |

---

## Mapeamento de Deploy (deploy-map.sh)

| Slug | Branch | Categoria | Wave |
|------|--------|-----------|------|
| d01-calculadora-custo-site | deploy-01 | D | 1 |
| d02-calculadora-roi-digital | deploy-02 | D | 1 |
| d03-diagnostico-presenca-digital | deploy-03 | D | 1 |
| d04-quanto-custa-sistema | deploy-04 | D | 1 |
| d05-simulador-trafego-pago | deploy-05 | D | 1 |
| b01-sem-site-profissional | deploy-06 | B | 1 |
| b02-site-antigo-lento | deploy-07 | B | 1 |
| b03-sem-automacao | deploy-08 | B | 1 |
| b04-sem-presenca-digital | deploy-09 | B | 1 |
| b05-perder-clientes-online | deploy-10 | B | 1 |
| c01-site-institucional-pme | deploy-11 | C | 1 |
| c02-landing-page-conversao | deploy-12 | C | 1 |
| c03-app-web-negocio | deploy-13 | C | 1 |
| c04-ecommerce-pequeno-negocio | deploy-14 | C | 2 |
| c05-sistema-agendamento | deploy-15 | C | 2 |
| a01-clinicas-estetica | deploy-16 | A | 2 |
| a02-academia-crossfit | deploy-17 | A | 2 |
| a03-restaurante-delivery | deploy-18 | A | 2 |
| a04-pet-shop-veterinario | deploy-19 | A | 2 |
| a05-advocacia-familia | deploy-20 | A | 2 |
| a06-psicologia-online | deploy-21 | A | 3 |
| e01-ia-para-pequenos-negocios | deploy-22 | E | 2 |
| e02-automacao-whatsapp | deploy-23 | E | 2 |
| e03-site-com-ia | deploy-24 | E | 3 |
| f01-blog-desenvolvimento-web | deploy-25 | F | 3 |
| f02-blog-marketing-digital | deploy-26 | F | 3 |

---

## Dependências Pendentes

### Para gerar OG Images (generate-og.ts)

```bash
npm install satori @resvg/resvg-js
```

Estas dependências são **opcionais** — build-site.sh verifica se estão instaladas e pula a geração de OG image com warning se não estiverem. O site é publicado normalmente sem a og-image.png.

### Para paralelizar deploys (deploy-all.sh --parallel N)

```bash
# Ubuntu/Debian
sudo apt-get install parallel

# macOS
brew install parallel
```

---

## Como Usar

### Criar e deployar um site novo

```bash
# 1. Cria estrutura do site a partir do template
bash scripts/create-site.sh d01-calculadora-custo-site

# 2. Edita config e conteúdo
nano sites/d01-calculadora-custo-site/config.json
nano sites/d01-calculadora-custo-site/content/problem.md

# 3. Build (valida + compila + OG image)
bash scripts/build-site.sh d01-calculadora-custo-site

# 4. Deploy para branch Git
bash scripts/deploy-branch.sh d01-calculadora-custo-site deploy-01
```

### Deployar todos os sites de uma categoria

```bash
bash scripts/deploy-all.sh --category D
```

### Deployar Wave 1 completa (dry-run primeiro)

```bash
bash scripts/deploy-all.sh --wave 1 --dry-run
bash scripts/deploy-all.sh --wave 1
```

### Build local de preview (sem SITE_SLUG)

```bash
npm run dev  # Usa c01-site-institucional-pme como default
```

---

## Comportamentos de Segurança

| Comportamento | Onde |
|--------------|------|
| Lock file `/tmp/micro-sites-{branch}.lock` previne deploys paralelos na mesma branch | deploy-branch.sh |
| Validação de slugs com regex `^[a-f][0-9]{2}-.+` antes de criar site | create-site.sh |
| Build aborta com exit 1 se config.json tem erros (slug incorreto, categoria inválida, URL inválida) | build-site.sh |
| Warnings (seo.title > 60 chars, placeholders não substituídos) não abortam o build | build-site.sh |
| .htaccess com X-Frame-Options, nosniff, Referrer-Policy, HTTPS redirect, Cache-Control | build-site.sh |
| rsync --delete garante estado limpo na branch de deploy (idempotente) | deploy-branch.sh |
| git diff --cached verifica mudanças antes de commitar (evita commits vazios) | deploy-branch.sh |
| --force-with-lease em vez de --force para push (mais seguro) | deploy-branch.sh |
| Trap EXIT para cleanup do lock mesmo em caso de erro | deploy-branch.sh |

---

## Próximos Passos

1. `npm install satori @resvg/resvg-js` — habilitar geração de OG images
2. Configurar Git deploy no Hostinger para cada slot (branch `deploy-NN`)
3. Criar e preencher o site piloto: `bash scripts/create-site.sh d01-calculadora-custo-site`
4. Validar pipeline end-to-end: create → build → deploy-branch → verificar no Hostinger
5. `/env-creation` — se necessário (este projeto não tem .env de runtime)
6. `/auto-flow execute` — implementar lógica dos templates de calculadora (Cat. D)
