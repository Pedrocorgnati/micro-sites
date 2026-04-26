# ROPA — Registro de Operacoes de Tratamento (Simplificado)

**Controlador:** Pedro Corgnati (CPF/CNPJ no contrato)
**Encarregado (DPO):** Pedro Corgnati — `footstockbr@gmail.com`
**Versao:** 1.0
**Vigencia inicial:** 2026-04-25
**Cadence revisao:** trimestral (`docs/compliance/QUARTERLY-ROPA-REVIEW.md`)

> Documento simplificado conforme Art. 37 LGPD. Nao substitui assessoria juridica. Versao assinada do trimestre vigente em `docs/compliance/ROPA-SIGNED-{YYYY-Q}.pdf`.

---

## Operacoes de tratamento

| # | Operacao | Finalidade | Base Legal (LGPD) | Categorias de dados | Origem | Destinatarios | Retencao | Transferencia internacional |
|---|----------|------------|-------------------|---------------------|--------|---------------|----------|------------------------------|
| 1 | Form de contato | Atendimento comercial | Art 7, V (execucao de contrato/pre-contrato) + Art 7, IX (legitimo interesse) | Nome, email, telefone, mensagem | Site | Pedro (controlador), Static Forms (operador) | 24 meses | EUA (StaticForms) |
| 2 | Form de waitlist | Notificar lancamento de produto | Art 7, I (consentimento) | Email, opcional nome | Site Cat E | Static Forms | 24 meses | EUA |
| 3 | Calculadora — captura de email | Lead magnet entrega resultado completo | Art 7, I (consentimento) + Art 7, V | Email, respostas calculadora, score | Site Cat D | Static Forms, GA4 (anon) | 24 meses | EUA |
| 4 | GA4 events | Analytics de uso (page_view, calculator_*, submit) | Art 7, IX (legitimo interesse, base balanceada) | Cookies analiticos (`_ga`, `_gid`), IP truncado | Site (cliente) | Google LLC (operador) | GA4 retention 14 meses | EUA |
| 5 | Search Console | SEO tecnico — indexacao | Art 7, IX | Dominios, URLs, queries (anonimas) | GSC | Google LLC | 16 meses | EUA |
| 6 | Sentry — error tracking | Detectar excecoes em calculadoras | Art 7, IX (gateado por consent — se nao houver, drop) | Stack traces SEM PII (Calculator), tag `site_slug` | Site (cliente) | Sentry Inc | 30 dias | EUA |
| 7 | Cookie consent | Registro de aceite/recusa LGPD | Art 7, I (consentimento) — auto-armazenamento | localStorage `cookie_consent`, `consentedAt`, `version` | Browser | Local (navegador do usuario) | 12 meses | Nao se aplica |
| 8 | Logs Hostinger | Operacoes de servidor — acesso | Art 7, IX (legitimo interesse — seguranca) | IP, user-agent, timestamp | Servidor | Hostinger (operador) | 30 dias | UE/BR (Hostinger SP) |

## Direitos do titular

Atendidos via `footstockbr@gmail.com` conforme `docs/compliance/LGPD-SLA.md`:
- Acesso aos dados (Art 18, II)
- Correcao (Art 18, III)
- Anonimizacao/eliminacao (Art 18, VI)
- Portabilidade (Art 18, V)
- Revogacao do consentimento (Art 8, §5)
- Informacao sobre compartilhamento (Art 18, VII)

## Operadores

| Operador | Servico | Termos | Adequacao |
|----------|---------|--------|-----------|
| Static Forms | Coleta de submissions | DPA Standard | Verificar quarterly |
| Google LLC | GA4, GSC | DPA + SCC | Adequado (UE-EUA Data Privacy Framework) |
| Sentry Inc | Error tracking | DPA padrao | SCC + DPF |
| Hostinger | Hosting | DPA padrao | UE adequado, BR opcional via SP DC |

## Mudancas de escopo

Qualquer nova operacao (novo site, novo form, nova integracao) DEVE:
1. Ser adicionada nesta tabela ANTES do primeiro tratamento real
2. Atualizar `docs/compliance/LEGAL-BASIS-MATRIX.md`
3. Atualizar `src/components/lgpd/PrivacyPolicy.tsx` (tabela de cookies + finalidades)
4. Bumpar `PRIVACY_POLICY_VERSION` em `src/lib/privacy-version.ts`
5. Comunicar via banner se mudanca for materialmente impactante

## Versionamento

- v1.0 (2026-04-25) — versao inicial pos `/intake-review:execute-gaplist-p0`
