# Data Subject Request (DSR) Runbook — LGPD

**Para uso de:** Pedro Corgnati (controlador/DPO)
**Vincula:** `LGPD-SLA.md`, `LEGAL-BASIS-MATRIX.md`, `ROPA.md`
**Idempotency:** `dsr-runbook-2026-04`
**Versao:** v1.0 (2026-04-25 — TASK-13 ST003)

> Este runbook traduz a tabela quantificada do `LGPD-SLA.md` em fluxo operacional do dia-a-dia. Quando um titular pede algo, voce roda este runbook.

---

## Fluxo geral (5 passos)

```
1. RECEBE  ->  2. IDENTIFICA  ->  3. REGISTRA  ->  4. EXECUTA  ->  5. COMUNICA
```

Cada passo abaixo detalha **acao + tempo limite + saida**.

---

## Passo 1. Receber a requisicao

### Canais aceitos

- Email para `footstockbr@gmail.com` com assunto contendo `[LGPD]`
- `/contato` em qualquer site da rede com checkbox "Direitos LGPD" marcado
- Encaminhamento de fornecedor (Static Forms, Hostinger) repassando solicitacao do titular

### Acao imediata (dentro de 24h)

1. Confirmar recebimento ao titular: enviar **template Email-1** (vide §Templates abaixo)
2. Anotar `received_at` em ISO 8601 (ex: `2026-04-25T14:30:00-03:00`)

### Saida deste passo

- [ ] Email de confirmacao enviado
- [ ] `received_at` registrado

---

## Passo 2. Identificar o titular e o direito

### Identificacao do titular

Solicitar (no Email-1 enviado) **dois pontos de verificacao**:
1. Email original utilizado no site (auto-declarado)
2. Aproximadamente quando preencheu o form (mes/ano)

> Sem identificacao adequada, recusar atendimento (Art 11 — reducao de risco). Registrar como `closed: insufficient-id`.

### Identificar qual direito (1..9)

Cruzar com a tabela do `LGPD-SLA.md`:

| Pedido tipico | Direito (numero) | Prazo |
|---|---|---|
| "quero meus dados" | 1 (Acesso) | 15d |
| "tem dado errado, corrige" | 2 (Correcao) | 5 dias uteis |
| "apaga tudo" | 3 (Eliminacao) | 15d |
| "manda em formato JSON/CSV pra mim" | 4 (Portabilidade) | 15d |
| "deixa anonimo mas nao apaga" | 5 (Anonimizacao especifica) | 15d |
| "nao quero mais cookies" | 6 (Revogacao consent) | 24h |
| "ja existo no sistema?" | 7 (Confirmacao) | 5d |
| "com quem voce compartilha?" | 8 (Compartilhamento) | 15d |

### Saida deste passo

- [ ] Direito identificado (1..9)
- [ ] `due_at` calculado: `received_at + prazo`

---

## Passo 3. Registrar ticket

### Criar arquivo

`docs/compliance/lgpd-tickets/{YYYY-MM-DD}-{slug}.md`

Onde `slug` = primeiros 6 chars do hash sha256 do email (ex: `a3f9b2`).

### Template de ticket

```markdown
# DSR Ticket — {ticket-id}

**Status:** open | escalated | closed | breach
**Direito:** N (vide LGPD-SLA tabela)
**received_at:** YYYY-MM-DDTHH:MM:SS-03:00
**due_at:** YYYY-MM-DDTHH:MM:SS-03:00
**closed_at:** (preencher ao fechar)
**Titular (hash sha256):** abc123def456...
**Sites envolvidos:** [a01, b03, ...] (ou "todos")

## Descricao

{ipsis litteris ou parafrase da requisicao do titular}

## Acoes

- [ ] {Acao 1}
- [ ] {Acao 2}

## Evidencias

- Link/screenshot mascarado 1
- Link/screenshot mascarado 2

## Comunicacao com titular

- {data}: confirmacao recebimento (Email-1)
- {data}: solicitacao identificacao adicional
- {data}: comunicacao de conclusao (Email-2)
```

### Computar hash do email

```bash
echo -n "titular@exemplo.com" | sha256sum | cut -c1-12
```

### Saida deste passo

- [ ] Arquivo `docs/compliance/lgpd-tickets/{...}.md` criado
- [ ] `due_at` no arquivo confere com tabela SLA

---

## Passo 4. Executar a acao

### Por direito

#### Direito 1 — Acesso

1. Para cada site da rede:
   - Static Forms: dashboard `staticforms.xyz` -> exportar submissions com email = titular
   - GA4: nao se aplica (anonimizado por design)
   - Calculator results: localStorage do titular (nao temos acesso server-side; explicar)
2. Consolidar em `dsr-{ticket-id}-export.csv` (mascarar nas evidencias do ticket)
3. Enviar PDF + CSV via Email-2

#### Direito 2 — Correcao

1. Static Forms: editar entrada via dashboard
2. Outros canais: nao aplicavel
3. Documentar diff antes/depois (mascarado)

#### Direito 3 — Eliminacao

1. `npx tsx scripts/sf-purge-by-email.ts <hash-do-email>` (script da TASK-4)
2. Verificar remoção em SF dashboard
3. Anotar log do script no ticket
4. Backups Git: avaliar caso a caso (vide LGPD-SLA §Backups)
5. Sentry: nao se aplica (sem PII apos beforeSend filter)

#### Direito 4 — Portabilidade

1. Mesmo Direito 1, mas em formato JSON estruturado
2. Cada entrada com `{ purpose, base_legal_art, data, retention_until }`
3. Hash sha256 do JSON entregue registrado no ticket

#### Direito 5 — Anonimizacao especifica

1. Quando eliminacao nao e possivel (ex: NF-e ja emitida)
2. Substituir nome/email por hash; manter dado contabil
3. Documentar justificativa Art 16 no ticket

#### Direito 6 — Revogacao de consentimento

1. **24h efeito banner:** orientar titular a clicar "Apenas essenciais" no banner (limpar localStorage funciona tambem)
2. **5d purge:** rodar `sf-purge-by-email.ts` para remover entradas baseadas em consent
3. Registrar no ticket que o consent revogado nao afeta tratamento prevente em outras bases (Art 7, V/IX)

#### Direito 7 — Confirmacao de tratamento

1. Verificar SF dashboard com email titular
2. Responder: "Sim, temos seus dados nas finalidades X, Y" OU "Nao temos registro com este email"

#### Direito 8 — Informacao sobre compartilhamento

1. Snapshot atual da tabela "Operadores" do `ROPA.md`
2. Enviar com link para LEGAL-BASIS-MATRIX#transferencia-internacional

### Tempo limite

Para cada direito, respeitar `due_at` do ticket. **3 dias antes do `due_at`**, alerta amarelo (manual hoje; automatizacao pendente em PENDING-ACTIONS).

### Saida deste passo

- [ ] Acoes registradas no ticket (checklist marcado)
- [ ] Evidencias salvas (screenshots mascarados, hash de export, etc.)

---

## Passo 5. Comunicar conclusao

### Acao

1. Enviar **Email-2** ao titular (template abaixo)
2. Atualizar ticket: `status: closed` + `closed_at`
3. Marcar checklist de evidencias

### Saida deste passo

- [ ] Email-2 enviado
- [ ] Ticket fechado
- [ ] Quarterly review notificada (vide §Pos-conclusao)

---

## Templates de email

### Email-1 — Confirmacao de recebimento

```
Assunto: [LGPD] Recebemos sua solicitacao — referencia {ticket-id-curto}

Ola,

Recebemos sua solicitacao em {data} relacionada a {direito-identificado}.

Para garantirmos que estamos atendendo a pessoa correta, voce pode confirmar:

1. O email original utilizado no formulario do site
2. Aproximadamente quando preencheu (mes/ano)

Voce tem nosso compromisso de retorno em ate {prazo-do-direito} dias corridos
a partir desta confirmacao, conforme o art. {18 OU 19} da Lei Geral de Protecao
de Dados (Lei 13.709/2018).

Atenciosamente,
Pedro Corgnati — Encarregado de Tratamento de Dados (DPO)
SystemForge
footstockbr@gmail.com
```

### Email-2 — Conclusao com sucesso

```
Assunto: [LGPD] Conclusao — referencia {ticket-id-curto}

Ola,

Concluimos sua solicitacao registrada em {received_at}.

Acao realizada: {descricao breve}

{anexos se aplicavel — PDF/CSV/JSON}

Em caso de duvida ou nova solicitacao, basta responder este email.

Voce tambem pode reclamar diretamente a ANPD (https://www.gov.br/anpd/) caso
considere necessario.

Atenciosamente,
Pedro Corgnati — DPO SystemForge
footstockbr@gmail.com
```

### Email-3 — Comunicacao de breach (atraso)

```
Assunto: [LGPD] Atualizacao de prazo — referencia {ticket-id-curto}

Ola,

Por motivo de {razao}, nao foi possivel concluir sua solicitacao no prazo
inicial de {prazo-original} dias.

Nova ETA: {nova-data}.

Lamentamos o transtorno e agradecemos a paciencia.

Atenciosamente,
Pedro Corgnati — DPO SystemForge
```

### Email-4 — Identificacao insuficiente

```
Assunto: [LGPD] Necessitamos confirmar identidade — referencia {ticket-id-curto}

Ola,

Nao conseguimos confirmar que os dados solicitados pertencem a voce com as
informacoes recebidas. Para sua propria seguranca, precisamos de:

- Email original cadastrado no site
- Aproximadamente quando preencheu o formulario

Sem esses pontos, nao podemos atender o pedido (LGPD Art 11).

Atenciosamente,
Pedro Corgnati — DPO SystemForge
```

---

## Pos-conclusao

1. **Trimestral:** revisar tickets fechados em `QUARTERLY-ROPA-REVIEW.md` — taxa de breach, tempo medio, padroes
2. **Anual:** consolidar relatorio LGPD com numeros (n. tickets por direito, breach rate, tempo medio de resposta)
3. **Se 3+ breaches em 12m:** revisar este runbook + automatizar passos manuais

---

## Automatizacao prevista (PENDING-ACTIONS)

Items que melhorariam o fluxo mas dependem de acao humana:

- [ ] `docs/compliance/lgpd-tickets/check-due.sh` — cron diario que escanea tickets com `due_at - now < 3d` e envia email a Pedro
- [ ] Webhook Static Forms -> auto-acuso de recebimento quando assunto contem `[LGPD]`
- [ ] Dashboard simples (HTML estatico) listando tickets abertos + tempo restante
- [ ] Integracao com 1Password para gerar hash sha256 sem CLI (script CLI ja serve)

Ver `PENDING-ACTIONS.md` bloco `lgpd-runbook-automation-2026-04`.

---

## Versionamento

- v1.0 (2026-04-25) — TASK-13 ST003: criacao do runbook
