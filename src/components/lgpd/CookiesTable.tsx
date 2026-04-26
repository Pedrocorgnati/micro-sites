/**
 * CookiesTable — tabela canonica de cookies utilizados na rede.
 * TASK-18 ST001 (CL-626) — extraido de PrivacyPolicy.tsx para reuso em /cookies.
 */

interface CookieRow {
  name: string;
  domain: string;
  purpose: string;
  retention: string;
  thirdParty: string;
}

export const COOKIES_TABLE: CookieRow[] = [
  {
    name: 'cookie_consent',
    domain: 'site (1st party — localStorage)',
    purpose: 'Registrar preferencia de consentimento (LGPD Art 7, I / Art 8 §6)',
    retention: '12 meses',
    thirdParty: 'Nenhum',
  },
  {
    name: 'cookie_consent_at',
    domain: 'site (1st party — localStorage)',
    purpose: 'Timestamp de consentimento — auditoria',
    retention: '12 meses',
    thirdParty: 'Nenhum',
  },
  {
    name: '_ga',
    domain: '.dominio principal',
    purpose: 'Identificar sessao GA4 (apos consentimento)',
    retention: '14 meses (configuracao GA4)',
    thirdParty: 'Google LLC (EUA — DPF/SCC)',
  },
  {
    name: '_gid',
    domain: '.dominio principal',
    purpose: 'Distinguir usuarios em janela 24h',
    retention: '24 horas',
    thirdParty: 'Google LLC',
  },
  {
    name: 'calculatorProgress',
    domain: 'site (1st party — localStorage)',
    purpose: 'Persistir progresso de calculadora entre sessoes',
    retention: 'Sessao + 30 dias (LRU)',
    thirdParty: 'Nenhum',
  },
];

export function CookiesTable() {
  return (
    <div data-testid="cookies-table" style={{ overflowX: 'auto' }}>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th align="left">Nome</th>
            <th align="left">Dominio</th>
            <th align="left">Finalidade</th>
            <th align="left">Retencao</th>
            <th align="left">Terceiro</th>
          </tr>
        </thead>
        <tbody>
          {COOKIES_TABLE.map((row) => (
            <tr key={row.name}>
              <td><code>{row.name}</code></td>
              <td>{row.domain}</td>
              <td>{row.purpose}</td>
              <td>{row.retention}</td>
              <td>{row.thirdParty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
