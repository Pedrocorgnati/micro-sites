# TASK-3: Relatório de Integrações Externas D01

> Gerado em: 2026-04-10  
> Site: `d01-calculadora-custo-site`  
> Pré-requisito: TASK-2 aprovada (site live no Hostinger)

---

## Resumo

| Integração | Status | Ação Necessária |
|------------|--------|-----------------|
| Static Forms | ⏳ PENDENTE | Criar endpoint + atualizar TOKEN no config.json |
| GA4 Custom Dimension | ✅ CODE OK | Criar dimensão `site_slug` no GA4 Admin |
| Search Console | ⏳ PENDENTE | Adicionar propriedade + submeter sitemap |
| UptimeRobot | ⏳ PENDENTE | Criar monitor HTTP GET após Hostinger live |

---

## 1. Static Forms (BLOQUEANTE)

### O que foi preparado (código)
- `config.json` → `cta.formEndpoint: "https://api.staticforms.xyz/submit"` (placeholder)
- `ContactFormBase.tsx` → POST para `formEndpoint` com `{name, email, phone, message, consent}`
- Fallback WhatsApp implementado se POST falhar

### Ação Manual Necessária

1. Acessar https://staticforms.xyz/dashboard
2. Login com credenciais da conta
3. Criar novo endpoint:
   - **Nome:** `D01 — Calculadora de Custo de Site`
   - **Email:** (email para receber leads)
   - **Assunto:** `[D01] Novo lead: {name}`
4. Copiar TOKEN gerado
5. Atualizar `sites/d01-calculadora-custo-site/config.json`:
   ```json
   "cta": {
     "formEndpoint": "https://api.staticforms.xyz/submit",
     "accessKey": "TOKEN_REAL_AQUI"
   }
   ```
   **Nota:** A chave de acesso deve ser enviada no campo `accessKey` do payload.
6. Rebuild + redeploy:
   ```bash
   bash scripts/build-site.sh d01-calculadora-custo-site
   bash scripts/deploy-branch.sh d01-calculadora-custo-site deploy-01
   ```
7. Testar: enviar formulário em `/contato` e verificar email recebido

### Verificação
```bash
# Teste real do endpoint
curl -X POST https://api.staticforms.xyz/submit \
  -H "Content-Type: application/json" \
  -d '{"accessKey":"TOKEN_REAL","name":"Test","email":"test@test.com","message":"Test lead D01","$honeypot":""}'
# Esperado: {"success":true,"message":""}
```

---

## 2. GA4 Custom Dimension `site_slug` (CÓDIGO PRONTO)

### O que foi preparado (código)
- `ContactFormBase.tsx` agora envia `site_slug: config.slug` no evento GA4:
  ```javascript
  gtag('event', 'contact_form_submit', {
    site_name: "Calculadora de Custo de Site",
    site_slug: "d01-calculadora-custo-site",   // ← ADICIONADO
    method: 'static_forms',
  });
  ```
- `GA4Loader.tsx` → carrega `gtag.js` condicionalmente após CookieConsent

### Ação Manual Necessária

1. Acessar Google Analytics 4 → Admin → Custom definitions
2. Criar nova dimensão:
   - **Nome:** `site_slug`
   - **Descrição:** `Identificador do site (d01-calculadora-custo-site, etc.)`
   - **Escopo:** Evento (Event-scoped)
3. Aguardar ativação (até 24h, geralmente < 1h)
4. Adicionar `gaId` no `config.json` do D01:
   ```json
   "gaId": "G-XXXXXXXXXX"
   ```
5. Rebuild + redeploy após adicionar `gaId`

### Verificação
```
GA4 → Reports → Realtime
→ Abrir https://D01_URL → verificar page_view com site_slug: "d01-calculadora-custo-site"
```

---

## 3. Google Search Console (APÓS DEPLOY HOSTINGER)

### Ação Manual Necessária

1. Acessar https://search.google.com/search-console
2. Adicionar propriedade (URL prefix):
   - URL: `https://D01_URL`
3. Verificar via meta tag (já incluída na configuração Next.js via `generateMetadata`)
4. Submeter sitemap:
   - URL: `https://D01_URL/sitemap.xml`
5. Aguardar status "Success"

### Verificação
```bash
curl -I https://D01_URL/sitemap.xml
# Esperado: HTTP 200
```

---

## 4. UptimeRobot (PÓS-LAUNCH)

### Ação Manual Necessária

1. Acessar https://uptimerobot.com/dashboard
2. Criar novo monitor:
   - **Tipo:** HTTP(s)
   - **URL:** `https://D01_URL`
   - **Intervalo:** 5 minutos
   - **Alerta:** email + Slack (se configurado)
3. Verificar que monitor aparece como "UP"

---

## 5. Checklist Final de Integrações

- [ ] Static Forms TOKEN configurado em `config.json`
- [ ] Lead teste enviado e recebido no email
- [ ] GA4 `gaId` configurado em `config.json`
- [ ] GA4 custom dimension `site_slug` criada
- [ ] GA4 evento `contact_form_submit` verificado com `site_slug`
- [ ] Search Console propriedade verificada
- [ ] Sitemap submetido com status OK
- [ ] UptimeRobot monitor ativo

---

## Pipeline Completo (Após Integrações)

```
code (main) → build-site.sh → dist/ → deploy-branch.sh → deploy-01 → Hostinger
                                                                    ↓
                                                    Leads → Static Forms → Email
                                                    Analytics → GA4 (post-consent)
                                                    SEO → Search Console + Sitemap
                                                    Monitoring → UptimeRobot
```

**Status:** Código D01 completo e deployado. Integrações dependem de ações manuais externas.
