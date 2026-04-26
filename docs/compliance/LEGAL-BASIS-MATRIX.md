# Legal Basis Matrix — LGPD

Mapeia cada finalidade de tratamento -> base legal aplicavel (Art 7/Art 11) -> dados envolvidos -> categoria/sensibilidade -> revogabilidade.

**Versao:** v1.1 (2026-04-25 — TASK-13: matriz formal por finalidade)
**Vincula:** ROPA, LGPD-SLA, PrivacyPolicy.tsx, ConsentCheckbox/Calculator components

---

## Matriz formal por finalidade

| # | Finalidade | Base legal (Art LGPD) | Justificativa | Dados envolvidos | Categoria + sensibilidade | Pode revogar? Como? |
|---|---|---|---|---|---|---|
| 1 | Atendimento comercial pos-contato (form `/contato`) | Art 7, V (execucao de pre-contrato) | Sem o tratamento nao ha como responder ao lead voluntario | Nome, email, telefone (opcional), mensagem, slug origem | PII direta — sensibilidade media | Email para `footstockbr@gmail.com` com `[LGPD]` solicitando exclusao (Art 18, VI) — 15d |
| 2 | Marketing direto (lead magnet calculadora, newsletter futura) | Art 7, I (consentimento expresso) | Necessario consent destacado e revogavel a qualquer momento | Email + respostas do diagnostico/calculadora | PII direta — sensibilidade media | Botao "Cancelar inscricao" no email + revogacao via SLA Art 8 §5 (24h efeito imediato) |
| 3 | Lista de espera (form `/lista-de-espera`) | Art 7, I (consentimento) + Art 7, V (pre-contrato) | Captura de intencao de contratacao com checkbox explicito | Nome, email, empresa (opcional), porte, slug | PII direta — sensibilidade media | Email para revogar a qualquer momento (efeito 24h banner; 5d purge SF) |
| 4 | GA4 — analytics agregado (apos consent) | Art 7, IX (legitimo interesse) | Balanceado com expectativa de privacidade — IP anonimizado, sem cross-domain, sem PII | `_ga`, `_gid` cookies + eventos anon | Pseudonimizado — sensibilidade baixa | Toggle "Apenas essenciais" no banner (efeito imediato) — `cookie_consent: { analytics: false }` |
| 5 | GSC (Search Console) — indexacao publica | Art 7, IX (legitimo interesse) | Conteudo publico — sem PII envolvida | Dominios + sitemap + crawl stats | Nao-PII | n/a (apenas conteudo publico do site) |
| 6 | Sentry — error tracking | Art 7, IX (legitimo interesse) | Manutencao da plataforma; PII filtrada via `beforeSend` | Stack traces sem PII (CL-356 filter) | Pseudonimizado — sensibilidade baixa | n/a (sem PII coletada apos filter); revisao trimestral |
| 7 | Anti-fraude (honeypot, rate-limit Static Forms, circuit breaker) | Art 7, IX (legitimo interesse) | Protecao do servico contra spam/bots | IP truncado, user-agent, contagem por janela | Pseudonimizado — sensibilidade baixa | n/a (essencial para operacao do servico) |
| 8 | Cookies estritamente necessarios (`cookie_consent`, `cookie_consent_at`) | Art 8, §6 (sem necessidade de consent) | Operacao do site (registrar preferencia, sessao minima) | Estado de consent + timestamp | Nao-PII em si (preferencia) | Limpar localStorage do navegador |
| 9 | Cookies de analytics (apos consent — `_ga`, `_gid`) | Art 7, I (consentimento) + Art 7, IX (LIA) | Necessario consent destacado; balancing test em `LGPD-LIA.md` (futuro) | Cookies anon GA4 | Pseudonimizado | Toggle banner (efeito imediato) |
| 10 | Compliance/auditoria (logs, ROPA, tickets LGPD) | Art 7, II (cumprimento de obrigacao legal) | LGPD Art 37 + Marco Civil Art 13 (logs 6 meses) | ROPA, logs deploy, tickets anonimizados | PII pseudonimizada (hash titular) | n/a (obrigacao legal de retencao) |
| 11 | Retencao 24m apos ultimo contato comercial | Art 16, V (exercicio regular de direitos) + Art 7, V | Direito do controlador de produzir prova em pre-contrato | Email + thread comercial | PII direta — sensibilidade media | Solicitar eliminacao antecipada via Art 18, VI; controlador pondera com Art 16 |
| 12 | Captura via calculadora F01 (`/simulador`) | Art 7, I (consentimento explicito) + Art 7, V (pre-contrato) | Email entregue voluntariamente apos opt-in claro com finalidade descrita | Email + respostas calculadora + slug origem | PII direta + dados de negocio | Email para revogar; SF purge em 5d |

## Dados sensiveis (Art 11)

Esta rede de sites NAO trata dados sensiveis (saude, religiao, etnia, biometria, orientacao sexual, etc.).

**Excecao reservada:** caso futuramente um nicho exija (ex: site para clinica medica em wave 4), criar matrix dedicada com base Art 11, II, "a" (consentimento especifico e destacado para finalidade especifica). Ate la, a matriz acima vale para 100% dos sites em producao.

## Dados de criancas e adolescentes (Art 14)

Esta rede NAO direciona conteudo a criancas/adolescentes. Sem coleta direta. Caso surgir necessidade, exigir consentimento parental conforme Art 14, §1 com mecanismo verificavel (CPF do responsavel + assinatura digital).

## Transferencia internacional (Art 33)

| Operador | Destino | Mecanismo de adequacao |
|---|---|---|
| Google LLC (GA4) | EUA | Adequacy Decision (DPF) + Standard Contractual Clauses |
| Google Search Console | EUA | Idem |
| Static Forms (`staticforms.xyz`) | EUA | Standard Contractual Clauses (DPA assinado) |
| Sentry (sentry.io) | EUA | Standard Contractual Clauses (DPA SaaS) |

Pedro mantem copia dos DPAs/SCCs em `~/Documents/Compliance/dpas/` (fora do repo por ser confidencial).

---

## Revisao trimestral

A matriz deve ser revisada nos meses Mar/Jun/Set/Dez (`docs/compliance/QUARTERLY-ROPA-REVIEW.md`). Itens da revisao:

- [ ] Surgiu nova finalidade nao mapeada? Adicionar linha
- [ ] Algum operador foi descontinuado? Remover + atualizar ROPA
- [ ] Algum DPA/SCC venceu? Renovar
- [ ] Algum direito de titular ficou ambiguo? Esclarecer

## Atualizacoes

- v1.0 (2026-04-25) — base (TASK-4)
- v1.1 (2026-04-25) — TASK-13: matriz formal com 12 finalidades, sensibilidade explicita, mecanismo de revogacao por finalidade, transferencia internacional Art 33
