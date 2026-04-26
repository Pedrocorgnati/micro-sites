# Quarterly Access Audit — Template

**Cadence:** trimestral — dia 1 de **Mar/Jun/Set/Dez**
**Owner:** Pedro Corgnati
**Vincula:** `docs/team/RESPONSIBILITIES.md`, `.claude/projects/micro-sites.json`, `docs/operations/TOKEN-ROTATION-RUNBOOK.md`, `docs/team/DEV-JUNIOR-OFFBOARDING.md`

> Auditoria de seguranca de credenciais ORCH (admin/CI) e RUNTIME (app). Foca em 2FA, rotacao e principio do menor privilegio.

---

## Contas a auditar

| Conta | Tipo | 2FA obrigatorio | Rotacao token | Owner |
|-------|------|-----------------|---------------|-------|
| GitHub (Pedro) | ORCH | Sim — TOTP | anual | Pedro |
| GitHub Actions secrets | ORCH (escopo repo) | N/A (storage) | quando token mudar | Pedro |
| Sentry SystemForge | ORCH | Sim — TOTP | anual (`SENTRY-ROTATION-RUNBOOK.md`) | Pedro |
| Static Forms | ORCH | Verificar suporte 2FA | semestral | Pedro |
| Google (GA4 + GSC) | ORCH | Sim — TOTP/security key | nao se aplica (OAuth) | Pedro |
| Hostinger | ORCH | Sim — TOTP | anual (senha root) | Pedro |
| StaticForms / Web3Forms | ORCH | Verificar | semestral | Pedro |
| Vercel (caso futuro) | ORCH | Sim — TOTP | anual | Pedro |
| Anthropic API (Claude Code) | ORCH (script-only) | Sim na conta | trimestral | Pedro |
| 1Password vault | Master | Master + 2FA | recovery key offline | Pedro |

## Checklist trimestral

### Credenciais ORCH
- [ ] Cada conta tem 2FA habilitado (Pedro + dev jr quando aplicavel)
- [ ] Senha 12+ chars + simbolos + maiusculas — armazenada em 1Password
- [ ] Recovery codes guardados offline (cofre fisico)
- [ ] Tokens com expiracao mais antigos que `rotacao` foram rotacionados (rodar `npx tsx scripts/list-credentials-age.ts`)
- [ ] Contas dormentes (sem login >180d) DESATIVADAS

### SSH e 1Password
- [ ] `~/.ssh/authorized_keys` no servidor Hostinger lista APENAS chaves vigentes (Pedro + dev jr ativos)
- [ ] 1Password vault `micro-sites` sincronizado em todos dispositivos do owner
- [ ] Senhas em 1Password com idade <12m (filter "older than")
- [ ] Recovery kit 1Password atualizado em cofre fisico

### Roles externos (consumidores)
- [ ] GA4: `Admin -> Account Access Management` revisado, dev junior apenas `Viewer`
- [ ] GSC: cada propriedade lista apenas Pedro + dev jr ativo
- [ ] Sentry: `Settings -> Members` revisado, ex-colaboradores removidos

### Credenciais RUNTIME
- [ ] `.env.production` por site nao commitado (verificar `.gitignore`)
- [ ] Vars no painel hosting acessadas via SSH/admin com 2FA
- [ ] Rotacao alinhada com schedule (DATABASE_URL trimestral, JWT secret anual)

### Acessos compartilhados
- [ ] Equipe (atual: solo) — sem credenciais compartilhadas
- [ ] Convites GitHub/colaboradores: revisar lista, remover ex-colaboradores
- [ ] Cliente final NUNCA recebe credencial ORCH; recebe acessos restritos via servico (ex: Cliente recebe link GA4 com permissao Viewer, nao Editor)

### Auditoria de logs
- [ ] GitHub Settings > Security log: revisar eventos suspeitos ultimos 90d
- [ ] Hostinger log de acesso SSH: validar IPs conhecidos
- [ ] Sentry: revisar lista de membros e tokens

## Sinais de comprometimento

Se algum dos abaixo: rotacionar IMEDIATAMENTE:
- Login de IP/local nao reconhecido
- Token aparecendo em log publico
- Email de seguranca do provedor sobre tentativas de acesso
- Alerta GitHub secret scanning
- Saida de colaborador que tinha acesso

## Output

- [ ] PDF do checklist preenchido em `docs/compliance/access-audit-{YYYY-Q}.pdf`
- [ ] Issues GitHub para cada acao corretiva pendente
- [ ] Log de mudancas em `CHANGELOG-COMPLIANCE.md`
