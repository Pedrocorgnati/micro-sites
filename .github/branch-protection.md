# GitHub Branch Protection — configuracao manual

Este arquivo documenta a configuracao requerida em
`https://github.com/Pedrocorgnati/micro-sites/settings/branches`.
A configuracao e MANUAL (nao versionada por GitHub) — registrada
em PENDING-ACTIONS para garantir aplicacao.

## Branch `main`

- [ ] Require a pull request before merging
  - Required approvals: **1**
  - Require review from Code Owners: **ON** (faz CODEOWNERS valer)
  - Dismiss stale pull request approvals when new commits are pushed: **ON**
- [ ] Require status checks to pass before merging
  - Strict: **ON**
  - Required checks: `CI — Lint & Build`, `Audit output export`
- [ ] Require conversation resolution before merging: **ON**
- [ ] Require linear history: **ON**
- [ ] Do not allow bypassing the above settings: **ON** (inclusive admins)
- [ ] Restrict who can push to matching branches: **Pedrocorgnati** apenas

## Branches `deploy-*`

- [ ] Require pull request reviews — **OFF** (deploy branches sao automaticas, push direto pelo CI)
- [ ] Restrict who can push to matching branches: **Pedrocorgnati + GitHub Actions**
- [ ] Require signed commits: **OFF**
- [ ] Allow force pushes: **OFF**

## Tags `wave-*-*`

Configurar protecao de tags em `Settings -> Tags -> Tag protection rule`:
- Pattern: `wave-*-*`
- Allowed roles: **Maintain** + **Admin**

## Pos-aplicacao

Apos aplicar manualmente, registrar evidencia em
`docs/operations/QUARTERLY-ACCESS-AUDIT.md` proximo ciclo.
