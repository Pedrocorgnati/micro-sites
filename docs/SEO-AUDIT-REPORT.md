# SEO Audit Report — 2026-04-11

**Projeto:** Micro Sites — Rede de Aquisição SystemForge  
**Data da auditoria:** 2026-04-11  
**Modo:** Local (config.json) — pré-deploy  
**Total de sites auditados:** 36 (6 categorias A-F)  
**Versão do relatório:** 1.0

---

## Executive Summary

| Métrica | Resultado | Status |
|---------|-----------|--------|
| Títulos únicos (36/36) | 36 ✓ | **PASSOU** |
| Títulos dentro do range (30-65 chars) | 36/36 ✓ | **PASSOU** |
| Meta descriptions presentes (36/36) | 36/36 ✓ | **PASSOU** |
| Schemas JSON-LD por categoria | 36/36 ✓ | **PASSOU** |
| Canonical URL slug+seo.title válidos | 36/36 ✓ | **PASSOU** |
| Cross-links implementados (Onda 1) | 20/20 ✓ | **PASSOU** |
| RC-INT-002: máx. 3 cross-links/site | 36/36 ✓ | **PASSOU** |

**Veredito: APROVADO (pré-deploy) — Aguardando substituição de `DOMAIN.com` e validação HTTP pós-deploy.**

---

## Detalhamento por Categoria

### Categoria A — Nicho Vertical (10 sites)

| Slug | Schema | seo.title | localBusiness | crossLinks |
|------|--------|-----------|---------------|------------|
| a01 | LocalBusiness ✓ | ✓ | type+address+phone ✓ | 1 (footer→c01) |
| a02 | LocalBusiness ✓ | ✓ | type+address+phone ✓ | 1 (footer→c01) |
| a03 | LocalBusiness ✓ | ✓ | type+address+phone ✓ | — |
| a04 | LocalBusiness ✓ | ✓ | type+address+phone ✓ | 1 (footer→c01) |
| a05 | LocalBusiness ✓ | ✓ | type+address+phone ✓ | — |
| a06 | LocalBusiness ✓ | ✓ | type+address+phone ✓ | — |
| a07 | LocalBusiness ✓ | ✓ | type+address+phone ✓ | 1 (footer→c01) |
| a08 | LocalBusiness ✓ | ✓ | type+address+phone ✓ | — |
| a09 | LocalBusiness ✓ | ✓ | type+address+phone ✓ | — |
| a10 | LocalBusiness ✓ | ✓ | type+address+phone ✓ | — |

**Nota:** A03, A05, A06, A08-A10 não têm crossLinks na Onda 1. Serão adicionados na Onda 2 conforme RC-INT-003.

---

### Categoria B — Dor/Problema (8 sites)

| Slug | Schema | seo.title | crossLinks (config) |
|------|--------|-----------|---------------------|
| b01-sem-site-profissional | HowTo ✓ | ✓ | 2 (d01:article, c01:cta) |
| b02-site-antigo-lento | HowTo ✓ | ✓ | 1 (c02:cta) |
| b03-sem-automacao | HowTo ✓ | ✓ | 2 (d04:article, c05:cta) |
| b04-sem-presenca-digital | HowTo ✓ | ✓ | — |
| b05-perder-clientes-online | HowTo ✓ | ✓ | — |
| b06-sem-leads-qualificados | HowTo ✓ | ✓ | 1 (d03:article) |
| b07-site-nao-aparece-google | HowTo ✓ | ✓ | — |
| b08-concorrente-digital | HowTo ✓ | ✓ | — |

---

### Categoria C — Serviço (8 sites)

| Slug | Schema | seo.title |
|------|--------|-----------|
| c01-site-institucional-pme | Service ✓ | ✓ |
| c02-landing-page-conversao | Service ✓ | ✓ |
| c03-app-web-negocio | Service ✓ | ✓ |
| c04-ecommerce-pequeno-negocio | Service ✓ | ✓ |
| c05-sistema-agendamento | Service ✓ | ✓ |
| c06-automacao-atendimento | Service ✓ | ✓ |
| c07-sistema-gestao-web | Service ✓ | ✓ |
| c08-manutencao-software | Service ✓ | ✓ |

---

### Categoria D — Ferramenta (5 sites)

| Slug | Schema | seo.title | crossLinks (resultado) |
|------|--------|-----------|------------------------|
| d01-calculadora-custo-site | WebApplication ✓ | ✓ | 1 (c01:resultado) |
| d02-calculadora-custo-app | WebApplication ✓ | ✓ | 1 (c03:resultado) |
| d03-diagnostico-maturidade-digital | WebApplication ✓ | ✓ | 2 (c05+c06:resultado) |
| d04-calculadora-roi-automacao | WebApplication ✓ | ✓ | — |
| d05-checklist-presenca-digital | WebApplication ✓ | ✓ | — |

---

### Categoria E — Pré-SaaS (3 sites)

| Slug | Schema | seo.title |
|------|--------|-----------|
| e01-ia-para-pequenos-negocios | SoftwareApplication ✓ | ✓ |
| e02-automacao-whatsapp | SoftwareApplication ✓ | ✓ |
| e03-site-com-ia | SoftwareApplication ✓ | ✓ |

---

### Categoria F — Educativo (2 sites)

| Slug | Schema | seo.title | crossLinks (artigos) |
|------|--------|-----------|----------------------|
| f01-blog-desenvolvimento-web | Article ✓ | ✓ | 2 (d01+c01:article) |
| f02-blog-marketing-digital | Article ✓ | ✓ | 3 (c01+c04+c05:article) |

---

## Validação de Scripts

| Script | Status | Resultado |
|--------|--------|-----------|
| `scripts/seo-audit-batch.sh` | ✓ Criado + executável | Requer deploy para modo HTTP |
| `scripts/validate-schemas.py --local` | ✓ 36/36 passou | Schemas corretos por categoria |
| `scripts/validate-canonical.sh --local` | ✓ 36/36 passou | Configs válidos |
| `scripts/validate-crosslinks.sh` | ✓ Criado + executável | Requer deploy para HTTP checks |

---

## Pendências Pós-Deploy

1. **Substituir `DOMAIN.com`** em todos os `config.json` e `crossLinks` pelo domínio Hostinger real
2. **Executar validação HTTP completa:**
   ```bash
   DOMAIN=seudominio.com bash scripts/seo-audit-batch.sh
   python3 scripts/validate-schemas.py seudominio.com
   bash scripts/validate-canonical.sh seudominio.com
   bash scripts/validate-crosslinks.sh --domain seudominio.com --report
   ```
3. **Verificar Lighthouse SEO ≥ 90** para todos os 36 sites via `scripts/lighthouse-batch.sh`
4. **Configurar GSC** para cada domínio e submeter sitemap.xml
5. **Marcar crossLinks como `"verified"`** no `INTERLINKING-AUDIT.json` após HTTP 200 confirmado

---

## Próxima Auditoria

**Onda 2 (pós-deploy):** Após deploy de A-sites completos + E + F restantes, rodar novamente para validar novos cross-links e schemas dos sites novos.
