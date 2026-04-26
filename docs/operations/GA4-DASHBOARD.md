# GA4 Dashboard — Template Consolidado

## KPIs por Categoria

| Categoria | KPIs principais |
|-----------|-----------------|
| A (Nicho Vertical) | CTR botao WhatsApp, taxa de preenchimento form, conversao por urgencia |
| B (Dor) | Pre-waitlist, scroll 75%, tempo engajamento |
| C (Institucional) | Form submit, bounce rate home, profundidade de navegacao |
| D (Ferramentas) | `calculator_complete`, `pdf_download`, retencao pos-calculo |
| E (Pre-SaaS) | Waitlist signup, fonte de trafego, LTV estimado |
| F (Educativo) | Tempo em pagina, artigos/sessao, scroll 100% |

## Events a Monitorar (conversions candidates)

| event_name | trigger location | marcar como conversion |
|------------|------------------|------------------------|
| `form_submit` | ContactFormBase, WaitlistForm | SIM (todas Cats) |
| `whatsapp_click` | WhatsAppButton | SIM (Cat A/D) |
| `calculator_complete` | Calculator.tsx (state=result) | SIM (Cat D) |
| `pdf_download` | FullResult download | SIM (Cat D) |
| `cross_sell_click` | CrossSellRecommendations | opcional |
| `scroll_75` | GA4 enhanced measurement | NAO |

## Looker Studio
Template sugerido: criar relatorio com 4 paginas (Visao Geral / Por Categoria / Por Site / Conversions). Link publicado a ser adicionado aqui apos criacao.

## Segmentos sugeridos
- Por categoria: filtrar `page_path` match `^/(?:a|b|c|d|e|f)[0-9]+`
- Mobile vs Desktop: dimension `device_category`
- Brasil vs Resto: `country`
