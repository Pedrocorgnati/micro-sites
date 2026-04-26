import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface NoscriptFallbackProps {
  whatsappNumber: string;
  message?: string;
  contactEmail?: string;
  variant?: 'calculator' | 'contact';
}

export function NoscriptFallback({
  whatsappNumber,
  message = 'Olá! Gostaria de calcular o custo do meu projeto. Podem me ajudar?',
  contactEmail,
  variant = 'calculator',
}: NoscriptFallbackProps) {
  const url = buildWhatsAppUrl(whatsappNumber, message);
  const isContact = variant === 'contact';

  return (
    <noscript>
      <div
        role="alert"
        className="my-6 p-4 rounded-xl border"
        style={{ backgroundColor: '#FEFCE8', borderColor: '#FDE047' }}
      >
        <p className="font-semibold mb-2" style={{ color: '#713F12' }}>
          {isContact ? '⚠ Formulário requer JavaScript' : '⚠ Esta calculadora requer JavaScript'}
        </p>
        <p className="text-sm mb-4" style={{ color: '#713F12' }}>
          Entre em contato diretamente:
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white min-h-[44px]"
            style={{ backgroundColor: '#25D366' }}
          >
            WhatsApp
          </a>
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm min-h-[44px]"
              style={{ backgroundColor: '#F59E0B', color: '#ffffff' }}
            >
              Enviar e-mail
            </a>
          )}
        </div>
      </div>
    </noscript>
  );
}
