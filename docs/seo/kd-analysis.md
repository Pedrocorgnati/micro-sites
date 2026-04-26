# Analise de Keyword Difficulty (KD) — Rede Micro Sites

**Origem:** Intake Review — CL-108
**Metodologia:** coleta via Ubersuggest + DR manual (backlinks topo-SERP).
**Data de coleta:** a preencher na primeira auditoria SEO (owner: SEO).
**Mercados:** pt-BR (primary), it-IT, en-US, es-ES — scopo quad-market conforme ADR-0006.

## Como usar

Tabela-base para priorizacao: preencher **uma linha por keyword-alvo principal** de cada um dos 36 sites. Atualizar a cada 90 dias ou apos refresh material.

## Legenda

- **KW:** keyword-alvo principal.
- **Vol:** volume mensal de busca (pt-BR).
- **KD:** Keyword Difficulty (0-100).
- **CPC:** Cost-per-click (R$).
- **SERP:** features presentes (FS=featured snippet, PAA=people also ask, LP=local pack, VID=video, IMG=images).
- **Intent:** informational (I) · commercial (C) · transactional (T) · navigational (N).

## Tabela

| Site slug                             | KW                                     | Vol | KD | CPC | SERP | Intent |
|---------------------------------------|----------------------------------------|-----|----|-----|------|--------|
| a01                                   | TBD                                    | -   | -  | -   | -    | -      |
| a02                                   | TBD                                    | -   | -  | -   | -    | -      |
| *(... 36 linhas ...)*                 |                                        |     |    |     |      |        |
| d01-calculadora-custo-site            | calculadora custo site                 | -   | -  | -   | -    | C      |
| d02-calculadora-custo-app             | quanto custa fazer app                 | -   | -  | -   | -    | C      |
| d03-diagnostico-maturidade-digital    | maturidade digital empresa             | -   | -  | -   | -    | I/C    |
| d04-calculadora-roi-automacao         | roi automacao                          | -   | -  | -   | -    | C      |
| d05-checklist-presenca-digital        | checklist presenca digital             | -   | -  | -   | -    | I      |
| e01-ia-para-pequenos-negocios         | ia para pequenos negocios              | -   | -  | -   | -    | I/C    |
| e02-automacao-whatsapp                | automacao whatsapp empresa             | -   | -  | -   | -    | C      |
| e03-site-com-ia                       | site com ia                            | -   | -  | -   | -    | C      |

> **Nota:** baseline foi deixado como placeholder. Owner SEO deve preencher na primeira rodada mensal e versionar no git. Intake Review trata disso como gap documentacional (nao bloqueia build).

## Fonte e auditoria

- Ferramenta: Ubersuggest plano standard (exportar CSV, colar em nova secao).
- Cross-check: DR topo-10 SERP via Ahrefs free tier (ate 3 lookups/dia).
- Revisor: SEO + tecnico (garantir slug aderente a keyword).
