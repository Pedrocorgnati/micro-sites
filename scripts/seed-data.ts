#!/usr/bin/env tsx
/**
 * scripts/seed-data.ts
 * Auditoria e reparo idempotente dos dados de filesystem (config.json + content/)
 * Este projeto NÃO usa banco de dados — o filesystem é a fonte da verdade.
 *
 * Modos:
 *   --validate   (padrão) Audita todos os sites, lista issues sem alterar nada
 *   --fix        Corrige issues reparáveis (enums inválidos, arquivos ausentes)
 *   --force      Como --fix, mas recria arquivos de conteúdo mesmo se existirem
 *
 * Uso:
 *   npm run data:seed              # validação
 *   npm run data:seed -- --fix     # reparo
 *   npm run data:seed -- --force   # regeneração forçada
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { SiteConfigSchema } from '@/schemas/config';

// ─── Tipos locais ────────────────────────────────────────────────────────────

interface SeedIssue {
  site: string;
  severity: 'CRITICO' | 'IMPORTANTE' | 'AVISO';
  field: string;
  message: string;
  autoFixable: boolean;
}

interface SiteAudit {
  slug: string;
  configValid: boolean;
  contentFiles: string[];
  missingContent: string[];
  blogArticles: number;
  issues: SeedIssue[];
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const SITES_DIR = path.join(process.cwd(), 'sites');

// Arquivos de conteúdo obrigatórios por template
const REQUIRED_CONTENT: Record<string, string[]> = {
  landing:   ['problem.md', 'solution.md', 'features.json', 'faq.json', 'how-it-works.json', 'trust.json'],
  calculator:['problem.md', 'solution.md', 'features.json', 'faq.json', 'how-it-works.json', 'trust.json'],
  blog:      ['problem.md', 'solution.md', 'features.json', 'faq.json', 'how-it-works.json', 'trust.json'],
  waitlist:  ['problem.md', 'solution.md', 'features.json', 'faq.json', 'trust.json'],
};

// Mapeamento de substituição de enums inválidos no campo schema[]
const SCHEMA_TYPE_FIXES: Record<string, string> = {
  SoftwareApplication: 'Organization',   // E sites — produto SaaS → fallback Organization
  WebApplication:      'HowTo',          // D sites — calculadoras → HowTo descreve o processo
};

// ─── Templates de conteúdo de fallback ───────────────────────────────────────

function makeHowItWorksJson(siteName: string): object {
  return {
    headline: `Como funciona a ${siteName}`,
    steps: [
      {
        number: 1,
        title: 'Acesse e explore',
        description: 'Entre na plataforma e descubra como podemos resolver seu problema específico.',
      },
      {
        number: 2,
        title: 'Informe seus dados',
        description: 'Preencha as informações solicitadas para personalizarmos a solução para você.',
      },
      {
        number: 3,
        title: 'Receba seu resultado',
        description: 'Obtenha o diagnóstico, cálculo ou resultado e entre em contato para dar o próximo passo.',
      },
    ],
  };
}

// ─── Funções de auditoria ─────────────────────────────────────────────────────

function auditSite(slug: string): SiteAudit {
  const siteDir = path.join(SITES_DIR, slug);
  const configPath = path.join(siteDir, 'config.json');
  const contentDir = path.join(siteDir, 'content');
  const issues: SeedIssue[] = [];

  // Ler config
  if (!fs.existsSync(configPath)) {
    return {
      slug,
      configValid: false,
      contentFiles: [],
      missingContent: [],
      blogArticles: 0,
      issues: [{
        site: slug,
        severity: 'CRITICO',
        field: 'config.json',
        message: 'Arquivo config.json ausente',
        autoFixable: false,
      }],
    };
  }

  let rawConfig: unknown;
  try {
    rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    return {
      slug,
      configValid: false,
      contentFiles: [],
      missingContent: [],
      blogArticles: 0,
      issues: [{
        site: slug,
        severity: 'CRITICO',
        field: 'config.json',
        message: `JSON inválido: ${e instanceof Error ? e.message : String(e)}`,
        autoFixable: false,
      }],
    };
  }

  // Verificar enums inválidos em schema[] ANTES da validação Zod (para poder sugerir fix)
  const rawObj = rawConfig as Record<string, unknown>;
  const schemaArr = Array.isArray(rawObj['schema']) ? rawObj['schema'] as string[] : [];
  const invalidSchemaTypes = schemaArr.filter((t) => SCHEMA_TYPE_FIXES[t] !== undefined);
  if (invalidSchemaTypes.length > 0) {
    issues.push({
      site: slug,
      severity: 'CRITICO',
      field: 'schema',
      message: `Tipo(s) de schema inválido(s): ${invalidSchemaTypes.join(', ')}. Zod enum aceita: Organization, FAQPage, HowTo, LocalBusiness, Product, Article`,
      autoFixable: true,
    });
  }

  // Validar com Zod
  const result = SiteConfigSchema.safeParse(rawConfig);
  const configValid = result.success;
  if (!result.success) {
    const zodErrors = result.error.issues.filter(
      (i) => !(i.path[0] === 'schema') // já reportamos schema acima
    );
    for (const issue of zodErrors) {
      issues.push({
        site: slug,
        severity: 'CRITICO',
        field: issue.path.join('.') || 'config',
        message: issue.message,
        autoFixable: false,
      });
    }
  }

  // Verificar conteúdo
  const template = (rawObj['template'] as string) || 'landing';
  const required = REQUIRED_CONTENT[template] ?? REQUIRED_CONTENT['landing'];
  const existingContent = fs.existsSync(contentDir)
    ? fs.readdirSync(contentDir).filter((f) => !f.startsWith('.'))
    : [];
  const missingContent = required.filter((f) => !existingContent.includes(f));

  for (const missing of missingContent) {
    issues.push({
      site: slug,
      severity: 'IMPORTANTE',
      field: `content/${missing}`,
      message: `Arquivo de conteúdo ausente: ${missing}`,
      autoFixable: missing.endsWith('.json'),
    });
  }

  // Verificar hasBlog vs artigos reais
  // Contar artigos: suporta blog/articles/*.md E blog/*.md (estrutura legada)
  const hasBlog = rawObj['hasBlog'] === true;
  let blogArticles = 0;
  const blogRootDir = path.join(siteDir, 'blog');
  const blogArticlesDir = path.join(blogRootDir, 'articles');
  if (fs.existsSync(blogArticlesDir)) {
    blogArticles += fs.readdirSync(blogArticlesDir).filter((f) => f.endsWith('.md')).length;
  }
  if (fs.existsSync(blogRootDir)) {
    blogArticles += fs.readdirSync(blogRootDir).filter((f) => f.endsWith('.md')).length;
  }
  if (hasBlog && blogArticles === 0) {
    issues.push({
      site: slug,
      severity: 'IMPORTANTE',
      field: 'blog',
      message: 'hasBlog=true mas nenhum artigo encontrado em blog/articles/',
      autoFixable: false,
    });
  }

  return {
    slug,
    configValid: configValid && invalidSchemaTypes.length === 0,
    contentFiles: existingContent,
    missingContent,
    blogArticles,
    issues,
  };
}

// ─── Funções de reparo ────────────────────────────────────────────────────────

function fixSchemaTypes(slug: string): boolean {
  const configPath = path.join(SITES_DIR, slug, 'config.json');
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
  const schemaArr = (raw['schema'] as string[]) || [];
  const fixed = schemaArr.map((t) => SCHEMA_TYPE_FIXES[t] ?? t);

  if (JSON.stringify(fixed) === JSON.stringify(schemaArr)) return false;

  raw['schema'] = fixed;
  fs.writeFileSync(configPath, JSON.stringify(raw, null, 2) + '\n');
  return true;
}

function fixMissingHowItWorks(slug: string, siteName: string, force: boolean): boolean {
  const target = path.join(SITES_DIR, slug, 'content', 'how-it-works.json');
  if (fs.existsSync(target) && !force) return false;

  fs.mkdirSync(path.dirname(target), { recursive: true });
  const content = makeHowItWorksJson(siteName);
  fs.writeFileSync(target, JSON.stringify(content, null, 2) + '\n');
  return true;
}

// ─── Entrypoint ───────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--force') ? 'force'
             : args.includes('--fix')   ? 'fix'
             : 'validate';

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  seed-data — modo: ${mode.toUpperCase()}`);
  console.log('  Projeto: Micro Sites — Rede de Aquisição SystemForge');
  console.log('  Fonte de dados: filesystem (sites/{slug}/config.json)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Listar todos os sites (excluindo _template)
  const siteSlugs = fs.readdirSync(SITES_DIR)
    .filter((d) => !d.startsWith('_') && !d.startsWith('.') && fs.statSync(path.join(SITES_DIR, d)).isDirectory())
    .sort();

  console.log(`Auditando ${siteSlugs.length} sites...\n`);

  const audits: SiteAudit[] = siteSlugs.map((slug) => auditSite(slug));

  // Exibir resultados por site
  for (const audit of audits) {
    const status = audit.issues.length === 0 ? '✓' : '✗';
    const criticos = audit.issues.filter((i) => i.severity === 'CRITICO').length;
    const importantes = audit.issues.filter((i) => i.severity === 'IMPORTANTE').length;
    const avisos = audit.issues.filter((i) => i.severity === 'AVISO').length;

    if (audit.issues.length === 0) {
      console.log(`  ${status} ${audit.slug.padEnd(40)} blog: ${String(audit.blogArticles).padStart(2)} artigos`);
    } else {
      const tags = [
        criticos   > 0 ? `${criticos} CRITICO`    : '',
        importantes > 0 ? `${importantes} IMPORTANTE` : '',
        avisos      > 0 ? `${avisos} AVISO`         : '',
      ].filter(Boolean).join(', ');
      console.log(`  ${status} ${audit.slug.padEnd(40)} [${tags}]`);
      for (const issue of audit.issues) {
        const fixTag = issue.autoFixable ? ' (auto-fixable)' : '';
        console.log(`      → [${issue.severity}] ${issue.field}: ${issue.message}${fixTag}`);
      }
    }

    // Aplicar correções se modo --fix ou --force
    if (mode === 'fix' || mode === 'force') {
      const rawConfig = JSON.parse(
        fs.readFileSync(path.join(SITES_DIR, audit.slug, 'config.json'), 'utf-8')
      ) as Record<string, unknown>;
      const siteName = (rawConfig['name'] as string) ?? audit.slug;

      for (const issue of audit.issues) {
        if (!issue.autoFixable) continue;

        if (issue.field === 'schema') {
          const fixed = fixSchemaTypes(audit.slug);
          if (fixed) console.log(`      ✔ Corrigido schema[] em ${audit.slug}/config.json`);
        }

        if (issue.field.startsWith('content/') && issue.field.endsWith('how-it-works.json')) {
          const fixed = fixMissingHowItWorks(audit.slug, siteName, mode === 'force');
          if (fixed) console.log(`      ✔ Criado ${audit.slug}/content/how-it-works.json`);
        }
      }
    }
  }

  // Sumário
  const totalIssues = audits.flatMap((a) => a.issues);
  const criticos   = totalIssues.filter((i) => i.severity === 'CRITICO').length;
  const importantes = totalIssues.filter((i) => i.severity === 'IMPORTANTE').length;
  const sitesOk    = audits.filter((a) => a.issues.length === 0).length;
  const totalBlogs = audits.reduce((acc, a) => acc + a.blogArticles, 0);
  const sitesComBlog = audits.filter((a) => a.blogArticles > 0).length;

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Sites auditados:  ${audits.length}`);
  console.log(`  Sites OK:         ${sitesOk}`);
  console.log(`  Issues CRITICO:   ${criticos}`);
  console.log(`  Issues IMPORTANTE:${importantes}`);
  console.log(`  Artigos de blog:  ${totalBlogs} (em ${sitesComBlog} sites)`);

  if (mode !== 'validate') {
    const fixable = totalIssues.filter((i) => i.autoFixable).length;
    console.log(`  Issues corrigidos: ${fixable}`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  if (mode === 'validate' && criticos > 0) {
    console.log(`  ⚠  ${criticos} issue(s) CRITICO(s) encontrado(s).`);
    console.log('     Execute com --fix para corrigir automaticamente os reparáveis.');
    console.log('');
    process.exit(1);
  }

  if (mode === 'validate' && criticos === 0) {
    console.log('  ✅ Validação concluída sem issues críticos.');
    console.log('');
  }

  if (mode !== 'validate') {
    console.log('  ✅ Reparo concluído. Execute novamente sem flags para revalidar.');
    console.log('');
  }
}

main();
