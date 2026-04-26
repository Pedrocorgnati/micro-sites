# Uptime Monitoring — UptimeRobot Config

**Versao:** v1.1 (2026-04-25 — TASK-26 ST002 threshold formal)

## Setup
Conta gratuita UptimeRobot suporta 50 monitors (suficiente para 36 sites).

## Monitors por site
Para cada site criar monitor:
- **Tipo:** HTTP(s) + Keyword
- **Intervalo:** 30s
- **URL:** `https://<dominio>/`
- **Keyword:** `config.name` (ver `sites/<slug>/config.json`) — detecta pagina quebrada mesmo com 200 OK
- **SSL expiry warn:** 14 dias antes do vencimento

## Threshold de alerta — escolha formal (CL-275)

**Threshold adotado:** 2 falhas consecutivas em janela de 5 minutos antes de disparar alerta.

**Rationale:**
- 1 falha consecutiva: dispara em flap transiente (CDN, DNS resolver), ruim para signal-to-noise
- 2 falhas em 5min: filtra ruidos < 90s (tipicos de flap) mas ainda detecta downtime real em < 3min
- 3+ falhas: muito tolerante, downtime real demoraria > 5min para ser sinalizado
- Janela de 5min: cabe dentro de 10 cycles de 30s; razoavel para gateway/CDN issues

**Implementacao:** UptimeRobot dashboard -> Monitor settings -> "Alert when down for: 2 consecutive failures (~1 min)".

Para monitors com intervalo diferente de 30s, ajustar quantidade de falhas para manter janela de 5min.

**Quando reduzir para 1 falha:**
- Sites Cat D (alto trafego em horario comercial) podem usar 1 falha apos onboarding,
  quando estabilidade for confirmada.
- Documentar excecoes no monitor description com prefixo `[STRICT]`.

## Alert Contacts
- Email primario: pedro4coding@gmail.com
- (Opcional) Webhook WhatsApp: integrar via Zapier/Make quando pager for critico

## Categorizacao (labels)
Prefixar nome do monitor com categoria: `[A]`, `[B]`, `[C]`, `[D]`, `[E]`, `[F]` — facilita filtro.

## Runbook on-alert
1. Verificar status do shared host Hostinger
2. Checar deploy recente (`/commit:static --module N`)
3. Rodar `curl -I https://<dominio>/` local
4. SE 503: seguir `docs/runbooks/fix-503.md` (se existir)
5. Escalar: abrir ticket Hostinger se >15min down

## Dashboard publico (opcional)
UptimeRobot oferece `Public Status Page` — criar uma page consolidada apos onboarding dos 36.
