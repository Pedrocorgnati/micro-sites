# Site Sunset Runbook

**Owner:** Pedro Corgnati
**Idempotency:** `sunset-{site}-{YYYY-MM}`
**Vincula:** `scripts/site-dormancy-watch.ts`, `config/dormancy-criteria.json`, `docs/operations/POST-12-MONTH-EVALUATION.md`

---

## Criterios objetivos para sunset

3 sinais (basta 2/3 simultaneos para acionar):

| Sinal | Threshold | Janela |
|-------|-----------|--------|
| Sessoes GA4 | < 50 | 30 dias |
| Impressoes GSC | < 5 | 30 dias |
| Leads (form/calc) | 0 | 6 meses |

Adicionalmente: conteudo nao mais relevante (mudanca de mercado, produto descontinuado, dominio perdeu sentido).

## Sequencia recomendada

1. **Trigger:** dormancy-watch marca `lifecycle.dormant: true`
2. **Avaliacao 12m** (`POST-12-MONTH-EVALUATION.md`): manter, refresh, sunset, migrar
3. Se `sunset` decidido -> seguir este runbook

## Pre-sunset

- [ ] Backup completo do dist em `archive/{slug}-{YYYY-MM}.tar.gz`
- [ ] Snapshot Wayback Machine
- [ ] Comunicar quaisquer leads recentes (rolling 12m) via email com aviso 30d
- [ ] Identificar top performer da MESMA categoria para receber redirect 301
- [ ] Documentar URLs de alta autoridade (backlinks) para preservar via 301
- [ ] PR `sunset/{slug}` com este checklist

## Sunset (execucao)

### 1. Configurar 301
```apache
# Em sites/{slug}/.htaccess
RewriteEngine On
RewriteRule ^(.*)$ https://{TOP_PERFORMER_DOMAIN}/$1 [R=301,L]
```

### 2. Remover do menu cross-wave
```bash
# Editar config/sites-monitoring.json — flag dormant ou remover
# Re-rodar:
npx tsx scripts/apply-cross-wave-links.ts
```

### 3. GSC
- Property > Settings > Remove Property (apos confirmacao 301 funcional por 7d)
- URL Removal > submit dominio inteiro

### 4. Branch & deploy
- Tag: `git tag sunset/{slug}-{YYYY-MM} && git push --tags`
- Branch: `git checkout -b archive/{slug}` -> ultimo commit antes do sunset
- Remover do `scripts/deploy-map.sh`
- Remover de `config/SITES-REGISTRY.md` (mover para secao "Sunset")

### 5. Hostinger
- Manter dominio ativo por 30 dias com 301
- Apos 30d: revogar SSL ou deixar expirar
- Apos 90d: liberar slot e dominio (se nao for renovado)

## Pos-sunset

- [ ] Monitor 404 em GA4 (top performer) por 30 dias
- [ ] Validar Google nao mostra mais site descontinuado em SERP (Site:)
- [ ] Atualizar BUDGET.md com economia (Hostinger slot, GSC property)
- [ ] PR review com Pedro

## Rollback

Antes do dia 90: dominio ainda ativo, basta:
1. Remover .htaccess RewriteRule
2. Restaurar deploy-map.sh
3. Re-adicionar a SITES-REGISTRY
4. Re-deploy

Apos dia 90: dominio liberado — nao recuperavel sem registro novo.
