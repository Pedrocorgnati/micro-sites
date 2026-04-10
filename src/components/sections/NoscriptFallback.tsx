import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface NoscriptFallbackProps {
  whatsappNumber: string;
  message?: string;
}

export function NoscriptFallback({ whatsappNumber, message = 'Olá! Gostaria de calcular o custo do meu projeto. Podem me ajudar?' }: NoscriptFallbackProps) {
  const url = buildWhatsAppUrl(whatsappNumber, message);

  return (
    <noscript>
      <div
        role="alert"
        className="my-6 p-4 rounded-xl border"
        style={{ backgroundColor: '#FEFCE8', borderColor: '#FDE047' }}
      >
        <p className="font-semibold mb-2" style={{ color: '#713F12' }}>
          ⚠ Esta calculadora requer JavaScript
        </p>
        <p className="text-sm mb-4" style={{ color: '#713F12' }}>
          Para calcular sem JS, fale pelo WhatsApp:
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white min-h-[44px]"
          style={{ backgroundColor: '#25D366' }}
        >
          Calcular pelo WhatsApp
        </a>
      </div>
    </noscript>
  );
}
