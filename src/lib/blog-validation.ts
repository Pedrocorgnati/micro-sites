// src/lib/blog-validation.ts
// Funções de validação centralizadas para artigos de blog
// Fonte: TASK-0 ST001 (module-11-blog-pipeline)
import { BlogArticleFrontmatterSchema } from '@/schemas/blog';
import { BLOG_CONFIG } from '@/lib/constants';

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: true;
  data: ReturnType<typeof BlogArticleFrontmatterSchema.parse>;
}

export interface ValidationFailure {
  valid: false;
  errors: ValidationError[];
}

/**
 * Valida frontmatter de um artigo de blog.
 * Nunca lança exceção — sempre retorna resultado estruturado.
 * Fonte: TASK-0 ST001 BDD [DEGRADED]
 */
export function validateArticleFrontmatter(
  data: unknown
): ValidationResult | ValidationFailure {
  const result = BlogArticleFrontmatterSchema.safeParse(data);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join('.') || '(raiz)',
        message: issue.message,
        code: issue.code,
      })),
    };
  }

  return { valid: true, data: result.data };
}

/**
 * Valida word count mínimo de um artigo.
 * @param body - Corpo do artigo (sem frontmatter)
 * @param minWords - Mínimo de palavras (padrão: BLOG_CONFIG.MIN_WORD_COUNT)
 */
export function validateWordCount(
  body: string,
  minWords = BLOG_CONFIG.MIN_WORD_COUNT
): { valid: boolean; count: number; min: number } {
  const count = body.split(/\s+/).filter((w) => w.length > 0).length;
  return { valid: count >= minWords, count, min: minWords };
}

/**
 * Calcula reading time estimado em minutos.
 * @param body - Corpo do artigo (sem frontmatter)
 */
export function calculateReadingTime(body: string): number {
  const wordCount = body.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.ceil(wordCount / BLOG_CONFIG.READING_TIME_WORDS_PER_MIN);
}

/**
 * Retorna lista de erros de validação como strings formatadas em PT-BR.
 * Útil para output de CLI.
 */
export function getValidationErrors(data: unknown): string[] {
  const result = validateArticleFrontmatter(data);
  if (result.valid) return [];
  return result.errors.map((e) => `${e.path}: ${e.message}`);
}
