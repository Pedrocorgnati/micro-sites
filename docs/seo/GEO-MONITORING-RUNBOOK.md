# GEO Monitoring Runbook

**Cadence:** mensal (workflow `geo-monitoring.yml`, dia 1 do mes)
**Owner:** Pedro Corgnati
**Vincula:** `config/geo-monitoring-keywords.json`, `scripts/geo-monitor-*.ts`, `output/reports/geo/{YYYY-MM}.md`

---

## Objetivo

Monitorar presenca dos 36 micro-sites em 3 motores generativos:
1. **Google AI Overviews** (via Tavily search + parse ai_overview)
2. **ChatGPT web search** (via OpenAI Responses API)
3. **Perplexity** (via Perplexity API)

## Como ler o relatorio mensal

Cada linha do relatorio mostra `% citacao por motor` por site:
- `% citacao` = N keywords presentes / N keywords totais para aquele site
- `Δ M-1` = variacao em pp (pontos percentuais) vs mes anterior

### Exemplo de leitura

```
| d01-calculadora-custo-site | 60.0% | +5.0pp | 40.0% | -3.0pp | 50.0% | =  |
```

Interpretacao:
- Perplexity: 60% citacao, +5pp vs mes anterior -> **boa progressao**
- ChatGPT: 40% citacao, -3pp -> **monitorar**
- Google AI Overviews: 50% citacao, sem mudanca -> estavel

## Gatilhos de acao

| Sinal | Acao |
|-------|------|
| Δ <= -10pp em 1 mes em 1 motor | Investigar — pode ser correlato a mudanca no algoritmo |
| Δ <= -10pp em 2 motores simultaneos | Refresh do conteudo top do site |
| Queda de citacao em 2 meses consecutivos | Refresh + ajustar headings + GEO citation pattern |
| Site sem citacao em 0% por 3 meses | Considerar criar conteudo specifico para motores generativos |

## GEO citation pattern (200 palavras)

Para aumentar chance de citacao em motores generativos, criar paragrafo direto e citavel logo apos o H1:

> **Padrao:** abertura de 150-200 palavras com pergunta retorica, resposta direta sem
> jargon, dados numericos verificaveis, citacao de fonte. Aparece bem em snippets
> e em "AI Overview" do Google.

## Adicionar novo site

1. Editar `config/geo-monitoring-keywords.json`
2. Adicionar 5-15 keywords priorizadas por volume + intencao
3. Definir `priority`: high (Cat A/D top performers), medium (B/C), low (legacy)
4. Validar via `npx tsx -e "require('./src/schemas/geo-monitoring').loadGeoMonitoringConfig()"`
5. PR com label `geo`

## Limitacoes conhecidas

- ChatGPT web search via OpenAI Responses API tem custo (~$0.03/query). Usar `priority: high` apenas para evitar bills altos.
- Tavily nem sempre expoe `ai_overview` no payload. Para precisao maior considerar SerpAPI (PENDING-ACTIONS).
- Perplexity API e a mais barata e estavel — manter como base.
- Resultados sao indicativos, nao garantia. SE for medir conversao real, usar GA4 referrer.

## Custos esperados

- Perplexity: ~$0.005/query (sonar-small-online)
- ChatGPT (web_search_preview): ~$0.03/query
- Tavily: ~$0.005/query (basic search)
- 36 sites * 5 keywords avg * 3 motores = 540 queries/mes ~= $20/mes (estimativa)

Atualizar `BUDGET.md` apos primeiro mes real.
