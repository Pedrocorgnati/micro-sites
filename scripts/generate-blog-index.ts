#!/usr/bin/env tsx
/**
 * Gera JSON index para Fuse.js search em cada site com blog.
 * Entrada:  sites/{slug}/blog/articles/*.md
 * Saída:    sites/{slug}/blog-index.json
 * Uso:      npm run generate:blog-index
 * Exit:     0 sempre (erros por site são não-bloqueantes)
 * Fonte: TASK-1 ST002 (module-11-blog-pipeline)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { calculateReadingTime } from '../src/lib/blog-validation';

const SITES_DIR = path.join(process.cwd(), 'sites');

let totalIndexed = 0;
let totalSites = 0;

let slugs: string[];
try {
  slugs = readdirSync(SITES_DIR);
} catch {
  console.error(`✗ Diretório sites/ não encontrado em ${SITES_DIR}`);
  process.exit(0); // não-bloqueante
}

for (const slug of slugs) {
  const blogDir = path.join(SITES_DIR, slug, 'blog', 'articles');

  if (!existsSync(blogDir)) continue;

  totalSites++;
  let files: string[];

  try {
    files = readdirSync(blogDir).filter((f) => f.endsWith('.md'));
  } catch {
    console.warn(`⚠️  ${slug}: erro ao ler blog/articles (pulando)`);
    continue;
  }

  if (files.length === 0) {
    console.log(`⊘ ${slug}: nenhum artigo (pulando)`);
    continue;
  }

  // Parse e indexar artigos
  const articles = files
    .map((file) => {
      const filePath = path.join(blogDir, file);
      const rawContent = readFileSync(filePath, 'utf-8');
      const { data, content: body } = matter(rawContent);

      // Normalizar date
      const rawDate = data.date instanceof Date
        ? data.date.toISOString().split('T')[0]
        : (data.date as string) ?? new Date().toISOString().split('T')[0];

      const readingTime = calculateReadingTime(body);

      return {
        slug: (data.slug as string) ?? file.replace(/\.md$/, ''),
        title: (data.title as string) ?? '(sem título)',
        description: (data.description as string) ?? '',
        tags: (data.tags as string[]) ?? [],
        date: rawDate,
        readingTime,
        category: (data.category as string) ?? undefined,
        funnelStage: (data.funnelStage as string) ?? undefined,
      };
    })
    // Ordena por date DESC (artigos mais novos primeiro)
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

  // Escrever JSON em sites/{slug}/blog-index.json
  const indexPath = path.join(SITES_DIR, slug, 'blog-index.json');
  writeFileSync(indexPath, JSON.stringify(articles, null, 2), 'utf-8');

  console.log(`✓ ${slug}: ${articles.length} artigos indexados`);
  totalIndexed += articles.length;
}

// Relatório final
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('GERAÇÃO DE ÍNDICES — RELATÓRIO FINAL');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Sites processados:       ${totalSites}`);
console.log(`Total artigos indexados: ${totalIndexed}`);
if (totalSites > 0) {
  console.log(`Arquivos:                sites/{slug}/blog-index.json`);
}

if (totalIndexed === 0) {
  console.warn('\n⚠️  Nenhum artigo encontrado. Verifique sites/{slug}/blog/articles/');
}

process.exit(0);
