/**
 * validate-interlinking.ts
 * Valida as regras de interlinking entre artigos do blog.
 *
 * Regras:
 * - Mínimo de 2 links internos (/blog/) por artigo
 * - Máximo de 5 links internos por artigo
 * - Sem anchors proibidos (clique aqui, saiba mais, etc.)
 * - Links não devem apontar para slugs inexistentes
 * - Sem self-links
 * - Coerência de onda: crossLinks em sites/<slug>/config.json não devem
 *   apontar para sites com wave > wave do origem (gap CL-085, TASK-1 ST004).
 *
 * Flags:
 * - --slug=<slug>: valida um único site
 * - --wave=<1|2|3>: modo gate de onda — restringe a validação aos sites da
 *   onda N e falha se qualquer crossLink apontar para sites de ondas > N
 *   (ondas ainda não ativadas). Uso: rodar antes do deploy de cada onda
 *   (gap CL-102, TASK-2).
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BLOG_CONFIG, INTERLINKING_RULES } from '../src/lib/constants';
import {
  SiteManifestEntry,
  CrossLinkInput,
  extractSubdomain,
  SYSTEMFORGE_HOSTS,
  Wave,
} from '../src/lib/wave-interlinking';

const SITES_ROOT = path.join(process.cwd(), 'sites');

const MIN_LINKS = INTERLINKING_RULES.MIN_LINKS;
const MAX_LINKS = INTERLINKING_RULES.MAX_LINKS;
const MIN_ARTICLES_FOR_VALIDATION = INTERLINKING_RULES.MIN_ARTICLES_FOR_VALIDATION;
const FORBIDDEN_ANCHORS = [...INTERLINKING_RULES.FORBIDDEN_ANCHORS];

interface ArticleInfo {
  slug: string;
  title: string;
  site: string;
  filePath: string;
  body: string;
}

interface LinkIssue {
  type: 'error' | 'warning';
  message: string;
}

interface ArticleReport {
  article: string;
  linkCount: number;
  issues: LinkIssue[];
  ok: boolean;
}

// Extract all markdown links targeting /blog/ from body
function extractBlogLinks(body: string): Array<{ anchor: string; slug: string; raw: string }> {
  const linkRegex = /\[([^\]]+)\]\(\/blog\/([^)\s]+)\)/g;
  const links: Array<{ anchor: string; slug: string; raw: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(body)) !== null) {
    links.push({ anchor: match[1], slug: match[2], raw: match[0] });
  }
  return links;
}

// Load all articles for a given site
function loadSiteArticles(siteDir: string, slug: string): ArticleInfo[] {
  const articlesDir = path.join(siteDir, 'blog', 'articles');
  if (!fs.existsSync(articlesDir)) return [];

  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const filePath = path.join(articlesDir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);
    return {
      slug: data.slug ?? file.replace('.md', ''),
      title: data.title ?? file,
      site: slug,
      filePath: `${slug}/blog/articles/${file}`,
      body: content,
    };
  });
}

function validateArticleLinks(
  article: ArticleInfo,
  siteSlugSet: Set<string>,
): ArticleReport {
  const links = extractBlogLinks(article.body);
  const issues: LinkIssue[] = [];

  // Rule 1: Minimum links
  if (links.length < MIN_LINKS && siteSlugSet.size >= MIN_ARTICLES_FOR_VALIDATION) {
    issues.push({
      type: 'error',
      message: `Apenas ${links.length} link(s) interno(s) — mínimo é ${MIN_LINKS}`,
    });
  }

  // Rule 2: Maximum links
  if (links.length > MAX_LINKS) {
    issues.push({
      type: 'error',
      message: `${links.length} links internos — máximo é ${MAX_LINKS}`,
    });
  }

  for (const link of links) {
    // Rule 3: No forbidden anchors
    const anchorLower = link.anchor.toLowerCase().trim();
    for (const forbidden of FORBIDDEN_ANCHORS) {
      if (anchorLower === forbidden || anchorLower.includes(forbidden)) {
        issues.push({
          type: 'error',
          message: `Anchor proibido: "${link.anchor}" → "${link.slug}"`,
        });
      }
    }

    // Rule 4: No self-links
    if (link.slug === article.slug) {
      issues.push({
        type: 'error',
        message: `Self-link detectado: artigo aponta para si mesmo (${link.slug})`,
      });
    }

    // Rule 5: Target must exist in the same site
    if (!siteSlugSet.has(link.slug)) {
      issues.push({
        type: 'error',
        message: `Link para slug inexistente: /blog/${link.slug}`,
      });
    }
  }

  return {
    article: article.filePath,
    linkCount: links.length,
    issues,
    ok: issues.filter((i) => i.type === 'error').length === 0,
  };
}

function main(): void {
  const slugArg = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1];
  const waveArg = process.argv.find((a) => a.startsWith('--wave='))?.split('=')[1];
  const waveGate: Wave | null =
    waveArg === '1' || waveArg === '2' || waveArg === '3' ? (Number(waveArg) as Wave) : null;
  if (waveArg && waveGate === null) {
    console.error(`❌ --wave inválido: "${waveArg}" (use 1, 2 ou 3)`);
    process.exit(1);
  }

  if (!fs.existsSync(SITES_ROOT)) {
    console.error('❌ Diretório sites/ não encontrado');
    process.exit(1);
  }

  const siteEntries = fs
    .readdirSync(SITES_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && (!slugArg || d.name === slugArg));

  if (siteEntries.length === 0) {
    console.error(`❌ Nenhum site encontrado${slugArg ? ` para slug: ${slugArg}` : ''}`);
    process.exit(1);
  }

  const allReports: ArticleReport[] = [];
  let totalArticles = 0;

  for (const siteEntry of siteEntries) {
    const siteDir = path.join(SITES_ROOT, siteEntry.name);
    const articles = loadSiteArticles(siteDir, siteEntry.name);
    if (articles.length === 0) continue;

    totalArticles += articles.length;
    const siteSlugSet = new Set(articles.map((a) => a.slug));

    for (const article of articles) {
      const report = validateArticleLinks(article, siteSlugSet);
      allReports.push(report);

      if (report.ok) {
        console.log(`✓ ${report.article} (${report.linkCount} links)`);
      } else {
        console.log(`✗ ${report.article} (${report.linkCount} links)`);
        for (const issue of report.issues) {
          const icon = issue.type === 'error' ? '  ❌' : '  ⚠️';
          console.log(`${icon} ${issue.message}`);
        }
      }
    }
  }

  const errorCount = allReports.filter((r) => !r.ok).length;
  const okCount = allReports.filter((r) => r.ok).length;

  // Validação de coerência de onda em crossLinks de config.json
  // Quando --wave=N é passado, valida que sites da onda N só linkam para
  // ondas <= N (ou seja, ondas já deployadas no momento do deploy da onda N).
  const waveErrors = validateWaveCoherence(waveGate);
  const errorCountWithWave = errorCount + waveErrors.length;

  console.log('\n' + '━'.repeat(50));
  console.log('VALIDAÇÃO DE INTERLINKING — RELATÓRIO FINAL');
  console.log('━'.repeat(50));
  console.log(`Total processado: ${totalArticles}`);
  console.log(`Válidos:          ${okCount}`);
  console.log(`Erros (blog):     ${errorCount}`);
  console.log(`Erros (onda):     ${waveErrors.length}`);

  if (waveErrors.length > 0) {
    console.log('\nERROS DE COERÊNCIA DE ONDA:');
    for (const we of waveErrors) console.log(`  • ${we}`);
  }

  if (errorCountWithWave > 0) {
    const issues: string[] = [];
    for (const report of allReports.filter((r) => !r.ok)) {
      for (const issue of report.issues.filter((i) => i.type === 'error')) {
        issues.push(`  • ${report.article}\n    ${issue.message}`);
      }
    }
    console.log('\nERROS ENCONTRADOS:');
    console.log(issues.join('\n'));
    console.log('\n❌ Validação FALHOU. Corrija os erros acima e tente novamente.');
    process.exit(1);
  }

  console.log('\n✅ Validação OK — interlinking aprovado');
  process.exit(0);
}

function validateWaveCoherence(waveGate: Wave | null = null): string[] {
  const errors: string[] = [];
  if (!fs.existsSync(SITES_ROOT)) return errors;

  const manifest: SiteManifestEntry[] = [];
  const sitesData: Array<{ slug: string; wave: Wave; crossLinks: CrossLinkInput[] }> = [];

  for (const dir of fs.readdirSync(SITES_ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name.startsWith('_')) continue;
    const cfgPath = path.join(SITES_ROOT, dir.name, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as {
        slug?: string;
        wave?: Wave;
        crossLinks?: CrossLinkInput[];
      };
      if (cfg.wave !== 1 && cfg.wave !== 2 && cfg.wave !== 3) continue;
      const slug = cfg.slug ?? dir.name;
      manifest.push({ slug, wave: cfg.wave });
      sitesData.push({ slug, wave: cfg.wave, crossLinks: cfg.crossLinks ?? [] });
    } catch {
      errors.push(`${cfgPath}: JSON inválido`);
    }
  }

  for (const site of sitesData) {
    if (waveGate !== null && site.wave !== waveGate) continue;
    for (const link of site.crossLinks) {
      const sub = extractSubdomain(link.href);
      if (!sub) {
        errors.push(`${site.slug}: crossLink inválido (não-HTTPS ou URL malformada) → ${link.href}`);
        continue;
      }
      if (SYSTEMFORGE_HOSTS.includes(sub)) continue;
      const target = manifest.find((m) => m.slug === sub || m.slug.startsWith(`${sub}-`));
      if (!target) {
        errors.push(`${site.slug}: crossLink aponta para slug desconhecido → ${sub}`);
        continue;
      }
      if (target.wave > site.wave) {
        errors.push(
          `${site.slug} (wave ${site.wave}) → ${target.slug} (wave ${target.wave}): destino em onda posterior (não deployado)`,
        );
      }
      // Gate adicional: quando --wave=N é passado, o destino deve estar ≤ N.
      if (waveGate !== null && target.wave > waveGate) {
        errors.push(
          `[wave-gate=${waveGate}] ${site.slug} → ${target.slug}: destino em wave ${target.wave} (ainda não ativado no deploy da onda ${waveGate})`,
        );
      }
    }
  }

  return errors;
}

main();
