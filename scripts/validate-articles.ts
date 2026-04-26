#!/usr/bin/env tsx
/**
 * Valida frontmatter e word count de artigos de blog.
 * Uso: npm run validate:articles [--slug {site-slug}]
 * Exit: 0 se todos válidos, 1+ se erros encontrados
 * Fonte: TASK-1 ST001 (module-11-blog-pipeline)
 */
import { readdirSync, readFileSync } from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { validateArticleFrontmatter, calculateReadingTime } from '../src/lib/blog-validation';
import { BLOG_CONFIG } from '../src/lib/constants';

const SITES_DIR = path.join(process.cwd(), 'sites');

// Parsing de args: --slug {site}
const args = process.argv.slice(2);
const slugArgIdx = args.indexOf('--slug');
const slugArg = slugArgIdx !== -1 ? args[slugArgIdx + 1] : undefined;

let targetSlugs: string[];
try {
  targetSlugs = slugArg ? [slugArg] : readdirSync(SITES_DIR);
} catch {
  console.error(`✗ Diretório sites/ não encontrado em ${SITES_DIR}`);
  process.exit(1);
}

let totalArticles = 0;
let validArticles = 0;
let errorCount = 0;
const errors: { slug: string; file: string; issue: string }[] = [];

for (const slug of targetSlugs) {
  const blogDir = path.join(SITES_DIR, slug, 'blog', 'articles');
  let files: string[];

  try {
    files = readdirSync(blogDir).filter((f) => f.endsWith('.md'));
  } catch {
    // Site sem blog — skip silencioso (BDD [EDGE])
    continue;
  }

  for (const file of files) {
    totalArticles++;
    const filePath = path.join(blogDir, file);
    const rawContent = readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(rawContent);

    // Normalizar date: gray-matter pode retornar Date object
    if (data.date instanceof Date) {
      data.date = data.date.toISOString().split('T')[0];
    }

    // 1. Validar frontmatter com Zod
    const validation = validateArticleFrontmatter(data);
    if (!validation.valid) {
      errorCount++;
      validation.errors.forEach((err) => {
        const msg = `${err.path}: ${err.message}`;
        errors.push({ slug, file, issue: msg });
        console.error(`✗ ${slug}/blog/articles/${file}: ${msg}`);
      });
      continue;
    }

    // 2. Validar word count
    const wordCount = body.split(/\s+/).filter((w) => w.length > 0).length;
    if (wordCount < BLOG_CONFIG.MIN_WORD_COUNT) {
      errorCount++;
      const msg = `${wordCount} palavras (mínimo ${BLOG_CONFIG.MIN_WORD_COUNT})`;
      errors.push({ slug, file, issue: msg });
      console.error(`✗ ${slug}/blog/articles/${file}: ${msg}`);
      continue;
    }

    validArticles++;
    const readingTime = calculateReadingTime(body);
    console.log(`✓ ${slug}/blog/articles/${file} (${wordCount} palavras, ~${readingTime} min)`);
  }
}

// Relatório final
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('VALIDAÇÃO DE ARTIGOS — RELATÓRIO FINAL');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total processado: ${totalArticles}`);
console.log(`Válidos:          ${validArticles}`);
console.log(`Erros:            ${errorCount}`);

if (errorCount > 0) {
  console.log('\nERROS ENCONTRADOS:');
  errors.forEach((e) => {
    console.error(`  • ${e.slug}/blog/articles/${e.file}`);
    console.error(`    ${e.issue}`);
  });
  console.log('\n❌ Validação FALHOU. Corrija os erros acima e tente novamente.');
  process.exit(1);
} else {
  console.log(`\n✅ Validação OK — ${totalArticles} artigos aprovados`);
  process.exit(0);
}
