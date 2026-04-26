import { originTag } from './utm-builder';

// CL-387: formato brasileiro 55 + DDD(2) + numero(8 ou 9 digitos)
const WHATSAPP_NUMBER_PATTERN = /^55\d{10,11}$/;

export class WhatsAppConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhatsAppConfigError';
  }
}

/**
 * Monta URL do WhatsApp a partir do numero do config do site.
 * Lanca WhatsAppConfigError se phone vazio ou fora do formato 55DDDXXXXXXXXX.
 */
export function buildWhatsAppUrl(phone: string, message: string, slug?: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new WhatsAppConfigError('whatsappNumber missing in site config (CL-387)');
  }
  const cleaned = phone.replace(/\D/g, '');
  if (!WHATSAPP_NUMBER_PATTERN.test(cleaned)) {
    throw new WhatsAppConfigError(
      `whatsappNumber invalido: "${phone}". Formato esperado 55DDDXXXXXXXXX (CL-387)`,
    );
  }
  const withOrigin = slug ? `${message} ${originTag(slug)}` : message;
  const encoded = encodeURIComponent(withOrigin);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

const NURTURE_TEMPLATES: Record<string, string> = {
  d01: 'Oi! Vi que voce fez a simulacao. Posso te mostrar como reduzir em media 15% com um diagnostico rapido?',
  d02: 'Notei que seu ROI ficou abaixo do benchmark. Que tal agendarmos 20min?',
  d03: 'Seu resultado indicou oportunidades em pontos-chave. Tenho cases parecidos — posso compartilhar?',
  d04: 'Faltaram poucos itens para 100%. Posso te ajudar a fechar os gaps principais em uma call de 30min?',
  d05: 'Vi sua comparacao. Posso enviar nosso detalhamento tecnico de cada item?',
};

export function buildNurtureMessage(slug: string, score?: number): string {
  const prefix = (slug.split('-')[0] || '').toLowerCase();
  const base = NURTURE_TEMPLATES[prefix] ?? NURTURE_TEMPLATES.d03;
  return typeof score === 'number' ? `${base} (seu score: ${score})` : base;
}
