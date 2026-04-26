# GA4 Conversions — Setup Guide

## Eventos ja emitidos pelo codigo

| event_name | parameters | trigger location | conversion? |
|------------|------------|------------------|-------------|
| `form_submit` | `{form_type}` | `src/components/forms/ContactFormBase.tsx`, `WaitlistForm.tsx` | SIM |
| `whatsapp_click` | `{source}` (header/hero/cta) | `src/components/ui/WhatsAppButton.tsx` | SIM |
| `calculator_complete` | `{site_slug}` | `src/components/sections/Calculator.tsx` (state=result) | SIM (Cat D) |
| `pdf_download` | `{template_id}` | `src/components/sections/FullResult.tsx` | SIM (Cat D) |
| `cross_sell_click` | `{target_site}` | `src/components/sections/CrossSellRecommendations.tsx` | opcional |

## Como marcar no GA4 Admin
1. GA4 -> Admin -> Events
2. Localizar event_name (aguardar pelo menos 24h apos primeiro fire)
3. Toggle "Mark as conversion"
4. Repetir para cada evento acima

## Enhanced conversions (recomendado)
Para Cat A/D com paid traffic: habilitar Enhanced Conversions com hash de email (apos consent).

## Debug
- `?gtm_debug=1` para GA4 DebugView
- Browser: window.dataLayer inspection

## Consent gating
Todos os eventos respeitam `cookie_consent.analytics === true` (ver TASK-2 / `src/components/lgpd/CookieConsent.tsx`).
