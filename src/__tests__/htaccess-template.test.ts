import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * G-004 (MILESTONE-2) — Snapshot dos headers de seguranca em .htaccess.template.
 *
 * Garante que a baseline LGPD/seguranca da Milestone 2 nao regrida silenciosamente.
 * Qualquer remocao de header critico falha aqui antes do build.
 */
describe('.htaccess.template — headers obrigatorios', () => {
  const templatePath = resolve(__dirname, '../../public/.htaccess.template');
  const content = readFileSync(templatePath, 'utf-8');

  it('contem X-Content-Type-Options nosniff', () => {
    expect(content).toMatch(/X-Content-Type-Options\s+"?nosniff"?/i);
  });

  it('contem X-Frame-Options DENY', () => {
    expect(content).toMatch(/X-Frame-Options\s+"?DENY"?/i);
  });

  it('contem Referrer-Policy strict-origin-when-cross-origin', () => {
    expect(content).toMatch(/Referrer-Policy\s+"?strict-origin-when-cross-origin"?/i);
  });

  it('contem Permissions-Policy desabilitando camera/microfone/geolocalizacao', () => {
    expect(content).toMatch(/Permissions-Policy/i);
    expect(content).toMatch(/camera=\(\)/);
    expect(content).toMatch(/microphone=\(\)/);
    expect(content).toMatch(/geolocation=\(\)/);
  });

  it('contem Content-Security-Policy com frame-ancestors none', () => {
    expect(content).toMatch(/Content-Security-Policy/i);
    expect(content).toMatch(/frame-ancestors\s+'none'/);
  });

  it('CSP permite GA4 e Static Forms (e nada alem disso para connect-src)', () => {
    expect(content).toMatch(/google-analytics\.com/);
    expect(content).toMatch(/googletagmanager\.com/);
    expect(content).toMatch(/staticforms\.xyz/);
  });

  it('redireciona HTTP para HTTPS (RewriteRule R=301)', () => {
    expect(content).toMatch(/RewriteCond\s+%\{HTTPS\}\s+off/);
    expect(content).toMatch(/RewriteRule.*\[L,R=301\]/);
  });

  it('mantem Options -Indexes para impedir directory listing', () => {
    expect(content).toMatch(/Options\s+-Indexes/);
  });
});
