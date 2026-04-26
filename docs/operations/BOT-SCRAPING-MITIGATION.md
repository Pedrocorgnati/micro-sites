# Bot Scraping Mitigation — Plano em 3 fases

**Versao:** v1.0 (2026-04-25 — TASK-25 ST003 / CL-192, CL-587)
**Vincula:** `sites/_template/.htaccess.template`, TASK-21 (security headers), HoneypotField

> Estrategia incremental para mitigar scraping/bots em rotas Cat D
> (`/quanto-custa`, `/diagnostico`, `/resultado`, `/simulador`) onde
> calculadoras geram leads valiosos e rate de scraping >5% impacta dados.

---

## Fase 1 — `.htaccess` (curto prazo, ATIVA)

Implementada em `sites/_template/.htaccess.template` (TASK-25 ST002):

### Rate limiting via mod_evasive

```apache
<IfModule mod_evasive20.c>
  DOSPageCount 30          # max 30 req/min na mesma URL
  DOSSiteCount 100         # max 100 req/min em todo o site
  DOSPageInterval 60
  DOSSiteInterval 60
  DOSBlockingPeriod 600    # bloqueia 10min apos hit
  DOSEmailNotify footstockbr@gmail.com
</IfModule>
```

**Status:** depende de Hostinger Shared ter `mod_evasive` habilitado. Se nao tiver, bloco e silenciosamente ignorado. **PENDING-ACTIONS:** validar via SSH `apache2ctl -M | grep evasive`.

### User-Agent blacklist

```apache
RewriteCond %{HTTP_USER_AGENT} (semrush|ahrefs|mj12bot|petalbot|dotbot|seokicks) [NC]
RewriteRule ^(quanto-custa|diagnostico|resultado|simulador) - [F,L]
```

Bloqueia 6 crawlers SEO conhecidos por scraping agressivo nas rotas
"caras" (Cat D). Outros crawlers legitimos (Googlebot, Bingbot) continuam
livres porque nao estao na lista.

**Atualizar:** revisar lista trimestral. Adicionar User-Agents novos detectados em logs.

---

## Fase 2 — Cloudflare (medio prazo, RECOMENDADO ao migrar)

**Trigger:** quando rede atingir 30+ leads/mes ou logs Hostinger mostrarem
spike de IPs estrangeiros consistente (>50 req/h de mesmo /24).

### Setup Cloudflare Free

1. Apontar DNS (NS) para Cloudflare
2. Habilitar "Bot Fight Mode" (free tier)
3. Habilitar "Challenge Solve" para rotas Cat D via Page Rules:
   - URL pattern: `*meudominio.com.br/quanto-custa*`
   - Setting: Browser Integrity Check ON, Security Level High
4. Adicionar Turnstile captcha invisivel em forms (depende migrar SF -> Web3Forms — vide FORMS-FALLBACK-PLAN)

### Cloudflare Workers (avancado, opcional)

Para Cat D sites com >30 leads/m e detection de scraping persistente:
- Worker que injeta delay artificial 100-300ms em /quanto-custa
- Geo-blocking se nicho e Brasil-only (bloquear non-BR IPs em rotas calc)

**Custo:** Free para uso atual; $5/m por dominio se ultrapassar Workers free tier (10M req/m).

---

## Fase 3 — Honeypot + JS challenge (LONGO PRAZO, ja ATIVO em forms)

### Honeypot ja ativo

`src/components/forms/HoneypotField.tsx` ja implementado em todos os forms.
Bots tipicos preenchem todos campos visible+hidden -> drop silencioso.

### JS challenge (futuro)

Em sites com >50 leads/m onde bots passem por honeypot, adicionar:
- Token JS gerado no client side (validado no server via webhook SF custom)
- Time-to-fill check (form submetido em <2s = bot)

Status: nao implementado. Trigger: detection de spam >5% em audits manuais mensais.

---

## Detection — quando subir para fase superior

| Sinal | Fase recomendada | Acao |
|---|---|---|
| Logs Hostinger mostram 1 IP >100 req/h em /quanto-custa | Fase 1 reforcada | Adicionar IP em deny |
| 5+ User-Agents diferentes batendo em loop | Fase 2 | Subir Cloudflare |
| Spam em forms apesar de honeypot | Fase 3 | JS challenge |
| Lighthouse Cat D <85 por carga de bots | Fase 2 imediata | Cloudflare cache + bot mode |

## Audit periodico

Mensal:
1. Logs Hostinger access — top 20 IPs em /quanto-custa
2. SF dashboard — taxa de spam vs leads validos
3. Avaliar se subir fase

```bash
# Conferir logs (apos SSH no Hostinger)
ssh -p 65002 user@host 'tail -10000 ~/logs/access.log | grep "/quanto-custa" | awk "{print \$1}" | sort | uniq -c | sort -rn | head -20'
```

## Acoes humanas pendentes

Vide PENDING-ACTIONS bloco `bot-scraping-2026-04`:

- [ ] SSH Hostinger para validar `mod_evasive` disponivel: `apache2ctl -M | grep -i evasive`
- [ ] Caso ausente: usar `mod_security` ou `mod_qos` se disponiveis; senao trocar para Cloudflare Free imediato
- [ ] Configurar email notify do mod_evasive (validar `footstockbr@gmail.com` em SMTP)
- [ ] Criar conta Cloudflare Free e mapear 1 dominio piloto (Cat D) antes de fase 2

## Versionamento

- v1.0 (2026-04-25) — TASK-25 ST003: 3 fases formalizadas com triggers
