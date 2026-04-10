import type { SiteConfig } from '@/types';
import { ContactFormBase } from './ContactFormBase';

interface ContactFormProps {
  config: SiteConfig;
}

export function ContactForm({ config }: ContactFormProps) {
  return (
    <section
      data-testid="contact-form-section"
      aria-label="Formulário de contato"
      className="py-16 min-h-[60vh]"
      style={{ backgroundColor: 'var(--color-muted)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
          >
            Fale com {config.name}
          </h1>
          <p className="mb-8 text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Preencha o formulário e retornaremos em até 24 horas úteis.
          </p>

          <ContactFormBase
            formEndpoint={config.cta.formEndpoint}
            whatsappNumber={config.cta.whatsappNumber}
            whatsappMessage={config.cta.whatsappMessage}
            siteName={config.name}
            siteSlug={config.slug}
          />
        </div>
      </div>
    </section>
  );
}
