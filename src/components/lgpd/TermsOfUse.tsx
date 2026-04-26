interface TermsOfUseProps {
  siteName: string;
  /** CL-249/CL-411: slug para disclaimers regulados (a04 = OAB) */
  siteSlug?: string;
  updatedAt?: string;
  controllerName?: string;
  controllerContact?: string;
}

// CL-357 — Pagina /termos compartilhada entre os 36 sites.
// Copy canonica com seccoes alinhadas ao PrivacyPolicy (LGPD arts. 8, 16, 18).
export function TermsOfUse({
  siteName,
  siteSlug,
  updatedAt,
  controllerName = 'SystemForge',
  controllerContact = 'privacidade@systemforge.com.br',
}: TermsOfUseProps) {
  const date = updatedAt ?? new Date().toLocaleDateString('pt-BR');
  const isOAB = siteSlug?.startsWith('a04');

  return (
    <main className="max-w-[768px] mx-auto px-4 py-12">
      <div className="prose">
        <h1>Termos de Uso — {siteName}</h1>
        {isOAB && (
          <aside
            data-testid="terms-oab-disclaimer"
            className="rounded-md border-l-4 px-4 py-3 my-4 text-sm"
            style={{ borderColor: 'var(--color-accent)', backgroundColor: 'rgba(0,0,0,0.03)' }}
          >
            <strong>Compliance OAB:</strong> Este site segue o Codigo de Etica e
            Disciplina da OAB (Provimento 205/2021). Site informativo, sem
            captacao de clientela, sem promessa de resultado e sem comparativo
            entre profissionais. Veja{' '}
            <a href="/legal-disclaimer">aviso legal completo</a>.
          </aside>
        )}

        <p>
          <strong>Responsavel:</strong> {controllerName} ({controllerContact})
          <br />
          <strong>Ultima atualizacao:</strong> {date}
        </p>

        <h2>1. Aceitacao dos termos</h2>
        <p>
          Ao acessar e utilizar o site <strong>{siteName}</strong>, voce declara ter lido,
          compreendido e aceitado integralmente estes Termos de Uso e a{' '}
          <a href="/privacidade">Politica de Privacidade</a>. Caso nao concorde, pedimos que
          nao utilize o site.
        </p>

        <h2>2. Uso permitido</h2>
        <ul>
          <li>
            O conteudo deste site tem finalidade informativa, comercial e de diagnostico, e pode
            incluir ferramentas interativas, calculadoras, materiais educativos e formularios de
            contato.
          </li>
          <li>
            O uso deve se dar de boa-fe, respeitando a legislacao brasileira, direitos de
            terceiros e a integridade dos servicos.
          </li>
          <li>
            Voce se compromete a fornecer informacoes verdadeiras nos formularios e a nao
            automatizar submissoes sem autorizacao previa.
          </li>
        </ul>

        <h2>3. Limitacoes de responsabilidade</h2>
        <p>
          As estimativas, diagnosticos, checklists e calculos fornecidos sao orientativos e
          baseiam-se em parametros de mercado informados em cada pagina. Nao substituem analise
          profissional detalhada e nao constituem garantia contratual de preco, prazo ou
          resultado. O {controllerName} nao se responsabiliza por decisoes tomadas
          exclusivamente com base nessas informacoes.
        </p>

        <h2>4. Propriedade intelectual</h2>
        <p>
          Marca, layout, textos, codigo, imagens, logotipos e materiais originais publicados em{' '}
          {siteName} pertencem ao {controllerName}. E proibida a reproducao total ou parcial
          sem autorizacao expressa, ressalvadas as excecoes legais de direito de citacao e uso
          justo.
        </p>

        <h2>5. Dados pessoais e LGPD</h2>
        <p>
          O tratamento de dados pessoais segue a Lei 13.709/2018 (LGPD). As bases legais,
          finalidades, retencao e canais para exercicio de direitos estao detalhados na{' '}
          <a href="/privacidade">Politica de Privacidade</a>. Para solicitacoes especificas
          previstas no art. 18 da LGPD, utilize o e-mail{' '}
          <a href={`mailto:${controllerContact}`}>{controllerContact}</a>.
        </p>

        <h2>6. Alteracoes dos termos</h2>
        <p>
          Podemos atualizar estes Termos para refletir mudancas legais, operacionais ou de
          produto. Alteracoes materiais serao destacadas na propria pagina e, quando aplicavel,
          comunicadas por e-mail aos contatos cadastrados.
        </p>

        <h2>7. Lei aplicavel e foro</h2>
        <p>
          Estes Termos sao regidos pela legislacao da Republica Federativa do Brasil. Fica
          eleito o foro da comarca de domicilio do {controllerName} para dirimir quaisquer
          controversias decorrentes do uso do site, salvo disposicao legal em sentido diverso.
        </p>
      </div>
    </main>
  );
}
