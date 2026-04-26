# Static Forms — Monitoramento Operacional

**Gerado por:** /intake-review:execute-gaplist — TASK-11 ST001
**Data:** 2026-04-12

---

## Visão Geral

Static Forms é o serviço de backend para formulários de contato dos 36 micro-sites. Cada site possui uma `formAccessKey` única configurada em `sites/{slug}/config.json`.

- **Dashboard:** https://staticforms.xyz/dashboard
- **Credenciais:** Consultar `.env.production` → `STATIC_FORMS_ADMIN`
- **Plano atual:** Verificar no dashboard (plano gratuito: 500 submissões/mês por key)

---

## Checklist Semanal (toda segunda-feira)

- [ ] Acessar dashboard Static Forms e verificar submissões da semana
- [ ] Confirmar que todas as keys ativas estão recebendo dados (sem lacunas inexplicadas)
- [ ] Verificar spam — se > 30% das submissões parecerem bot, ativar honeypot ou CAPTCHA
- [ ] Confirmar que emails de notificação chegam nas caixas configuradas
- [ ] Checar se algum site está próximo do limite de submissões do plano
- [ ] Verificar erros 4xx/5xx no log do Static Forms (se disponível no plano)

---

## Taxas Esperadas por Categoria

| Categoria | Wave | Submissões/mês esperadas | Status |
|-----------|------|--------------------------|--------|
| Cat D (Ferramentas) | 1 | 50-200 por site (alta intenção) | Alta prioridade |
| Cat B (Dor) | 1-2 | 10-50 por site | Média prioridade |
| Cat C (Solução) | 1-2 | 20-80 por site | Média prioridade |
| Cat A (Nicho) | 2 | 5-30 por site | Baixa prioridade inicial |
| Cat E (Waitlist) | 2 | 30-100 por site (cadastros) | Alta prioridade |
| Cat F (Blog) | 2 | 5-20 por site | Baixa prioridade |

---

## Thresholds de Alerta

| Métrica | Normal | Atenção | Crítico |
|---------|--------|---------|---------|
| Taxa de entrega | > 95% | 80-95% | < 80% |
| Submissões Cat D | ≥ 10/semana | 5-9/semana | < 5/semana |
| Submissões Cat B | ≥ 5/semana | 2-4/semana | < 2/semana |
| Uso do plano | < 70% | 70-90% | > 90% |

---

## Troubleshooting

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| Formulário retorna erro 422 | `formAccessKey` inválida ou expirada | Verificar e atualizar key no dashboard |
| Emails vão para spam | Remetente `noreply@staticforms.xyz` não whitelisted | Orientar cliente a adicionar aos contatos |
| Zero submissões em site ativo | Build sem formAccessKey configurada | Executar `bash scripts/build-site.sh {slug}` — verificar warnings |
| Limite de plano atingido | Muitas submissões (ou spam) | Upgrade de plano ou ativar proteção anti-spam |
| CORS error no console | formEndpoint incorreto | Verificar `config.cta.formEndpoint` — deve ser `https://api.staticforms.xyz/submit` |
| Redirect após envio errado | redirectUrl incorreta no dashboard | Corrigir para `https://{dominio}/obrigado` no painel Static Forms |

---

## Processo de Configuração de Nova Key

1. Acessar https://staticforms.xyz/dashboard → **New Form**
2. Preencher: Name = `{slug}`, Email = email de destino, Redirect = `https://{dominio}/obrigado`
3. Copiar Access Key gerada
4. Atualizar `sites/{slug}/config.json` → campo `formAccessKey`
5. Executar `bash scripts/build-site.sh {slug}` para validar (sem warnings de key)
6. Fazer deploy: `bash scripts/deploy-branch.sh {slug} {branch}`
7. Testar formulário em staging antes de deploy em produção

---

## Runbook — Swap de Provider de Static Forms (TASK-6 / CL-255)

Objetivo: trocar o endpoint central de Static Forms sem editar os 36 `sites/*/config.json`.

### Pre-condicao

- `sites/<slug>/config.json` → `cta.formEndpoint` usa placeholder:
  ```json
  { "cta": { "formEndpoint": "${env:STATIC_FORMS_URL}" } }
  ```
- Resolvido em build-time por `src/lib/config-loader.ts`.

### Passos

1. **Escolher novo provider** (ex.: Formspree, Basin, Web3Forms).
2. **Setar env var** antes do build:
   ```bash
   export STATIC_FORMS_URL="https://formspree.io/f/abc123"
   ```
   Em CI, adicionar a variavel no ambiente do runner.
3. **Rebuild** dos sites afetados:
   ```bash
   bash scripts/build-all.sh
   ```
4. **Validar** que o HTML exportado em `dist/<slug>/index.html` referencia o novo endpoint.
5. **Deploy** (`bash scripts/deploy-all.sh`).
6. **Monitorar** `.forms-health.json` (atualizado por `check-static-forms-quota.ts`) nos 30min seguintes — status deve ir de `ERROR` para `OK`.

### Alertas automatizados

- `scripts/check-static-forms-quota.ts` agora emite:
  - `[quota] ALERTA 80%:` em stdout quando qualquer site >= 80% da cota.
  - `[quota] ENDPOINT DEGRADADO:` em stderr quando o endpoint responde nao-2xx/erro de rede.
  - Exit code 1 em `>=90%` (ALERT/OVER); exit 2 em erro de endpoint; 0 em OK/WARN.
- Saida consolidada: `.forms-health.json` no root do workspace.

### Dry-run

```bash
STATIC_FORMS_URL="https://api.staticforms.xyz/submit" \
  npx tsx scripts/build-site.sh c01-site-institucional-pme
grep -o 'formEndpoint[^,]*' dist/c01-site-institucional-pme/index.html
```

Confirma que o placeholder foi substituido pelo valor da env var.
