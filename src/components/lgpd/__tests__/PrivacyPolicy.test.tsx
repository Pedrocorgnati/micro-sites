import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrivacyPolicy } from '../PrivacyPolicy';

/**
 * G-006 (MILESTONE-2) — Snapshot do texto legal LGPD.
 *
 * Falha se qualquer secao obrigatoria pela LGPD desaparecer do componente.
 * Mudancas intencionais devem atualizar o snapshot E passar por code review.
 */
describe('PrivacyPolicy — texto legal LGPD', () => {
  const html = renderToStaticMarkup(
    <PrivacyPolicy
      siteName="Site Teste"
      controllerName="SystemForge"
      controllerContact="privacidade@systemforge.com.br"
      updatedAt="01/01/2026"
    />,
  );

  it('renderiza titulo com nome do site', () => {
    expect(html).toContain('Politica de Privacidade — Site Teste');
  });

  it('identifica controlador e contato (LGPD art. 9, II)', () => {
    expect(html).toContain('SystemForge');
    expect(html).toContain('privacidade@systemforge.com.br');
  });

  it('lista dados coletados', () => {
    expect(html).toMatch(/Dados coletados/);
    expect(html).toMatch(/E-mail/);
    expect(html).toMatch(/Google Analytics/);
  });

  it('declara finalidade (LGPD art. 6, I)', () => {
    expect(html).toMatch(/Finalidade/);
  });

  it('declara compartilhamento com Static Forms e GA4', () => {
    expect(html).toMatch(/Compartilhamento/);
    expect(html).toMatch(/Static Forms/);
    expect(html).toMatch(/Google Analytics/);
  });

  it('referencia Termos de Uso', () => {
    expect(html).toMatch(/Termos de Uso/);
  });

  it('contem data de ultima atualizacao', () => {
    expect(html).toContain('01/01/2026');
  });

  it('snapshot completo do conteudo legal', () => {
    expect(html).toMatchSnapshot();
  });
});
