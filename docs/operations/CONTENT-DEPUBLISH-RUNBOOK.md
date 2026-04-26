# Content Depublish Runbook

**Owner:** Pedro Corgnati
**Idempotency:** `depublish-{site}-{article}-{YYYY-MM-DD}`
**Vincula:** `scripts/depublish-article.ts`, `sites/_template/.htaccess.template`

---

## Quando despublicar

| Motivo | Acao |
|--------|------|
| Conteudo legalmente problematico (DMCA, plagio) | IMEDIATO |
| Duplicado canibalizando palavra-chave | Sim, apos validar via GSC |
| Desatualizado ha >12 meses sem refresh viavel | Considerar refresh antes |
| Baixo desempenho (<5 sessoes/mes em 6m) | Apenas se nao recuperavel |
| Violacao de politica E-E-A-T | Sim |

## Pre-checks

1. **Backlinks externos**: rodar `npx tsx scripts/audit-network-footprint.ts --site=<slug>` para identificar URLs externas apontando para o artigo
2. **Conteudo de redirect**: identificar artigo top-performer da mesma categoria como destino do 301 (default: `/blog`)
3. **Confirmar autoria**: garantir que despublicar nao apaga atribuicoes legais
4. **Snapshot Wayback**: solicitar snapshot via `archive.org/wayback/available` se relevante

## Procedimento

### 1. Executar script
```bash
npx tsx scripts/depublish-article.ts \
  --site=a01-vertical-x \
  --article=titulo-do-artigo \
  --reason="duplicate-canibal" \
  --dry-run

# Validar output. Se OK, rodar sem --dry-run:
npx tsx scripts/depublish-article.ts \
  --site=a01-vertical-x \
  --article=titulo-do-artigo \
  --reason="duplicate-canibal"
```

O que acontece:
- `sites/{site}/blog/{slug}.md` -> `sites/{site}/blog/.archived/{slug}.md` (frontmatter `archivedAt` + `archivedReason`)
- Remove entrada em `sites/{site}/blog-index.json`
- Adiciona `Redirect 301 /blog/{slug} /blog` em `sites/{site}/.htaccess`
- Roda `bash scripts/build-site.sh {site}` (regenera sitemap.xml)

### 2. Pos-checks

- [ ] Validar 301 em prod: `curl -I https://dominio/blog/{slug}` -> esperar `301 Location: /blog`
- [ ] Validar `sitemap.xml` nao mais lista a URL
- [ ] GSC > Removals > submit URL para remocao temporaria
- [ ] Monitorar 404 em GA4 por 30 dias
- [ ] Atualizar interlinking (`scripts/apply-cross-wave-links.ts`)

### 3. Rollback

```bash
# Restaurar de .archived
mv sites/{site}/blog/.archived/{slug}.md sites/{site}/blog/{slug}.md

# Reverter .htaccess (remover linha de Redirect)
sed -i '/Redirect 301 \/blog\/{slug}/d' sites/{site}/.htaccess

# Re-adicionar a blog-index.json (manualmente ou re-run generator)
npx tsx scripts/generate-blog-index.ts

# Rebuild
bash scripts/build-site.sh {site}
```

## Auditoria

Cada despublicacao gera log em `logs/depublish/{YYYY-MM-DD}-{site}-{slug}.json` (TODO se script for estendido). Por enquanto, registrar em PR description.

## Comunicacao

- Se artigo tinha autoria externa, notificar autor com 48h antecedencia
- Se artigo tinha backlinks externos com trafego significativo, comunicar parceiros via email
