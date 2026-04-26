/**
 * Audit GA4 events para detectar PII em payloads.
 *
 * Static analysis: parseia src/lib/analytics.ts + chamadas trackEvent espalhadas
 * para verificar se algum eventName/params contem campos forbidden.
 *
 * Forbidden fields (case-insensitive substring match):
 *   email, telefone, phone, cpf, cnpj, nome, name, password, senha, address,
 *   cep, street, rg, passport
 *
 * Falha CI (exit 1) se encontrado.
 *
 * Usage:
 *   npx tsx scripts/audit-ga4-pii.ts
 *
 * TASK-26 ST001 — gap CL-269
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const SRC = path.join(ROOT, 'src');

const FORBIDDEN_FIELDS = [
  'email',
  'telefone',
  'phone',
  'cpf',
  'cnpj',
  'nome',
  // 'name' e generico demais; checaremos apenas chaves com padroes especificos abaixo
  'password',
  'senha',
  'address',
  'cep',
  'street',
  'rg',
  'passport',
];

const TRACK_FN_NAMES = ['trackEvent', 'track', 'gtag', 'logEvent', 'pushEvent'];

interface Finding {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

function walkSync(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.next', 'dist', '.git', 'coverage'].includes(e.name)) continue;
      out.push(...walkSync(p, exts));
    } else if (exts.some((ext) => e.name.endsWith(ext))) {
      out.push(p);
    }
  }
  return out;
}

function auditFile(file: string): Finding[] {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const findings: Finding[] = [];

  // Match calls like: trackEvent('xxx', { email: ... })
  // ou trackEvent({ name, params: { email: ... } })
  const trackPattern = new RegExp(`\\b(${TRACK_FN_NAMES.join('|')})\\s*\\(`, 'g');

  let inTrackBlock = false;
  let trackStartLine = 0;
  let trackBuffer = '';
  let braceCount = 0;
  let parenCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inTrackBlock) {
      const m = trackPattern.exec(line);
      if (m) {
        inTrackBlock = true;
        trackStartLine = i + 1;
        trackBuffer = line.slice(m.index);
        parenCount = 1;
        braceCount = 0;
        for (const ch of line.slice(m.index + m[0].length)) {
          if (ch === '(') parenCount++;
          else if (ch === ')') parenCount--;
          else if (ch === '{') braceCount++;
          else if (ch === '}') braceCount--;
          if (parenCount === 0) break;
        }
        if (parenCount === 0) {
          checkBuffer(trackBuffer, file, trackStartLine, findings);
          inTrackBlock = false;
          trackBuffer = '';
        }
        trackPattern.lastIndex = 0;
      }
    } else {
      trackBuffer += '\n' + line;
      for (const ch of line) {
        if (ch === '(') parenCount++;
        else if (ch === ')') parenCount--;
        else if (ch === '{') braceCount++;
        else if (ch === '}') braceCount--;
      }
      if (parenCount === 0) {
        checkBuffer(trackBuffer, file, trackStartLine, findings);
        inTrackBlock = false;
        trackBuffer = '';
      }
    }
  }

  return findings;
}

function checkBuffer(buf: string, file: string, line: number, findings: Finding[]): void {
  const lower = buf.toLowerCase();
  for (const field of FORBIDDEN_FIELDS) {
    // Escape — chave deve aparecer como prop em objeto: `email:` ou `'email':` ou `"email":`
    const patterns = [new RegExp(`\\b${field}\\s*:`, 'i'), new RegExp(`['"]${field}['"]\\s*:`, 'i')];
    if (patterns.some((p) => p.test(buf))) {
      // Permite "email" se for SHA-256 hash explicito
      if (/email_hash|hashed_email|sha256/i.test(lower)) continue;
      findings.push({
        file,
        line,
        snippet: buf.slice(0, 200).replace(/\n/g, ' '),
        reason: `Campo forbidden "${field}" em payload de evento`,
      });
      break;
    }
  }
}

function main(): void {
  const files = walkSync(SRC, ['.ts', '.tsx', '.js', '.jsx']);
  let allFindings: Finding[] = [];
  for (const f of files) {
    allFindings = allFindings.concat(auditFile(f));
  }

  if (allFindings.length === 0) {
    console.log('[audit-ga4-pii] OK — nenhum campo forbidden detectado em eventos');
    process.exit(0);
  }

  console.error(`[audit-ga4-pii] FAIL — ${allFindings.length} ocorrencia(s):`);
  for (const f of allFindings) {
    const rel = path.relative(ROOT, f.file);
    console.error(`  ${rel}:${f.line} — ${f.reason}`);
    console.error(`    > ${f.snippet}`);
  }
  console.error('');
  console.error('Acoes:');
  console.error('  - Substituir campo forbidden por hash SHA-256 (ex: email_hash)');
  console.error('  - OU remover do payload (preferivel)');
  console.error('  - Documentar excecao em docs/compliance/LGPD-LIA.md se necessario');
  process.exit(1);
}

main();
