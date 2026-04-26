# Responsabilidades de Equipe

## Pedro (owner/arquiteto)
- Arquitetura da rede
- Templates e componentes base
- Scripts de build/deploy
- Decisões de produto e conteúdo
- Aprovação de rollback em produção

## Dev Júnior (execução)
- Replicação de sites a partir de templates
- Copy assistido por AI (revisão final de Pedro)
- Testes de responsividade mobile
- Deploy em branches `deploy-{N}`
- Ajustes de conteúdo pós-feedback

## Matriz RACI

| Atividade | Pedro | Dev Júnior |
|-----------|-------|-----------|
| Arquitetura / ADRs | R/A | I |
| Templates base | R/A | C |
| Novo site (replicação) | A | R |
| Copy AI-assistida | C | R |
| Deploy staging | I | R |
| Deploy produção | A | R |
| Rollback produção | R/A | I |
| Análise de métricas mensais | R | C |
| Resposta a leads | R | - |
| Monitoramento CI | C | R |

R=Responsible, A=Accountable, C=Consulted, I=Informed.

## Gaps cobertos
- CL-202, CL-203

---

## Seguranca obrigatoria (TASK-29 ST004 / CL-481, CL-482, CL-605)

### 2FA mandatory

**Politica:** **TODOS** os colaboradores (Pedro + qualquer dev/VA contratado) DEVEM ter 2FA habilitado em:

| Servico | 2FA recomendado | Backup codes? |
|---|---|---|
| GitHub | App authenticator (Authy/1Password) | 10 codes guardar 1Password |
| Hostinger | SMS + email | n/a |
| Google (GA4, GSC, Drive) | Authenticator app | 10 codes — fisico + 1Password |
| Sentry | App authenticator | n/a |
| Static Forms | Email 2FA | n/a |
| 1Password (master) | App authenticator | Emergency Kit impresso |
| Cloudflare (futuro) | App authenticator | recovery key 1Password |

**Enforcement:** workflow `.github/workflows/2fa-enforcement-audit.yml` audita
mensalmente (dia 15) via GitHub API. Para org: filtra `2fa_disabled`. Para
repo pessoal: notice manual.

**Penalidade por nao cumprimento:** 7 dias para regularizar -> revogar acesso.

### Senha policy

- **Minimo 12 caracteres** + mistura de case + numero + simbolo
- Geracao: 1Password password generator (default 20 chars)
- **NUNCA** reusar senha entre servicos
- Rotacao: a cada **180 dias** ou imediatamente se vazou (via list-credentials-age.ts)

### Secret manager

- **1Password compartilhado** (Family/Business plan) e o sistema de verdade
- Vault `SystemForge` com permissions:
  - Pedro: full access
  - Dev junior (se houver): read-only acesso a apenas Vault `SystemForge-Dev` (subset)
- **PROIBIDO:** salvar credentials em `.env` commitado, post-it, ou app de notes

### Reviews trimestral

QUARTERLY-ACCESS-AUDIT.md (TASK-10) inclui:
- Inventario de quem tem acesso a cada servico
- Validar 2FA + senha rotacionada
- Revogar acessos de pessoas que sairam

## Gaps cobertos (acumulado)
- CL-202, CL-203 (responsabilidades RACI)
- CL-481, CL-482 (2FA + secret manager — TASK-29)
- CL-605 (senha policy 12+ chars — TASK-29)
