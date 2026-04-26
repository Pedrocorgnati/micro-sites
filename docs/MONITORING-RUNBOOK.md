# Runbook de Monitoramento — Rede de 36 Sites

> Criado por: module-13-monitoramento/TASK-0/ST004  
> Guardrails: PERF-005, PERF-001, INFRA-006  
> Última atualização: 2026-04-12

---

## Visão Geral dos Alertas

| Tipo | Condição | Canal | Prioridade | Tempo de Resposta |
|------|---------|-------|------------|------------------|
| Site Down | HTTP ≠ 200 por > 10 min | Email (UptimeRobot) | P1 | < 15 min |
| Lighthouse < 90 | Score mensal abaixo do threshold | Log do cron | P2 | Próximo ciclo |
| Web Vitals degradado | CLS > 0.1 ou LCP > 2.5s | GA4 Real-time | P1 | < 24h |
| Falso positivo | Alerta sem incidente real | — | P3 | Até 1h para silenciar |

---

## 1. Alerta: Site Down (UptimeRobot)

**Condição:** UptimeRobot detecta HTTP ≠ 200 em 2 checks consecutivos (10 minutos de downtime).  
**Sinal:** Email com assunto `"Down: micro-sites-{slug}"` recebido.  
**Guardrail:** INFRA-006  

### Ação Imediata

1. **Verificar manualmente no browser:** acessar `https://{slug}.DOMAIN.com`  
   - Se browser retorna 200: pode ser falso positivo (ver seção 4)  
   - Se browser retorna erro: prosseguir para diagnóstico abaixo

2. **Verificar painel UptimeRobot:** `https://uptimerobot.com/dashboard`  
   - Clicar no monitor do site afetado  
   - Ver histórico de checks (últimas 24h)  
   - Confirmar se o downtime é real e contínuo

3. **Diagnóstico por código de erro:**

   | Código | Causa Provável | Ação |
   |--------|---------------|------|
   | 503 | Passenger/Node.js reiniciando | Aguardar 2-3 min; se persistir → SSH |
   | 404 | Arquivo index.html ausente ou deploy falhou | Verificar deploy branch no GitHub Actions |
   | 500 | Erro de configuração do servidor | SSH → ver logs Nginx |
   | 000/Timeout | Servidor sem resposta | Verificar painel Hostinger; checar cota de disco |

4. **Acesso SSH Hostinger (se necessário):**

   ```bash
   # Credenciais em output/docs/micro-sites/deploy-info.md (NÃO versionar)
   ssh -p {PORT} {USER}@{HOST}
   
   # Ver processos ativos
   ps aux | grep node
   
   # Ver logs do site específico
   tail -100 /home/{user}/logs/error_log
   
   # Reiniciar Passenger se necessário (alterar um arquivo .htaccess e salvar)
   touch /home/{user}/public_html/{slug}/public/.htaccess
   ```

5. **Recovery:** Site retorna HTTP 200 → UptimeRobot envia email `"Up: micro-sites-{slug}"` automaticamente.

### Escalação

Se não resolvido em **15 minutos:**
- Postar status no canal de comunicação definido
- Verificar se outros sites do mesmo deploy wave estão afetados (indicativo de problema de infraestrutura)
- Contato Hostinger: https://support.hostinger.com

---

## 2. Alerta: Lighthouse Performance < 90 (Mensal)

**Condição:** Script `scripts/lighthouse-monthly.sh` (executado no dia 1 de cada mês às 08:00) detecta score de performance abaixo de 90 em algum site da amostra.  
**Sinal:** Log do cron contém linha `"⚠ ALERTA: Performance {slug} abaixo de 90"`.  
**Guardrail:** PERF-005  
**Prioridade:** P2 — resolver no próximo ciclo de desenvolvimento.

### Ação

1. **Localizar o relatório mensal:**

   ```bash
   # Relatórios em docs/lighthouse/YYYY-MM/
   ls docs/lighthouse/$(date +%Y-%m)/
   # Ex: lighthouse-a01.json, lighthouse-b01.json, etc.
   ```

2. **Analisar o bottleneck no relatório JSON:**

   ```bash
   # Extrair principais oportunidades de melhoria
   cat docs/lighthouse/2026-04/lighthouse-{slug}.json | \
     node -e "
       const r = require('/dev/stdin');
       const audits = r.lhr?.audits || r.audits || {};
       Object.entries(audits)
         .filter(([,a]) => a.score !== null && a.score < 0.9 && a.score !== undefined)
         .sort((a, b) => (a[1].score || 0) - (b[1].score || 0))
         .slice(0, 5)
         .forEach(([id, a]) => console.log(id + ': ' + a.displayValue))
     " 2>/dev/null
   ```

3. **Causas comuns e correções:**

   | Problema | Correção |
   |---------|---------|
   | Imagens sem dimensões (CLS) | Adicionar `width` e `height` no `<Image>` |
   | JS de terceiros bloqueante | Usar `strategy="lazyOnload"` no Script component |
   | LCP alto (texto como LCP) | Adicionar `priority` no `<Image>` hero |
   | render-blocking resources | Auditar importações CSS desnecessárias |
   | Fontes sem `display: swap` | Verificar `next/font` config |

4. **Cat. D (Ferramentas):** Threshold é 85, não 90. Verificar `config/sites-monitoring.json`.

5. **Exceção legítima:** Se score for legitimamente < 90 por característica do site, documentar em `docs/MONITORING-RUNBOOK.md` § Exceções.

---

## 3. Alerta: Core Web Vitals Degradado (Contínuo)

**Condição:** GA4 Real-time ou Custom Report mostra `web_vital` com:
- `metric_name = "CLS"` e `value > 0.1`
- `metric_name = "LCP"` e `value > 2500` (ms)
- `metric_name = "INP"` e `value > 200` (ms)

**Sinal:** Spike visível no GA4 ou aumento de reclamações de usuários.  
**Guardrail:** PERF-001  
**Prioridade:** P1 — investigar em 24h.

### Ação

1. **Identificar o site afetado:**

   ```
   GA4 → Explorar → Nova exploração
   Dimensões: event_name = "web_vital", site_slug
   Métricas: event_count, média(value)
   Filtro: metric_name = "CLS" | "LCP" | "INP"
   ```

2. **Verificar mudanças recentes:**

   ```bash
   # Verificar commits recentes no site afetado
   git log --oneline -20 --since="7 days ago"
   
   # Verificar se houve mudanças em CSS/componentes do slug
   git diff HEAD~5 -- sites/{slug}/
   ```

3. **Causas por métrica:**

   **CLS (Layout Shift):**
   - Elementos sem dimensão explícita (imagens, iframes)
   - Fontes causando FOIT/FOUT (verificar `display: swap`)
   - Anúncios ou embeds sem dimensão reservada
   - Correção: adicionar `aspect-ratio` ou `min-height` nos containers

   **LCP (Largest Contentful Paint):**
   - Imagem hero sem `priority` no `<Image>`
   - Recurso LCP atrás de JavaScript (não SSG)
   - CDN lento para a região do usuário
   - Correção: `<Image priority>` no hero; verificar cache headers

   **INP (Interaction to Next Paint):**
   - Principalmente em Cat. D (Calculator): handler de click muito pesado
   - Long tasks bloqueando main thread
   - Correção: usar `useDeferredValue` ou `startTransition` em Cat. D

4. **Validar correção:**

   ```bash
   # Lighthouse local antes de commitar
   npx lighthouse http://localhost:3000 \
     --output=json \
     --chrome-flags="--headless=new" | \
     node -e "
       const r = require('/dev/stdin');
       const a = r.lhr?.audits || r.audits || {};
       console.log('CLS:', a['cumulative-layout-shift']?.displayValue);
       console.log('LCP:', a['largest-contentful-paint']?.displayValue);
       console.log('INP:', a['interaction-to-next-paint']?.displayValue);
     "
   ```

---

## 4. Falso Positivo — Como Desabilitar Alerta Temporariamente

### No UptimeRobot (maintenance window)

1. Acessar https://uptimerobot.com/dashboard
2. Clicar no monitor do site afetado
3. "Edit Monitor" → Aba "Maintenance Windows"
4. Adicionar janela: `Start Time` + `Duration` (máximo 24h)
5. Salvar — alertas silenciados durante a janela

**Quando usar:** durante deploy programado, manutenção de DNS, troca de certificado SSL.

### No script Lighthouse

Para silenciar um threshold específico temporariamente:

```bash
# Em scripts/lighthouse-monthly.sh, ajustar threshold para o site afetado
# Buscar a linha:
# SAMPLE="a01 b01 c01 d01 e01 f01 c06 d03"
# Remover temporariamente o slug problemático:
# SAMPLE="a01 b01 c01 e01 f01 c06"
```

**Importante:** Documentar a exceção na seção abaixo com data de expiração.

---

## 5. Exceções e Desvios Documentados

| Site | Métrica | Threshold Ajustado | Justificativa | Criado em | Revisão |
|------|---------|-------------------|---------------|-----------|---------|
| d01–d05 | Performance | 85 (vs 90 padrão) | Calculator dinâmico com INP intensivo — módulo-7 TASK-2 | 2026-04-12 | 2026-07-12 |

> Cada exceção deve ser revisada no prazo indicado. Expirada sem revisão = restaurar threshold padrão.

---

## 6. Verificação de Saúde Completa (Mensal)

Executar manualmente no início de cada mês (antes do cron Lighthouse):

```bash
# Passo 1: Validar que todos os sites respondem
./scripts/validate-sites-health.sh

# Passo 2: Verificar contagem de monitores UptimeRobot ativos
curl -s "https://api.uptimerobot.com/v2/getMonitors" \
  -d "api_key=${UPTIMEROBOT_API_KEY}" | \
  jq '.monitors | length'
# Esperado: 36

# Passo 3: Conferir relatório Lighthouse do mês anterior
ls -la docs/lighthouse/$(date -d "last month" +%Y-%m 2>/dev/null || date -v-1m +%Y-%m 2>/dev/null)/ 2>/dev/null || \
  echo "Sem relatório do mês anterior"

# Passo 4: Verificar eventos GA4 (via painel)
# GA4 → Relatórios → Engajamento → Eventos → buscar "web_vital"
# Esperado: event_count > 0 para cada site com tráfego
```

---

## Referências

- **Guardrail INFRA-006:** `ai-forge/guardrails/infrastructure/uptime-monitoring.md`
- **Guardrail PERF-005:** `ai-forge/guardrails/performance/lighthouse-ci-threshold.md`
- **Guardrail PERF-001:** `ai-forge/guardrails/performance/core-web-vitals.md`
- **Arquitetura:** `docs/MONITORING-ARCHITECTURE.md`
- **Configuração:** `config/sites-monitoring.json`
- **Referências cruzadas:** `docs/MONITORING-REFERENCES.md`
