// src/lib/analytics.ts
// Helper centralizado para dispatch de eventos GA4 respeitando consent LGPD.
// Fonte: TASK-2 intake-review (CL-320).

export type ConversionEvent =
  | 'whatsapp_click'
  | 'contact_form_submit'
  | 'waitlist_signup'
  | 'calculator_started'
  | 'calculator_start'
  | 'calculator_completed'
  | 'lead_magnet_downloaded'
  | 'outbound_to_systemforge'
  | 'outbound_click';

export type CalculatorId = 'd01' | 'd02' | 'd03' | 'd04' | 'd05' | string;

export interface OutboundClickParams {
  destination: string;
  site_origin: string;
}

export interface CalculatorStartParams {
  calculator_id: CalculatorId;
}

type GtagFn = (command: 'event', name: string, params?: Record<string, unknown>) => void;

type StoredConsent = { essential?: boolean; analytics?: boolean };

function readAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem('cookie_consent');
    if (!raw) return false;
    if (raw === 'accepted') return true;
    if (raw === 'rejected') return false;
    const parsed = JSON.parse(raw) as StoredConsent;
    return parsed?.analytics === true;
  } catch {
    return false;
  }
}

export function trackEvent(name: ConversionEvent | string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  if (!readAnalyticsConsent()) return;
  const gtag = (window as Window & { gtag?: GtagFn }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', name, params ?? {});
}

/**
 * Nurture priority tag for D03/D04 leads (TASK-7 / CL-013).
 * D03 (diagnostico) e D04 (ROI automacao) sao o gatilho canonico de nurture
 * assincrono. O payload carrega este valor para que o Static Forms webhook
 * e o GA4 possam segmentar follow-up (email + WhatsApp em <15min).
 */
export type NurturePriorityTag = 'D03' | 'D04';

/**
 * Helper tipado para disparar `lead_magnet_downloaded` com as dimensoes
 * canonicas exigidas pelo runbook de nurture:
 * - `calculator_type`: qual ferramenta D gerou o lead (`d03` / `d04` / ...)
 * - `nurture_priority_tag`: rotulo de priorizacao (so para D03/D04).
 * - `source`: slug do site (redundancia defensiva para casos sem consent).
 */
export function trackLeadMagnetDownloaded(params: {
  source: string;
  calculatorType: string;
  nurturePriorityTag?: NurturePriorityTag;
  email?: string;
  scorePartial?: number;
}): void {
  trackEvent('lead_magnet_downloaded', {
    source: params.source,
    calculator_type: params.calculatorType,
    nurture_priority_tag: params.nurturePriorityTag,
    has_email: Boolean(params.email),
    score_partial: params.scorePartial,
  });
}

export function isSystemForgeHost(href: string): boolean {
  try {
    const url = new URL(href, typeof window !== 'undefined' ? window.location.href : 'https://example.com');
    return /(^|\.)systemforge\.com\.br$/i.test(url.hostname);
  } catch {
    return false;
  }
}
