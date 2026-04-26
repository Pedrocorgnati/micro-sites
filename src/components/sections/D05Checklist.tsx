import type { SiteConfig } from '@/types';

/**
 * D05 Checklist — /resultado customizado para d05-checklist-presenca-digital.
 * Renderiza os itens faltantes do diagnostico como "Acoes prioritarias".
 *
 * Inputs esperados em config.d05Checklist?:
 *   areas: [{ id, label, weight }]
 *   actions: [{ areaId, when: 'missing' | 'partial', text, priority: 1|2|3 }]
 *
 * Fallback: se config nao traz dados, usa checklist generica presenca digital.
 */

type ChecklistArea = {
  id: string;
  label: string;
  status?: 'ok' | 'partial' | 'missing';
};

type ChecklistAction = {
  areaId: string;
  text: string;
  priority: 1 | 2 | 3;
};

const DEFAULT_AREAS: ChecklistArea[] = [
  { id: 'site', label: 'Site proprio e responsivo' },
  { id: 'gmn', label: 'Google Meu Negocio otimizado' },
  { id: 'seo', label: 'SEO tecnico basico (title, meta, sitemap)' },
  { id: 'social', label: 'Presenca em redes sociais ativas' },
  { id: 'analytics', label: 'Analytics configurado (GA4 + GSC)' },
  { id: 'whatsapp', label: 'WhatsApp Business conectado' },
];

const DEFAULT_ACTIONS: ChecklistAction[] = [
  { areaId: 'site', text: 'Lance um site proprio em dominio proprio', priority: 1 },
  { areaId: 'gmn', text: 'Crie/complete o perfil Google Meu Negocio', priority: 1 },
  { areaId: 'seo', text: 'Configure title/meta/canonical em todas as paginas', priority: 2 },
  { areaId: 'social', text: 'Mantenha 1 post/semana em Instagram ou LinkedIn', priority: 3 },
  { areaId: 'analytics', text: 'Instale GA4 + verifique GSC', priority: 2 },
  { areaId: 'whatsapp', text: 'Ative WhatsApp Business + link direto no site', priority: 1 },
];

const PRIORITY_STYLES: Record<1 | 2 | 3, { label: string; bg: string; fg: string }> = {
  1: { label: 'Prioridade Alta', bg: '#fee2e2', fg: '#991b1b' },
  2: { label: 'Prioridade Media', bg: '#fef3c7', fg: '#92400e' },
  3: { label: 'Prioridade Baixa', bg: '#dcfce7', fg: '#166534' },
};

export function D05Checklist({ config }: { config: SiteConfig }) {
  const custom = (config as unknown as { d05Checklist?: { areas?: ChecklistArea[]; actions?: ChecklistAction[] } })
    .d05Checklist;
  const areas = custom?.areas ?? DEFAULT_AREAS;
  const actions = custom?.actions ?? DEFAULT_ACTIONS;

  const sorted = [...actions].sort((a, b) => a.priority - b.priority);

  return (
    <section
      data-testid="d05-checklist"
      aria-label="Checklist de Presenca Digital"
      className="py-12 px-4 max-w-[1000px] mx-auto"
    >
      <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        Seu Checklist Personalizado
      </h2>
      <p className="text-slate-600 mb-6">
        Areas avaliadas e acoes prioritarias para fortalecer sua presenca digital.
      </p>

      <ul className="space-y-3 mb-10" data-testid="d05-areas">
        {areas.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-3 p-3 rounded-lg border"
            style={{ borderColor: 'var(--color-border, #e2e8f0)' }}
          >
            <span
              aria-hidden
              className="inline-block w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  a.status === 'ok' ? '#16a34a' : a.status === 'partial' ? '#eab308' : '#dc2626',
              }}
            />
            <span className="font-medium">{a.label}</span>
            {a.status && (
              <span className="ml-auto text-xs uppercase tracking-wide text-slate-500">
                {a.status}
              </span>
            )}
          </li>
        ))}
      </ul>

      <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Acoes Prioritarias
      </h3>
      <ol className="space-y-3" data-testid="d05-actions">
        {sorted.map((act, i) => {
          const style = PRIORITY_STYLES[act.priority];
          return (
            <li
              key={`${act.areaId}-${i}`}
              className="flex items-start gap-3 p-4 rounded-lg bg-white border"
              style={{ borderColor: 'var(--color-border, #e2e8f0)' }}
            >
              <span
                className="text-xs font-semibold px-2 py-1 rounded"
                style={{ backgroundColor: style.bg, color: style.fg }}
              >
                {style.label}
              </span>
              <p className="flex-1 text-sm leading-relaxed">{act.text}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
