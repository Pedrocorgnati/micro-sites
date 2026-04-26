# RACI — Operacao da rede (CL-299)

Legenda: **R**esponsible (executa) · **A**ccountable (dono) · **C**onsulted · **I**nformed.

| Etapa                                        | Tecnico | SEO | Legal | Produto |
|----------------------------------------------|---------|-----|-------|---------|
| Criar novo site (scaffold + deploy)          | R/A     | C   | I     | C       |
| Publicar novo post (blog)                    | R       | A   | I     | C       |
| Refresh de site existente                    | R       | A   | I     | C       |
| Remover/arquivar site                        | R       | C   | C     | A       |
| Incidente LGPD (dados pessoais expostos)     | R       | I   | A     | I       |
| Estouro quota Static Forms                   | A/R     | I   | I     | C       |
| Incidente Hostinger (outage/503)             | A/R     | I   | I     | I       |
| Revisao trimestral de thresholds Lighthouse  | R       | C   | I     | A       |
| Revisao de copy (tom, claims, stats)         | C       | R   | C     | A       |
| Revisao de politica de cookies/consent       | C       | I   | A/R   | C       |
| Mudanca de dominio / redirect 301            | R       | A   | C     | C       |

## Handoffs

- **Tecnico → SEO:** apos deploy, SEO valida canonicals/sitemap/hreflang em 24h.
- **SEO → Produto:** relatorio mensal com dashboard + decisoes de refresh.
- **Legal → Tecnico:** para incidentes, janela de resposta obrigatoria <= 72h LGPD.

## Escalacao

1. Owner da etapa (coluna **A**) e primeiro ponto de escalacao.
2. Se `A` indisponivel > 24h, fallback e o Produto.
3. Incidentes LGPD e de outage sao escalados imediatamente para `Legal` e `Tecnico` respectivamente, sem fila.
