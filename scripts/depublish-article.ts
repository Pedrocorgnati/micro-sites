// CL-087, CL-617 — despublicacao de artigo (move .md, edita index, injeta 301 em .htaccess)
//
// Uso:
//   tsx scripts/depublish-article.ts --site=<slug> --article=<slug> --reason=<motivo> [--dry-run]
//
// Exit codes: 0 ok, 1 erro de argumentos, 2 arquivo nao encontrado, 3 IO error

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ARGS = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? 'true'];
    }),
) as Record<string, string>;

const SITE = ARGS.site;
const ARTICLE = ARGS.article;
const REASON = ARGS.reason ?? 'unspecified';
const DRY = ARGS['dry-run'] === 'true' || ARGS.dry === 'true';

if (!SITE || !ARTICLE) {
  console.error('Uso: tsx scripts/depublish-article.ts --site=<slug> --article=<slug> --reason=<motivo> [--dry-run]');
  process.exit(1);
}

const ROOT = process.cwd();
const SITE_DIR = path.join(ROOT, 'sites', SITE);
const ARTICLE_PATH = path.join(SITE_DIR, 'blog', `${ARTICLE}.md`);
const ARCHIVED_DIR = path.join(SITE_DIR, 'blog', '.archived');
const ARCHIVED_PATH = path.join(ARCHIVED_DIR, `${ARTICLE}.md`);
const INDEX_PATH = path.join(SITE_DIR, 'blog-index.json');
const HTACCESS_PATH = path.join(SITE_DIR, '.htaccess');
const TEMPLATE_PATH = path.join(ROOT, 'sites', '_template', '.htaccess.template');

function log(msg: string) {
  console.log(`[depublish] ${DRY ? '(dry-run) ' : ''}${msg}`);
}

function archiveArticle() {
  if (!fs.existsSync(ARTICLE_PATH)) {
    console.error(`[depublish] artigo nao encontrado: ${ARTICLE_PATH}`);
    process.exit(2);
  }
  fs.mkdirSync(ARCHIVED_DIR, { recursive: true });
  const original = fs.readFileSync(ARTICLE_PATH, 'utf8');
  const frontmatterPrefix = `---\narchivedAt: ${new Date().toISOString()}\narchivedReason: "${REASON.replace(/"/g, '\\"')}"\n`;
  const updated = original.startsWith('---')
    ? original.replace(/^---\n/, frontmatterPrefix)
    : `${frontmatterPrefix}---\n\n${original}`;
  if (!DRY) {
    fs.writeFileSync(ARCHIVED_PATH, updated);
    fs.unlinkSync(ARTICLE_PATH);
  }
  log(`archivado: ${ARTICLE_PATH} -> ${ARCHIVED_PATH}`);
}

function updateIndex() {
  if (!fs.existsSync(INDEX_PATH)) {
    log(`blog-index.json nao existe — pulando`);
    return;
  }
  const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')) as { articles?: Array<{ slug: string }> };
  if (!Array.isArray(idx.articles)) {
    log('blog-index.json sem array articles — pulando');
    return;
  }
  const before = idx.articles.length;
  idx.articles = idx.articles.filter((a) => a.slug !== ARTICLE);
  const after = idx.articles.length;
  if (!DRY) fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2));
  log(`blog-index.json atualizado: ${before} -> ${after} artigos`);
}

function inject301() {
  if (!fs.existsSync(HTACCESS_PATH)) {
    if (!fs.existsSync(TEMPLATE_PATH)) {
      log('template .htaccess nao encontrado — criando minimo');
      if (!DRY) {
        fs.writeFileSync(
          HTACCESS_PATH,
          `RewriteEngine On\n\n# DEPUBLISHED_REDIRECTS_START\n# DEPUBLISHED_REDIRECTS_END\n`,
        );
      }
    } else if (!DRY) {
      fs.copyFileSync(TEMPLATE_PATH, HTACCESS_PATH);
    }
  }
  const content = fs.existsSync(HTACCESS_PATH) ? fs.readFileSync(HTACCESS_PATH, 'utf8') : '';
  const startMarker = '# DEPUBLISHED_REDIRECTS_START';
  const endMarker = '# DEPUBLISHED_REDIRECTS_END';
  const line = `Redirect 301 /blog/${ARTICLE} /blog`;
  let updated: string;
  if (content.includes(startMarker)) {
    updated = content.replace(endMarker, `${line}\n${endMarker}`);
  } else {
    updated = `${content}\n\n${startMarker}\n${line}\n${endMarker}\n`;
  }
  if (!DRY) fs.writeFileSync(HTACCESS_PATH, updated);
  log(`.htaccess atualizado com Redirect 301 /blog/${ARTICLE} -> /blog`);
}

function rebuildSitemap() {
  if (DRY) {
    log(`(skipping rebuild) — rodaria: bash scripts/build-site.sh ${SITE}`);
    return;
  }
  try {
    execSync(`bash scripts/build-site.sh ${SITE} --skip-og --skip-validate`, { stdio: 'inherit' });
    log('sitemap rebuilt');
  } catch (err) {
    console.error('[depublish] erro no rebuild — siga manualmente: ', err);
  }
}

archiveArticle();
updateIndex();
inject301();
rebuildSitemap();

console.log('[depublish] OK');
process.exit(0);
