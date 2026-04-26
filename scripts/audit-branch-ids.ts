/**
 * audit-branch-ids — reporta divergencia entre INTAKE-CHECKLIST.md e deploy-map.sh.
 *
 * Le:
 *   - INTAKE-CHECKLIST.md (extrai mencoes "deploy-NN" + slug proximo)
 *   - scripts/deploy-map.sh (extrai DEPLOY_MAP[slug]=branch)
 *
 * Output: divergencias + tabela consolidada.
 *
 * TASK-23 ST001 — gaps CL-358, CL-362, CL-367, CL-389, CL-390
 *
 * Usage:
 *   npx tsx scripts/audit-branch-ids.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const CHECKLIST_PATH = path.resolve(
  '../wbs/micro-sites/intake-review/INTAKE-CHECKLIST.md',
);
const DEPLOY_MAP_PATH = path.join(ROOT, 'scripts/deploy-map.sh');
const REPORTS_DIR = path.resolve('output/reports');

interface Mapping {
  slug: string;
  branch: string;
  source: 'intake' | 'deploy-map';
}

function parseDeployMap(): Map<string, string> {
  const out = new Map<string, string>();
  if (!fs.existsSync(DEPLOY_MAP_PATH)) return out;
  const content = fs.readFileSync(DEPLOY_MAP_PATH, 'utf-8');
  const re = /DEPLOY_MAP\["([^"]+)"\]\s*=\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    out.set(m[1], m[2]);
  }
  return out;
}

function parseIntake(): Map<string, string> {
  const out = new Map<string, string>();
  // Path relativo ao workspace; tenta varias localizacoes
  const candidates = [
    CHECKLIST_PATH,
    path.resolve('../../wbs/micro-sites/intake-review/INTAKE-CHECKLIST.md'),
    path.resolve('output/wbs/micro-sites/intake-review/INTAKE-CHECKLIST.md'),
  ];
  let content = '';
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      content = fs.readFileSync(c, 'utf-8');
      break;
    }
  }
  if (!content) return out;

  // Padrao tipico: linha contendo `<slug>` e `deploy-NN` proximo (mesma linha ou ate 3 linhas adiante)
  const slugRe = /\b([abcdef]\d{2}-[\w-]+)\b/g;
  const branchRe = /\b(deploy-\d{2})\b/g;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let slugM: RegExpExecArray | null;
    slugRe.lastIndex = 0;
    while ((slugM = slugRe.exec(lines[i])) !== null) {
      // Procurar branch na mesma linha ou nas 3 seguintes
      branchRe.lastIndex = 0;
      const window = lines.slice(i, Math.min(i + 4, lines.length)).join('\n');
      const bm = window.match(branchRe);
      if (bm && !out.has(slugM[1])) {
        out.set(slugM[1], bm[0]);
      }
    }
  }

  return out;
}

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const deployMap = parseDeployMap();
  const intake = parseIntake();

  const divergencias: Array<{ slug: string; intake?: string; deploy: string }> = [];
  const onlyInIntake: string[] = [];
  const onlyInDeploy: string[] = [];

  // Sites no deploy-map
  for (const [slug, branch] of deployMap) {
    const inIntake = intake.get(slug);
    if (!inIntake) {
      onlyInDeploy.push(slug);
    } else if (inIntake !== branch) {
      divergencias.push({ slug, intake: inIntake, deploy: branch });
    }
  }
  // Sites apenas no intake
  for (const [slug] of intake) {
    if (!deployMap.has(slug)) onlyInIntake.push(slug);
  }

  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(REPORTS_DIR, `branch-ids-audit-${date}.md`);
  const lines = [
    `# Branch IDs Audit — ${date}`,
    '',
    `Total deploy-map: ${deployMap.size}`,
    `Total intake (mencoes detectadas): ${intake.size}`,
    `Divergencias: ${divergencias.length}`,
    `Apenas em intake: ${onlyInIntake.length}`,
    `Apenas em deploy-map: ${onlyInDeploy.length}`,
    '',
    '## Divergencias',
    '',
    divergencias.length === 0
      ? 'Nenhuma divergencia entre INTAKE e deploy-map.sh.'
      : '| Slug | INTAKE | deploy-map | Acao |\n|---|---|---|---|',
    ...divergencias.map(
      (d) => `| ${d.slug} | ${d.intake ?? '-'} | ${d.deploy} | reconciliar (vide BRANCH-ID-RECONCILIATION.md) |`,
    ),
    '',
    '## Apenas em deploy-map (sites em producao mas nao mencionados no INTAKE)',
    '',
    onlyInDeploy.length === 0 ? '_(nenhum)_' : onlyInDeploy.map((s) => `- ${s}`).join('\n'),
    '',
    '## Apenas em INTAKE (mencionados em checklist mas sem mapping)',
    '',
    onlyInIntake.length === 0 ? '_(nenhum)_' : onlyInIntake.map((s) => `- ${s}`).join('\n'),
  ];
  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf-8');
  console.log(`[branch-audit] ${file}`);
  console.log(`[branch-audit] divergencias=${divergencias.length}`);
}

main();
