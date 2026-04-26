import type { SiteConfig } from '@/types';

/**
 * F01 Comparator — /resultado customizado para f01-blog-desenvolvimento-web.
 * Tabela comparativa Wix vs WordPress vs Shopify vs Custom.
 *
 * Colunas: Custo, Customizacao, SEO, Performance, Migracao.
 * Botao de download PDF (usa /relatorio.pdf pre-gerado via scripts/generate-pdf.ts).
 */

type Row = {
  feature: string;
  wix: string;
  wordpress: string;
  shopify: string;
  custom: string;
};

const ROWS: Row[] = [
  {
    feature: 'Custo inicial',
    wix: 'R$ 0-80/mes',
    wordpress: 'R$ 30-200/mes',
    shopify: 'R$ 150-1500/mes',
    custom: 'R$ 3k-30k (unico)',
  },
  {
    feature: 'Customizacao',
    wix: 'Limitada a templates',
    wordpress: 'Alta (plugins + codigo)',
    shopify: 'Media (liquid)',
    custom: 'Ilimitada',
  },
  {
    feature: 'SEO tecnico',
    wix: 'Basico',
    wordpress: 'Avancado (Yoast/RankMath)',
    shopify: 'Medio',
    custom: 'Total controle',
  },
  {
    feature: 'Performance',
    wix: 'Baixa a media',
    wordpress: 'Varia (plugins pesam)',
    shopify: 'Boa (CDN integrado)',
    custom: 'Otima (SSR + cache)',
  },
  {
    feature: 'Migracao futura',
    wix: 'Dificil (lock-in)',
    wordpress: 'Moderada',
    shopify: 'Moderada',
    custom: 'Facil (codigo proprio)',
  },
];

export function F01Comparator({ config }: { config: SiteConfig }) {
  const pdfEnabled = config.leadMagnet?.enabled;

  return (
    <section
      data-testid="f01-comparator"
      aria-label="Comparativo de plataformas"
      className="py-12 px-4 max-w-[1200px] mx-auto"
    >
      <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        Comparativo Wix vs WordPress vs Shopify vs Custom
      </h2>
      <p className="text-slate-600 mb-6">
        Analise lado-a-lado para decidir qual plataforma casa com seu projeto.
      </p>

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
        <table className="min-w-full text-sm" data-testid="f01-table">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Criterio</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Wix</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">WordPress</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Shopify</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Custom</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.feature} className="border-t" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
                <th scope="row" className="px-4 py-3 text-left font-medium">{r.feature}</th>
                <td className="px-4 py-3">{r.wix}</td>
                <td className="px-4 py-3">{r.wordpress}</td>
                <td className="px-4 py-3">{r.shopify}</td>
                <td className="px-4 py-3">{r.custom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pdfEnabled && (
        <div className="mt-6 flex justify-end">
          <a
            href="/relatorio.pdf"
            download
            className="inline-flex items-center px-5 py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
            data-testid="f01-pdf-download"
          >
            Baixar PDF Comparativo
          </a>
        </div>
      )}
    </section>
  );
}
