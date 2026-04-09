export function buildWhatsAppUrl(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  const cleaned = phone.replace(/\D/g, '');
  return `https://wa.me/${cleaned}?text=${encoded}`;
}
