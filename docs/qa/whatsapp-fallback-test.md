# QA — WhatsApp fallback (CL-386)

Checklist manual complementar ao `e2e/whatsapp-button.spec.ts`.

## Cenarios

### iOS Safari — sem app WhatsApp instalado
- [ ] Click no botao WhatsApp abre `https://wa.me/55...`
- [ ] Redireciona para App Store com prompt para instalar WhatsApp
- [ ] URL preserva `utm_source` e `utm_medium`

### Android Chrome — sem app WhatsApp instalado
- [ ] Click abre `https://wa.me/55...`
- [ ] Redireciona para Play Store
- [ ] Mensagem pre-preenchida preservada no deep-link

### Desktop — sem WhatsApp Desktop
- [ ] Click abre WhatsApp Web (`web.whatsapp.com`)
- [ ] Login QR valido
- [ ] Mensagem pre-preenchida aparece no input

### Cross-cutting
- [ ] Nova aba (`target="_blank"`, `rel="noopener noreferrer"`)
- [ ] Numero esta no formato E.164 (`55XXXXXXXXXXX`), sem `+` nem espacos
- [ ] `originTag` / `utm_source` identifica o site de origem

## Frequencia

- Automatico (E2E Playwright): por PR via CI.
- Manual: a cada release maior (ondas 1/2/3 do rollout) e apos mudanca no componente `WhatsAppButton`.
