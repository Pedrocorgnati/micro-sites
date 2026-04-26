# LGPD SLA — Atendimento de Requisicoes de Titulares

**Controlador:** Pedro Corgnati
**DPO/Encarregado:** Pedro Corgnati (`footstockbr@gmail.com`)
**Vincula:** ROPA, Legal Basis Matrix, PrivacyPolicy.tsx
**Idempotency:** `lgpd-sla-2026-04`
**Versao:** v1.1 (2026-04-25 — TASK-13 quantificacao + coluna evidencia + gatilho escalacao)

---

## Canal unico

Toda solicitacao chega via email `footstockbr@gmail.com` com assunto `[LGPD]` ou via `/contato` marcando opcao "Direitos LGPD". Resposta em portugues BR.

## Tabela quantificada de prazos

| # | Direito (Art LGPD) | Prazo total | Confirmacao | Processo | Evidencia auditavel |
|---|---|---|---|---|---|
| 1 | Acesso aos dados (Art 18, II) | **15 dias corridos** | 24h (acuso) | PDF + planilha CSV com dados pessoais por origem (SF, GA4 anon, calculator) | Ticket fechado em `docs/compliance/lgpd-tickets/` + screenshot mascarado do email enviado |
| 2 | Correcao de dados (Art 18, III) | **5 dias uteis** | 24h | Atualizar nos sistemas (SF via dashboard; GA4 nao se aplica — anon) | Diff antes/depois mascarado + ticket |
| 3 | Eliminacao/anonimizacao (Art 18, VI) | **15 dias corridos** | 24h | `npx tsx scripts/sf-purge-by-email.ts <hash>` + remocao manual dos demais | Log do script + ticket + confirmacao titular |
| 4 | Portabilidade (Art 18, V) | **15 dias corridos** | 24h | JSON estruturado com finalidade + base legal por entrada | Hash sha256 do JSON entregue + ticket |
| 5 | Anonimizacao especifica (Art 18, IV) | **15 dias corridos** | 24h | Idem eliminacao quando dados nao podem ser apagados (legal/contabil) | Justificativa Art 16 + ticket |
| 6 | Revogacao de consentimento (Art 8, §5) | **24h** (efeito imediato no banner; **5 dias** para purge automatizado) | imediata | Botao "Recusar cookies" + email para revogar consents passados | Estado localStorage atualizado + log purge |
| 7 | Confirmacao de tratamento (Art 18, I) | **5 dias corridos** | 24h | Confirmacao + relacao de operadores envolvidos | Email + ticket |
| 8 | Informacao sobre compartilhamento (Art 18, VII) | **15 dias corridos** | 24h | Lista atualizada de operadores (ROPA tabela §Operadores) | Snapshot ROPA + ticket |
| 9 | Revisao de decisao automatizada (Art 20) | **n/a** | n/a | Nao ha tomada de decisao automatizada nesta rede; reavaliar se introduzir score/lead-routing | Atestado anual em `QUARTERLY-ROPA-REVIEW.md` |

> Prazos quantificados sao **vinculantes**. Qualquer descumprimento e tratado como SLA breach (vide secao "SLA breach" abaixo).

## Gatilho de escalacao automatica

Mecanismo: cada ticket criado em `docs/compliance/lgpd-tickets/` registra `due_at` (calculado a partir de `received_at + prazo`).

- **T-3 dias antes do `due_at`:** alerta amarelo via cron `docs/compliance/lgpd-tickets/check-due.sh` (script previsto em PENDING-ACTIONS) + email a Pedro com "Ticket {id} due in 3 days"
- **T-1 dia antes do `due_at`:** alerta vermelho + auto-escala para L2 (consultor juridico) com flag `ESCALATED=true` no ticket
- **Apos `due_at` sem `closed_at`:** registrar incidente em `docs/compliance/lgpd-incidents/` automaticamente (idempotency `lgpd-breach-{ticket-id}`) e comunicar titular com nova ETA + razao em ate 24h

## Dados nao-eliminaveis (excecoes Art 16)

Manter por:
- Cumprimento de obrigacao legal (NF-e: 5 anos; contrato: 5 anos)
- Pesquisa por orgao de pesquisa (nao se aplica)
- Exercicio regular de direitos em processos (5 anos pos-litigio)

**Caso especifico — backups Git (deletes irreversiveis sem coordenacao):** commits historicos nao podem ser reescritos sem coordenacao com colaboradores. Quando solicitada eliminacao de dado pessoal vazado em commit, processo e:

1. Identificar commits via `git log -S "<email>"` ou `git log -p | grep -i <email>`
2. Criar branch `compliance/erase-{ticket-id}` com `git filter-repo --invert-paths --path <arquivo>` ou `--replace-text`
3. Validar com PR review obrigatorio
4. Force-push apos confirmacao Pedro (afeta TODOS clones; comunicar dev team antes)
5. Registrar evidencia em `lgpd-tickets/{id}.md` (commit antigo, commit novo, lista de remotes purged)

Para backups encriptados (Hostinger snapshot), enviar pedido formal ao provider com retencao tipica de 30 dias para purge fisico.

Em caso de excecao, comunicar titular com base legal especifica e prazo de retencao restante.

## Escalonamento

1. **L1:** Pedro responde direto (caso simples — 90% dos casos esperados)
2. **L2:** Consultor juridico externo — caso complexo (escalar via email com `[LGPD-L2]`)
3. **ANPD:** titular pode reclamar diretamente; controlador colabora

## Documentacao de tickets

Cada ticket DEVE registrar em `docs/compliance/lgpd-tickets/{YYYY-MM-DD-slug}.md`:
- Data recebimento (`received_at` ISO 8601)
- Data limite (`due_at` ISO 8601) — calculado da tabela quantificada
- Identificador anonimo (hash sha256 do email titular)
- Direito solicitado (1..9 da tabela)
- Acao tomada
- Data de conclusao (`closed_at`)
- Evidencia (link/screenshot, mascarado)
- Status: `open | escalated | closed | breach`

## SLA breach

Se prazo for descumprido:
1. Comunicar titular com nova ETA + razao em ate 24h
2. Registrar incidente em `docs/compliance/lgpd-incidents/{YYYY-MM-DD-ticket-id}.md`
3. Avaliar relatorio anual de compliance
4. Se `breach > 3` em 12 meses: revisar processo + treinar/automatizar

## Versionamento

- v1.0 (2026-04-25) — base (TASK-4)
- v1.1 (2026-04-25) — TASK-13: coluna evidencia, gatilho escalacao automatica, processo backups Git, Art 18, IV/Art 20 explicitos
