# GSC Fragility Runbook

**Versao:** v1.0 (2026-04-25 — TASK-29 ST002 / CL-594)
**Vincula:** GSC-AUTOMATION.md, TOKEN-ROTATION-RUNBOOK.md, PENDING-ACTIONS

> Cenarios de "fragilidade GSC" — perda de acesso, key revogada, penalty
> manual — e procedimentos de recovery. Pedro como operador unico precisa
> ter playbook documentado para cenarios de baixa frequencia mas alto impacto.

---

## Cenario A — Perda de 2FA (acesso conta Google)

### Sintoma
- Login no GSC pede 2FA mas Pedro perdeu acesso ao authenticator (telefone roubado/perdido)

### Recovery
1. Tentar codigos de backup (Pedro deve ter 10 codigos one-time salvos em 1Password ou impressos)
2. Se sem codigos: `accounts.google.com/recovery` -> verify identity (telefone alternativo, email recovery)
3. Aguardar prazo do Google (3-5 dias se identity check passar)
4. Apos recuperar, **rotacionar imediatamente:**
   - Trocar 2FA para nova device (`google.com/security/2sv`)
   - Salvar 10 codigos backup em 1Password + um email cifrado
   - Imprimir + guardar fisicamente (envelope lacrado)

### Mitigacao preventiva
- [ ] **OBRIGATORIO:** Gerar codigos backup do Google e salvar em 1Password tag `lgpd-recovery`
- [ ] **OBRIGATORIO:** 1Password tem 2FA proprio — duplo single-point-of-failure mitigado por export emergency kit
- [ ] **TRIMESTRAL:** auditar acesso (`QUARTERLY-ACCESS-AUDIT.md`)

---

## Cenario B — Service Account key revogada/expirada

### Sintoma
- `gsc-submit-sitemaps.ts` falha com 401 / `invalid_grant`
- Workflow `gsc-monthly-audit.yml` reporta auth fail

### Recovery
1. Acessar GCP Console -> IAM -> Service Accounts -> identificar SA usada
2. Criar **NOVA key** (JSON):
   - "Manage Keys" -> "Add Key" -> "Create new key" -> JSON
   - Download imediato (so e exibida 1 vez)
3. Substituir local em `secrets/gsc-service-account.json`
4. Atualizar GitHub secret:
   ```bash
   base64 -w 0 secrets/gsc-service-account.json | gh secret set GSC_SERVICE_ACCOUNT_BASE64
   ```
5. Re-rodar workflow manualmente para validar
6. **Apos validar:** deletar key antiga em GCP IAM (evitar key sprawl)

### Mitigacao preventiva
- [ ] `list-credentials-age.ts` (TASK-10) reporta SA keys >180 dias — rotacionar antes de revogar
- [ ] **NUNCA** deletar key antiga antes de validar nova em CI

---

## Cenario C — Penalty manual no GSC (urgent action)

### Sintoma
- Email do GSC: "Manual action: ..." (typical: thin content, sneaky redirects, structured data abuse)
- Trafego organico cai >50% em 7 dias

### Recovery
1. Login GSC -> Manual Actions panel
2. Identificar:
   - Site afetado (qual dominio?)
   - Tipo de manual action
   - URLs especificas listadas
3. **Triagem em <24h:**
   - Diagnostico: revisar URL afetada vs guidelines
   - Apenas 1 site = problema isolado, fixar e re-submit
   - Multiplos sites = problema sistemico (template, cross-link spam, etc) — pause deploys
4. Acao corretiva:
   - Thin content: re-escrever ou despublicar (vide CONTENT-DEPUBLISH-RUNBOOK)
   - Sneaky redirects: auditar `.htaccess` por redirects nao documentados
   - Structured data abuse: rodar `validate-schemas-rich-results.ts --strict`
5. Reconsideration request:
   - GSC -> Manual Actions -> "Request review"
   - Texto: explicar problema, descrever fix, prometer auto-audit recorrente
6. Aguardar decisao (5-30 dias tipicos)

### Mitigacao preventiva
- [ ] Schemas validados em CI (TASK-15)
- [ ] Content uniqueness audit trimestral (TASK-22)
- [ ] CONTENT-DEPUBLISH-RUNBOOK rodavel rapidamente (TASK-5)

---

## Cenario D — Service Account perde permissao em property

### Sintoma
- `gsc-properties-checklist.ts` reporta `permissionLevel: "siteUnverifiedUser"` ou ausencia
- Sitemaps submit falha com 403 em sites especificos

### Recovery
1. Acessar GSC console como humano (Pedro)
2. Settings -> Users and permissions -> Add user
3. Adicionar email da SA com role "Owner" (necessario para sitemap submit)
4. Aguardar 5min, re-rodar workflow

### Mitigacao
- [ ] Ao adicionar nova property no GSC, **sempre** adicionar SA imediatamente
- [ ] `gsc-bulk-verify` ja preve esse cenario via DNS verify (mas requer DNS API)

---

## Cenario E — Quota API excedida

### Sintoma
- `quotaExceeded` em logs do `gsc-submit-sitemaps.ts`
- GSC API tem 1200 queries/min/user — improvavel mas possivel se script roda em loop

### Recovery
1. Adicionar exponential backoff no script (futuro melhoria)
2. Splitar runs por categoria (10 sites/run com sleep 5s entre)
3. Em ultimo caso: solicitar quota increase via GCP Console

### Mitigacao
- [ ] Workflow `gsc-monthly-audit.yml` ja roda apenas mensal (sem risco)
- [ ] `gsc-submit-sitemaps.ts` poderia adicionar `await sleep(2000)` entre sites (improvement)

---

## Sinais de monitoring

Verificar mensalmente:
- `output/reports/gsc-properties-status.md` — todos os 36 verificados?
- Workflow `credentials-age-check.yml` — alguma key >180d?
- GSC console -> Manual Actions panel -> nada flagged?

## Acoes humanas pendentes

Vide PENDING-ACTIONS bloco `gsc-fragility-2026-04`:

- [ ] Gerar codigos backup do Google account e salvar em 1Password
- [ ] Documentar em 1Password as credenciais de recovery do Google account
- [ ] Imprimir 10 codigos backup e guardar fisicamente (envelope)
- [ ] Adicionar exponential backoff em `gsc-submit-sitemaps.ts` (improvement)

## Versionamento

- v1.0 (2026-04-25) — TASK-29 ST002: 5 cenarios + recovery + mitigacao
