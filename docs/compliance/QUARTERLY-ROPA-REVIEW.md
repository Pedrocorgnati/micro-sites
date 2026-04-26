# Quarterly ROPA Review — Template

**Cadence:** Mar / Jun / Set / Dez
**Owner:** Pedro Corgnati
**Output:** `docs/compliance/ROPA-SIGNED-{YYYY-Q}.pdf`

---

## Pre-checks

- [ ] ROPA atual (`docs/compliance/ROPA.md`) reflete operacoes em producao
- [ ] Legal Basis Matrix atualizado (`LEGAL-BASIS-MATRIX.md`)
- [ ] Lista de operadores ainda valida (DPAs vigentes)

## Itens a revisar

### 1. Inventario de operacoes
- [ ] Existem novas operacoes (forms, integracoes, sites) nao listadas?
- [ ] Existem operacoes antigas DESATIVADAS que devem ser removidas?
- [ ] Mudou volume/escopo (ex: form de waitlist agora coleta telefone)?

### 2. Bases legais
- [ ] Cada finalidade tem base legal valida explicitada
- [ ] Consentimentos em vigor — auditar que copy/banner registram opt-in
- [ ] Legitimo interesse passa em "balancing test" (titular ainda pode esperar?)

### 3. Operadores
- [ ] DPAs assinados e vigentes (Static Forms, Google, Sentry, Hostinger)
- [ ] Transferencias internacionais com base legal (SCC, DPF, consentimento)
- [ ] Subcontratados informados pelo operador (sub-processor list)

### 4. Retencao
- [ ] Schedule respeitado — `scripts/sf-purge-24m.ts` rodando
- [ ] Logs >30d eliminados
- [ ] GA4 retention configurado para 14 meses

### 5. Direitos do titular
- [ ] SLA cumprido nos ultimos 90 dias (`docs/compliance/lgpd-tickets/`)
- [ ] Tickets sem resposta? -> escalar
- [ ] Volume de revogacoes consent — pico merece investigacao?

### 6. Incidentes
- [ ] Algum incidente de seguranca? Registrar em `docs/compliance/lgpd-incidents/`
- [ ] ANPD comunicada quando aplicavel (Art 48)

### 7. Treinamento e cultura
- [ ] Equipe (mesmo solo) revisou material LGPD nos ultimos 12 meses
- [ ] Acessos (2FA) auditados — `docs/compliance/QUARTERLY-ACCESS-AUDIT.md`

## Output

1. ROPA versao bumpada (ex: v1.1)
2. PDF assinado em `docs/compliance/ROPA-SIGNED-{YYYY-Q}.pdf`
3. Atualizar `PrivacyPolicy.tsx` se mudou estrutura
4. Bumpar `PRIVACY_POLICY_VERSION` se mudou texto material

## Cronograma 2026

- [ ] 2026-Q1 (Mar): primeira revisao formal
- [ ] 2026-Q2 (Jun)
- [ ] 2026-Q3 (Set)
- [ ] 2026-Q4 (Dez)
