# Monitoramento — Rede de 36 Sites

> Criado por: module-13-monitoramento/TASK-1/ST003 + TASK-2/ST003  
> Guardrails: INFRA-006, PERF-005, PERF-001  
> Última atualização: 2026-04-12

---

## 1. UptimeRobot — Monitoramento de Uptime

**Ferramenta:** UptimeRobot (free tier — suporta até 50 monitores)  
**Dashboard:** https://uptimerobot.com/dashboard  
**Total de monitores:** 36 (um por site, categorias A-F)  
**Intervalo de verificação:** 5 minutos  
**Alerta disparado após:** 2 falhas consecutivas = 10 minutos de downtime  
**Canal de alerta:** Email (Alert Contact: "Owner Alerts")  
**Alert Contact ID:** `${UPTIMEROBOT_ALERT_CONTACT_ID}` (configurado em `.env.local`)  
**SLA target:** ≥ 99.9% de uptime  
**Histórico disponível:** Últimos 90 dias no painel UptimeRobot  

### Configuração Inicial (Ações Manuais)

Execute nesta ordem:

```bash
# 1. Criar conta em https://uptimerobot.com (free tier)
#    → My Settings → Alert Contacts → Add Alert Contact
#    → Type: Email | Friendly Name: "Owner Alerts" | Email: seu@email.com
#    → Copiar o Alert Contact ID (numérico)

# 2. Gerar API Key em My Settings → API Settings → Add API Key (Read-Write)

# 3. Adicionar ao .env.local:
echo "UPTIMEROBOT_API_KEY=sua_key_aqui" >> .env.local
echo "UPTIMEROBOT_ALERT_CONTACT_ID=seu_id_aqui" >> .env.local

# 4. Verificar que todos os 36 sites estão vivos
./scripts/validate-sites-health.sh

# 5. Se todos OK, criar os 36 monitores automaticamente
./scripts/setup-uptime-monitors.sh

# 6. Verificar no dashboard que 36 monitores aparecem como "Up"
```

### Interpretar Alertas de Email

- **Assunto `Down: micro-sites-{slug}`:** site `{slug}` retornou HTTP ≠ 200 por > 10 min
  - Ação: ver seção 1 do `docs/MONITORING-RUNBOOK.md`
  
- **Assunto `Up: micro-sites-{slug}`:** site se recuperou automaticamente
  - Ação: registrar incidente em log; investigar causa raiz se recorrente

### Verificação de Saúde dos Monitores

```bash
# Listar todos os monitores ativos
curl -s "https://api.uptimerobot.com/v2/getMonitors" \
  -d "api_key=${UPTIMEROBOT_API_KEY}" | \
  jq '.monitors | length'
# Esperado: 36

# Listar monitores em estado "Down"
curl -s "https://api.uptimerobot.com/v2/getMonitors" \
  -d "api_key=${UPTIMEROBOT_API_KEY}" \
  -d "statuses=9" | \
  jq '[.monitors[] | .friendly_name]'
# Esperado: [] (lista vazia = tudo UP)
```

### Troubleshooting UptimeRobot

| Problema | Causa Provável | Solução |
|---------|---------------|---------|
| "Monitor creation failed" | API Key inválida | Gerar nova key em My Settings → API Settings |
| "Limit reached" | 50 monitores do free tier atingido | Deletar monitores antigos ou upgrade para plano pago |
| "Monitor offline" mas site 200 | Falso positivo por timeout de rede | Verificar no browser; adicionar retry no UptimeRobot settings |
| "Alert not received" | Email em pasta Spam | Adicionar noreply@uptimerobot.com à lista de contatos |

---

## 2. Google Analytics 4 (GA4)

**Property ID:** `${NEXT_PUBLIC_GA4_MEASUREMENT_ID}` (configurado em `.env.local`)  
**Implementação:** `GA4Loader` em `src/components/lgpd/GA4Loader.tsx` (module-2-shared-foundations)  
**Gate LGPD:** `CookieConsent` — GA4 carrega SOMENTE após `localStorage.cookie_consent === "accepted"`  
**Dimensão customizada:** `site_slug` — diferencia cada site na property compartilhada  
**Propriedade de privacidade:** `anonymize_ip: true` (configurado no GA4Loader)  

### Eventos Rastreados

| Evento | Quando | Propriedades |
|--------|--------|-------------|
| `page_view` | Automático por navegação | `page_path`, `site_slug` |
| `cta_click` | Clique no botão CTA principal | `cta_label`, `site_slug`, `category` |
| `whatsapp_click` | Clique em link/botão WhatsApp | `site_slug`, `category` |
| `form_submit` | Formulário enviado com sucesso | `form_type`, `site_slug` |
| `form_error` | Erro no envio do formulário | `error_code`, `site_slug` |
| `cookie_consent_accepted` | Visitante aceita cookies | `site_slug` |
| `web_vital` | Por page view (WebVitalsReporter) | `metric_name`, `value`, `rating`, `site_slug` |

> **LGPD:** Nenhum evento contém PII (nome, email, telefone, conteúdo de formulário).  
> Validar com: `grep -r "email\|phone\|name" src/components/` — nenhum match em eventos GA4.

### Segmentação por Categoria (GA4 → Explorar → Segmentos)

Criar 6 segmentos no painel GA4:

| Segmento | Condição |
|---------|---------|
| Categoria A — Nicho Local | `site_slug` STARTS WITH `a` |
| Categoria B — Dor de Negócio | `site_slug` STARTS WITH `b` |
| Categoria C — Serviço Digital | `site_slug` STARTS WITH `c` |
| Categoria D — Ferramenta | `site_slug` STARTS WITH `d` |
| Categoria E — Pré-SaaS | `site_slug` STARTS WITH `e` |
| Categoria F — Conteúdo | `site_slug` STARTS WITH `f` |

### Dashboard Recomendado (GA4 → Relatórios Personalizados)

**KPIs por segmento:**
- Taxa de conversão: `cta_click / page_view × 100`
- Taxa de abandono: `1 - (form_submit / cta_click)`
- Top páginas por category
- Web Vitals por `site_slug`: média de LCP, CLS, INP

### Troubleshooting GA4

| Problema | Solução |
|---------|---------|
| Eventos não aparecem no Real-time | Verificar CookieConsent consentimento; aguardar 1-10 segundos |
| `site_slug` errado nos eventos | Verificar `NEXT_PUBLIC_SITE_SLUG` no build script do site |
| GA4 não inicializa | Verificar `GA4_MEASUREMENT_ID` no .env e se é `NEXT_PUBLIC_` prefixed |
| CookieConsent não aparece | Verificar `localStorage.cookie_consent` — se `"accepted"`, banner não reaparece |

---

## 3. Web Vitals — Performance Monitoring em Produção

**Implementação:** `WebVitalsReporter` em `src/components/lgpd/WebVitalsReporter.tsx` (module-2)  
**Destino:** Google Analytics 4 (evento `web_vital`)  
**Métricas:** LCP, CLS, INP, FCP, TTFB  
**Gate LGPD:** Igual ao GA4 — só reporta se consentimento aceito  

### Thresholds de Alerta (monitorar no GA4)

| Métrica | Alvo | Alerta | Guardrail |
|---------|------|--------|-----------|
| LCP (Largest Contentful Paint) | ≤ 2500ms | > 4000ms | PERF-001 |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | > 0.25 | PERF-001 |
| INP (Interaction to Next Paint) | ≤ 200ms | > 500ms | PERF-001 |
| FCP (First Contentful Paint) | ≤ 1800ms | > 3000ms | — |
| TTFB (Time to First Byte) | ≤ 800ms | > 1800ms | — |

> **Cat. D (Ferramentas):** INP pode ser até 400ms com Calculator dinâmico.  
> Ver exceção documentada em `docs/MONITORING-RUNBOOK.md` § Exceções.

### Verificação de Web Vitals no GA4

```javascript
// Console DevTools: testar dispatch manual de evento (desenvolvimento)
window.gtag?.('event', 'web_vital', {
  metric_name: 'LCP',
  value: 1200,
  rating: 'good',
  site_slug: 'a01-test'
});
// Verificar em GA4 Real-time → Events → web_vital
```

---

## 4. Lighthouse CI — Auditoria Mensal

**Agendamento:** Dia 1 de cada mês às 08:00 (cron automático via `scripts/setup-cron.sh`)  
**Script:** `scripts/lighthouse-monthly.sh`  
**Sites auditados:** Amostra de 8 sites (1 representativo por categoria)  
**Amostra:** `a01, b01, c01, c06, d01, d03, e01, f01`  
**Relatórios:** `docs/lighthouse/{YYYY-MM}/lighthouse-{slug}.json`  
**Thresholds:** Performance ≥ 90, SEO ≥ 90, A11y ≥ 85 (Cat. D: Performance ≥ 85)  

### Configuração do Cron

```bash
# Instalar o cron job (executar uma vez)
./scripts/setup-cron.sh "$(pwd)"

# Verificar que foi instalado
crontab -l | grep lighthouse
# Esperado: 0 8 1 * * /path/to/scripts/lighthouse-monthly.sh >> /path/to/logs/lighthouse.log 2>&1

# Executar manualmente (qualquer momento)
./scripts/lighthouse-monthly.sh

# Ver relatório mais recente
ls -lt docs/lighthouse/$(date +%Y-%m)/
```

### Estrutura dos Relatórios

```
docs/lighthouse/
├── 2026-04/
│   ├── lighthouse-a01.json    # Relatório completo Lighthouse (>100KB)
│   ├── lighthouse-b01.json
│   ├── lighthouse-c01.json
│   ├── lighthouse-c06.json
│   ├── lighthouse-d01.json
│   ├── lighthouse-d03.json
│   ├── lighthouse-e01.json
│   └── lighthouse-f01.json
├── 2026-05/
│   └── ...
```

### Interpretar Relatório JSON

```bash
# Extrair scores de um relatório
cat docs/lighthouse/2026-04/lighthouse-a01.json | \
  node -e "
    const r = require('/dev/stdin');
    const cats = r.lhr?.categories || r.categories || {};
    Object.entries(cats).forEach(([k, v]) =>
      console.log(k + ': ' + Math.round(v.score * 100))
    );
  "
# Esperado:
#   performance: 95
#   seo: 97
#   accessibility: 92
#   best-practices: 100
```

### Troubleshooting Lighthouse

| Problema | Causa Provável | Solução |
|---------|---------------|---------|
| "Script não executável" | chmod ausente | `chmod +x scripts/lighthouse-monthly.sh` |
| "npx: not found" | Node.js não instalado | Instalar Node.js 20+ |
| "Relatório não gerado" | Site inacessível ou Chrome ausente | Verificar DOMAIN; instalar Chrome: `npx puppeteer browsers install chrome` |
| "Performance < 90" | Regressão de performance | Ver `docs/MONITORING-RUNBOOK.md` § 2 |

---

## 5. Google Search Console

**Tipo:** Monitoramento manual mensal  
**Acesso:** https://analytics.google.com → Search Console Integration  

### Verificações Mensais

- [ ] Verificar páginas indexadas por site (via Cobertura)
- [ ] Verificar impressões e cliques por site (via Desempenho)
- [ ] Verificar erros de rastreamento (via Inspeção de URL)
- [ ] Reenviar sitemap se houver páginas novas

---

## Contatos e Links Rápidos

| Ferramenta | Link | Credenciais |
|------------|------|------------|
| UptimeRobot Dashboard | https://uptimerobot.com/dashboard | .env.local → UPTIMEROBOT_API_KEY |
| Google Analytics 4 | https://analytics.google.com | Conta Google do projeto |
| Google Search Console | https://search.google.com/search-console | Conta Google do projeto |
| Lighthouse CI | Local: `npm run lighthouse` | — |

---

## Referências

- **Runbook operacional:** `docs/MONITORING-RUNBOOK.md`
- **Arquitetura:** `docs/MONITORING-ARCHITECTURE.md`
- **Config de sites:** `config/sites-monitoring.json`
- **Guardrail INFRA-006:** `ai-forge/guardrails/infrastructure/uptime-monitoring.md`
- **Guardrail PERF-005:** `ai-forge/guardrails/performance/lighthouse-ci-threshold.md`
- **Guardrail PERF-001:** `ai-forge/guardrails/performance/core-web-vitals.md`
- **Regras canônicas:** INT-071, INT-072 (module-13-monitoramento/TASK-0 → Regras Canônicas)
