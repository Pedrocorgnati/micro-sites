import { PRIVACY_POLICY_VERSION } from '@/lib/privacy-version';
import { CookiesTable } from './CookiesTable';

interface PrivacyPolicyProps {
  siteName: string;
  controllerName?: string;
  controllerContact?: string;
  updatedAt?: string;
}

// CL-356 / CL-358 / CL-626 / CL-628 — canal LGPD + tabela cookies + revogacao.
export function PrivacyPolicy({
  siteName,
  controllerName = 'SystemForge',
  controllerContact = 'privacidade@systemforge.com.br',
  updatedAt,
}: PrivacyPolicyProps) {
  const date = updatedAt ?? new Date().toLocaleDateString('pt-BR');

  return (
    <main className="max-w-[768px] mx-auto px-4 py-12">
      <div className="prose">
        <h1>Politica de Privacidade — {siteName}</h1>

        <p>
          Veja tambem os <a href="/termos">Termos de Uso</a> que regulam o acesso a este site.
        </p>

        <p>
          <strong>Controlador:</strong> {controllerName} ({controllerContact})
          <br />
          <strong>Ultima atualizacao:</strong> {date}
        </p>

        <h2>Dados coletados</h2>
        <ul>
          <li>Nome</li>
          <li>E-mail</li>
          <li>Telefone (opcional)</li>
          <li>Dados de navegacao via Google Analytics 4 (apos consentimento)</li>
          <li>Dados preenchidos em calculadoras/diagnosticos (quando aplicavel)</li>
        </ul>

        <h2>Finalidade</h2>
        <p>
          Os dados sao coletados exclusivamente para responder as suas solicitacoes de contato
          e, mediante consentimento, para analise de trafego com fins de melhoria do site.
        </p>

        <h2>Compartilhamento</h2>
        <ul>
          <li>
            <strong>Static Forms</strong> — processamento de formularios de contato.{' '}
            <a href="https://staticforms.xyz/privacy" target="_blank" rel="noopener noreferrer">
              Politica de privacidade
            </a>
          </li>
          <li>
            <strong>Google Analytics 4</strong> — analise de trafego (somente com consentimento).{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Politica do Google
            </a>
          </li>
        </ul>

        <h2>Retencao de dados</h2>
        <p>
          Armazenamos os dados pessoais de contato por, no maximo,{' '}
          <strong>24 meses apos o ultimo contato comercial</strong> ou enquanto houver base legal
          para o tratamento (LGPD, art. 16). Dados anonimizados do Google Analytics 4 seguem a
          politica de retencao configurada no Google (padrao de 14 meses).
        </p>
        <p>
          Apos o prazo, os dados sao eliminados ou anonimizados de forma irreversivel, salvo
          obrigacao legal de guarda em contrario.
        </p>

        <h2 id="seus-direitos">Seus direitos e prazos (LGPD — Art. 18)</h2>
        <p>
          Voce tem direito a acessar, corrigir, eliminar, portar e revogar consentimentos
          a qualquer momento. Para exercer esses direitos use nosso{' '}
          <strong>canal dedicado LGPD</strong>:{' '}
          <a href={`mailto:${controllerContact}?subject=%5BLGPD%5D%20Solicitacao%20titular`}>{controllerContact}</a>{' '}
          com o assunto contendo <code>[LGPD]</code>.
        </p>

        {/* TASK-13 / CL-138/139/224/485 — SLA quantificado visivel ao titular */}
        <div data-testid="lgpd-sla-table" style={{ overflowX: 'auto' }}>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th align="left">Direito</th>
                <th align="left">Base legal</th>
                <th align="left">Prazo total</th>
                <th align="left">Confirmacao</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Acesso aos dados</td><td>Art. 18, II</td><td>15 dias corridos</td><td>24h</td></tr>
              <tr><td>Correcao de dados</td><td>Art. 18, III</td><td>5 dias uteis</td><td>24h</td></tr>
              <tr><td>Eliminacao/anonimizacao</td><td>Art. 18, VI</td><td>15 dias corridos</td><td>24h</td></tr>
              <tr><td>Portabilidade</td><td>Art. 18, V</td><td>15 dias corridos</td><td>24h</td></tr>
              <tr><td>Revogacao de consentimento</td><td>Art. 8, §5</td><td>24h (efeito imediato no banner; 5 dias para purge)</td><td>imediata</td></tr>
              <tr><td>Confirmacao de tratamento</td><td>Art. 18, I</td><td>5 dias corridos</td><td>24h</td></tr>
              <tr><td>Compartilhamento</td><td>Art. 18, VII</td><td>15 dias corridos</td><td>24h</td></tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
          Caso o prazo nao seja cumprido, comunicaremos nova ETA em ate 24h apos a data limite.
          Voce tambem pode reclamar diretamente a{' '}
          <a href="https://www.gov.br/anpd/" target="_blank" rel="noopener noreferrer">ANPD</a>.
        </p>

        <h2>Cookies</h2>
        <p>
          Utilizamos cookies essenciais para o funcionamento do site e, somente apos seu
          consentimento explicito, cookies de analise via Google Analytics 4. A preferencia e
          armazenada no <code>localStorage</code> do seu navegador com retencao de{' '}
          <strong>12 meses</strong> (apos isso solicitamos consentimento novamente).
        </p>

        {/* CL-626 — Tabela estruturada de cookies (componente reusavel CookiesTable). */}
        <h3>Tabela de cookies</h3>
        <CookiesTable />
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Pagina dedicada com detalhes adicionais e revogacao passo a passo:{' '}
          <a href="/cookies">Politica de Cookies</a>.
        </p>

        {/* CL-628 — Revogacao de consentimento — passo a passo */}
        <h3 id="revogar-consentimento">Como revogar consentimento</h3>
        <ol>
          <li>Role ate o rodape do site e clique em <strong>&quot;Gerenciar cookies&quot;</strong>.</li>
          <li>No painel, escolha <strong>&quot;Apenas essenciais&quot;</strong> ou desative <em>Analytics</em>.</li>
          <li>Recarregue a pagina — o consentimento e aplicado imediatamente.</li>
          <li>Para revogar consentimento de formularios anteriormente enviados, escreva para{' '}
            <a href={`mailto:${controllerContact}?subject=%5BLGPD%5D%20Revogacao%20consentimento`}>{controllerContact}</a>{' '}
            informando o e-mail usado. Atendemos em ate 24 horas (efeito imediato no banner; ate 5 dias para purge automatizado de dados ja coletados).</li>
        </ol>

        <h2>Documentos auxiliares</h2>
        <ul>
          <li>Registro de Operacoes de Tratamento (ROPA): vide <code>docs/compliance/ROPA.md</code></li>
          <li>SLA de atendimento de direitos: vide <code>docs/compliance/LGPD-SLA.md</code></li>
          <li>Matriz de bases legais: vide <code>docs/compliance/LEGAL-BASIS-MATRIX.md</code></li>
        </ul>

        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2rem' }}>
          Versao da Politica de Privacidade: <code>{PRIVACY_POLICY_VERSION}</code>
        </p>
      </div>
    </main>
  );
}
