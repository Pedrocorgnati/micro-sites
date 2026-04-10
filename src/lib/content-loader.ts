// src/lib/content-loader.ts
// ContentLoader canônico com rehype-sanitize (THREAT-010: XSS via markdown)
// Usa Zod para validação de configs (BUILD_001) e frontmatter (BUILD_004)
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import { rehype } from 'rehype';
import rehypeSanitize from 'rehype-sanitize';
import { SiteConfigSchema } from '@/schemas/config';
import { BlogArticleFrontmatterSchema } from '@/schemas/blog';
import type { SiteConfig, BlogArticle, PageContent } from '@/types';

const SITES_DIR = path.join(process.cwd(), 'sites');

/** Sanitiza HTML via rehype-sanitize (THREAT-010: XSS) */
async function sanitizeMarkdown(content: string): Promise<string> {
  const remarkResult = await remark().use(remarkHtml).process(content);
  const sanitizedResult = await rehype().use(rehypeSanitize).process(String(remarkResult));
  return String(sanitizedResult);
}

/** BUILD_001 — config não encontrado ou inválido: aborta build */
export function loadSiteConfig(slug: string): SiteConfig {
  const configPath = path.join(SITES_DIR, slug, 'config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(`[BUILD_001] Config não encontrado: sites/${slug}/config.json`);
  }

  const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const result = SiteConfigSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`[BUILD_001] Config inválido sites/${slug}/config.json:\n${errors}`);
  }

  return result.data;
}

/** BUILD_001 — valida todos os configs em build-time (agrega erros) */
export function validateAllConfigs(): void {
  const slugs = getAllSlugs();
  const errors: string[] = [];

  for (const slug of slugs) {
    try {
      loadSiteConfig(slug);
    } catch (err) {
      errors.push(String(err));
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[BUILD_001] ${errors.length} config(s) inválido(s):\n\n${errors.join('\n\n')}`
    );
  }
}

/** BUILD_003 — conteúdo markdown não encontrado */
export async function loadPageContent(slug: string, filename: string): Promise<PageContent> {
  const contentPath = path.join(SITES_DIR, slug, 'content', filename);

  if (!fs.existsSync(contentPath)) {
    throw new Error(`[BUILD_003] Conteúdo não encontrado: sites/${slug}/content/${filename}`);
  }

  const raw = fs.readFileSync(contentPath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);
  const html = await sanitizeMarkdown(content);

  return { filename, frontmatter, body: html };
}

/** Carrega e ordena artigos de blog (BUILD_004 em frontmatter inválido) */
export async function loadBlogArticles(slug: string): Promise<BlogArticle[]> {
  const blogDir = path.join(SITES_DIR, slug, 'blog');

  if (!fs.existsSync(blogDir)) return [];

  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'));
  const articles: BlogArticle[] = [];

  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data: fm, content } = matter(raw);

    // Normalizar: gray-matter parseia datas YAML como Date objects
    const normalizedFm = {
      ...fm,
      date: fm.date instanceof Date
        ? fm.date.toISOString().split('T')[0]
        : fm.date,
    };

    // BUILD_004 — frontmatter malformado
    const fmResult = BlogArticleFrontmatterSchema.safeParse(normalizedFm);
    if (!fmResult.success) {
      throw new Error(
        `[BUILD_004] Frontmatter inválido sites/${slug}/blog/${file}: ${fmResult.error.message}`
      );
    }

    const body = await sanitizeMarkdown(content);
    articles.push({ ...fmResult.data, body });
  }

  return articles.sort((a, b) => b.date.localeCompare(a.date));
}

/** Retorna todos os slugs de sites (exclui pastas ocultas como .template) */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(SITES_DIR)) return [];

  return fs
    .readdirSync(SITES_DIR)
    .filter(
      (name) =>
        !name.startsWith('.') &&
        !name.startsWith('_') &&
        fs.statSync(path.join(SITES_DIR, name)).isDirectory()
    );
}
