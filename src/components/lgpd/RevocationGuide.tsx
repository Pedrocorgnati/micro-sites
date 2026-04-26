/**
 * RevocationGuide — guia passo a passo para revogar consentimento.
 * TASK-18 ST001 (CL-628) — 3 metodos: footer button, navegador, /cookies.
 */
import Link from 'next/link';
import { CookieManageButton } from './CookieManageButton';

interface RevocationGuideProps {
  controllerContact?: string;
}

export function RevocationGuide({ controllerContact = 'privacidade@systemforge.com.br' }: RevocationGuideProps) {
  return (
    <section data-testid="revocation-guide" className="my-8">
      <h2 id="como-revogar">Como revogar o consentimento</h2>
      <p>
        Voce pode mudar suas preferencias a qualquer momento, com efeito imediato.
        Tres metodos disponiveis (use qualquer um):
      </p>

      <div data-testid="revocation-method" className="mt-4 mb-6">
        <h3>1. Botao &quot;Gerenciar cookies&quot; no rodape</h3>
        <p>
          Em qualquer pagina do site, role ate o rodape. Clique em{' '}
          <strong>&quot;Gerenciar cookies&quot;</strong> para reabrir o painel
          de preferencias. Voce pode optar por &quot;Apenas essenciais&quot;
          ou desativar a categoria <em>Analytics</em>. O efeito e imediato.
        </p>
        <div className="mt-2">
          <CookieManageButton />
        </div>
      </div>

      <div data-testid="revocation-method" className="mb-6">
        <h3>2. Limpando o armazenamento do navegador</h3>
        <p>
          Voce pode limpar o cookie/localStorage diretamente no navegador. O passo a passo varia:
        </p>
        <ul>
          <li>
            <strong>Chrome/Edge:</strong> F12 -&gt; Aplicacao -&gt; Armazenamento -&gt; Limpar dados do site.
          </li>
          <li>
            <strong>Firefox:</strong> F12 -&gt; Armazenamento -&gt; localStorage -&gt; remover <code>cookie_consent</code>.
          </li>
          <li>
            <strong>Safari:</strong> Preferencias -&gt; Privacidade -&gt; Gerenciar dados de sites -&gt; remover este site.
          </li>
        </ul>
        <p>
          Ao recarregar a pagina, o banner de consentimento aparecera novamente.
        </p>
      </div>

      <div data-testid="revocation-method" className="mb-6">
        <h3>3. Solicitacao formal por email (revogacao + purge de dados ja coletados)</h3>
        <p>
          Para revogar o consentimento de dados <strong>ja submetidos</strong> (forms, calculadora,
          waitlist) e nao apenas das preferencias do navegador, escreva para{' '}
          <a href={`mailto:${controllerContact}?subject=%5BLGPD%5D%20Revogacao%20de%20consentimento`}>
            {controllerContact}
          </a>{' '}
          com o assunto <code>[LGPD]</code>.
        </p>
        <p>
          Atendemos em ate <strong>24 horas</strong> (efeito imediato no banner) e em ate{' '}
          <strong>5 dias corridos</strong> para purge automatizado de dados ja coletados.
        </p>
        <p>
          Detalhes do processo:{' '}
          <Link href="/privacidade#seus-direitos">Politica de Privacidade — Seus direitos e prazos</Link>.
        </p>
      </div>
    </section>
  );
}
