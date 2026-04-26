# Dev Junior — Offboarding Checklist (CL-636)

**Origem:** TASK-10 / intake-review
**Aplicar:** sempre que dev junior sair (voluntariamente ou nao)

## Acoes imediatas (D+0, antes de comunicar saida)

- [ ] **GitHub:** remover collaborator em `Settings -> Manage access` do repo `Pedrocorgnati/micro-sites`
- [ ] **SSH Hostinger:** remover chave publica do dev de `~/.ssh/authorized_keys` no servidor (login via hpanel)
- [ ] **Static Forms dashboard:** revogar acesso (se compartilhado) ou rotar `access_key`
- [ ] **Sentry:** remover de `Settings -> Members`
- [ ] **GA4:** remover de `Admin -> Account Access Management`
- [ ] **GSC:** remover de `Settings -> Users and permissions` (todas as 36 propriedades)
- [ ] **1Password vault:** remover acesso ao vault `micro-sites`
- [ ] **WhatsApp Business:** se Multi-device, remover dispositivo do dev

## Rotar credenciais compartilhadas (D+0/D+1)

Tudo que o dev junior conhecia ou tinha acesso direto:

- [ ] SSH password Hostinger -> rotar via hpanel
- [ ] Static Forms `access_key` -> seguir `SF-ENDPOINT-ROTATION-RUNBOOK.md`
- [ ] Tokens MCP que estavam em `.mcp.json` compartilhado (Tavily, Perplexity, Firecrawl)
- [ ] Caso senha Hostinger panel compartilhada -> trocar e habilitar 2FA

Atualizar `lastRotated` em `.claude/projects/micro-sites.json` para
cada credencial rotada.

## Audit ultimos 30 dias (D+1)

- [ ] Listar commits do dev: `git log --author="<email>" --since="30 days ago"`
- [ ] Validar PRs aprovados/merge: nenhum codigo malicioso, nenhum secret commitado
- [ ] `git secrets --scan` ou `gitleaks detect --since=...` sobre os commits
- [ ] Se algum secret encontrado: rotar imediato + invalidar versao git

## Acessos fisicos / pessoais

- [ ] Recolher equipamento (notebook, dongles, smartcard)
- [ ] Verificar se NDA/contrato cobre nao-divulgacao por X meses
- [ ] Termo de devolucao assinado

## Atualizacao de docs

- [ ] `docs/team/RESPONSIBILITIES.md` — remover linha do dev
- [ ] `docs/compliance/QUARTERLY-ACCESS-AUDIT.md` — anotar offboarding com data
- [ ] `PENDING-ACTIONS.md` — registrar idempotency `dev-offboarding-{nome}-{YYYY-MM-DD}`

## Comunicacao

- [ ] Email para clientes finais? **Nao** (Pedro e ponto de contato unico)
- [ ] Slack/grupo interno: comunicar saida e novo ponto de contato
- [ ] LinkedIn: NAO desconectar (postura profissional)

## Pos-offboarding (D+30)

- [ ] Confirmar nenhum acesso retroativo: tentar `ssh hostinger`, `gh api repo`, `whois static-forms`
- [ ] Validar que rotacao foi aplicada em todos sistemas
- [ ] Encerrar audit com checklist arquivado em `docs/team/offboarding-history/{nome}-{YYYY-MM}.md`
