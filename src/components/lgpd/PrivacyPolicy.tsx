interface PrivacyPolicyProps {
  siteName: string;
  controllerName?: string;
  controllerContact?: string;
  updatedAt?: string;
}

export function PrivacyPolicy({
  siteName,
  controllerName = 'Pedro Corgnati',
  controllerContact = 'contato@systemforge.com.br',
  updatedAt,
}: PrivacyPolicyProps) {
  const date = updatedAt ?? new Date().toLocaleDateString('pt-BR');

  return (
    <main className="max-w-[768px] mx-auto px-4 py-12">
      <div className="prose">
        <h1>Política de Privacidade — {siteName}</h1>

        <p>
          <strong>Controlador:</strong> {controllerName} ({controllerContact})
          <br />
          <strong>Última atualização:</strong> {date}
        </p>

        <h2>Dados coletados</h2>
        <ul>
          <li>Nome</li>
          <li>E-mail</li>
          <li>Telefone (opcional)</li>
          <li>Dados de navegação via Google Analytics 4 (após consentimento)</li>
          <li>Dados preenchidos em calculadoras/diagnósticos (quando aplicável)</li>
        </ul>

        <h2>Finalidade</h2>
        <p>
          Os dados são coletados exclusivamente para responder às suas solicitações de contato
          e, mediante consentimento, para análise de tráfego com fins de melhoria do site.
        </p>

        <h2>Compartilhamento</h2>
        <ul>
          <li>
            <strong>Static Forms</strong> — processamento de formulários de contato.{' '}
            <a href="https://staticforms.xyz/privacy" target="_blank" rel="noopener noreferrer">
              Política de privacidade
            </a>
          </li>
          <li>
            <strong>Google Analytics 4</strong> — análise de tráfego (somente com consentimento).{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Política do Google
            </a>
          </li>
        </ul>

        <h2>Seus direitos (LGPD — Art. 18)</h2>
        <p>
          Você tem direito a acessar, corrigir, excluir ou portar seus dados a qualquer momento.
          Entre em contato pelo e-mail:{' '}
          <a href={`mailto:${controllerContact}`}>{controllerContact}</a>
        </p>

        <h2>Cookies</h2>
        <p>
          Utilizamos cookies de análise via Google Analytics 4 somente após seu consentimento
          explícito. A preferência é armazenada no <code>localStorage</code> do seu navegador
          por 24 horas. Você pode revogar o consentimento a qualquer momento limpando os dados
          do navegador.
        </p>
      </div>
    </main>
  );
}
