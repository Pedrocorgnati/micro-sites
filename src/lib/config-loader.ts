import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import type { SiteConfig, SiteContent, BlogArticle, CategorySlug, SiteCategory } from '@/types';
import { ACCENT_COLORS as COLORS, CTA_LABELS } from '@/types';

const SITES_DIR = path.join(process.cwd(), 'sites');

// ============================================================
// Config Loader
// ============================================================

export function loadSiteConfig(slug: string): SiteConfig {
  const configPath = path.join(SITES_DIR, slug, 'config.json');

  if (!fs.existsSync(configPath)) {
    // Retorna config padrão para preview/dev
    return getDefaultConfig(slug);
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw);

  // Normalizar campos legados
  const config: SiteConfig = {
    ...parsed,
    // wave pode vir como deployWave em configs antigos
    wave: parsed.wave ?? parsed.deployWave ?? 1,
    // Campos obrigatórios com defaults seguros
    accentColor: parsed.accentColor ?? COLORS[parsed.category as SiteCategory]?.accent ?? '#2563EB',
    hasBlog: parsed.hasBlog ?? false,
    schema: parsed.schema ?? ['Organization', 'FAQPage'],
  };

  // Garantir valores padrão
  if (!config.cta.primaryLabel) {
    config.cta.primaryLabel = CTA_LABELS[config.category] ?? 'Solicitar Orçamento';
  }

  return config;
}

// ============================================================
// Content Loader
// ============================================================

export function loadSiteContent(slug: string): SiteContent {
  const contentDir = path.join(SITES_DIR, slug, 'content');

  if (!fs.existsSync(contentDir)) {
    return getDefaultContent();
  }

  const content: SiteContent = {};

  // Problem
  const problemPath = path.join(contentDir, 'problem.md');
  if (fs.existsSync(problemPath)) {
    const { data, content: body } = matter(fs.readFileSync(problemPath, 'utf-8'));
    content.problem = {
      headline: data.headline as string | undefined,
      content: sanitizeHtml(marked(body) as string),
    };
  }

  // Solution
  const solutionPath = path.join(contentDir, 'solution.md');
  if (fs.existsSync(solutionPath)) {
    const { data, content: body } = matter(fs.readFileSync(solutionPath, 'utf-8'));
    content.solution = {
      headline: data.headline as string | undefined,
      content: sanitizeHtml(marked(body) as string),
    };
  }

  // Features
  const featuresPath = path.join(contentDir, 'features.json');
  if (fs.existsSync(featuresPath)) {
    const raw = JSON.parse(fs.readFileSync(featuresPath, 'utf-8'));
    content.features = raw;
  }

  // HowItWorks
  const howPath = path.join(contentDir, 'how-it-works.json');
  if (fs.existsSync(howPath)) {
    const raw = JSON.parse(fs.readFileSync(howPath, 'utf-8'));
    content.howItWorks = raw;
  }

  // Trust
  const trustPath = path.join(contentDir, 'trust.json');
  if (fs.existsSync(trustPath)) {
    const raw = JSON.parse(fs.readFileSync(trustPath, 'utf-8'));
    content.trust = raw;
  }

  // FAQs
  const faqPath = path.join(contentDir, 'faq.json');
  if (fs.existsSync(faqPath)) {
    const raw = JSON.parse(fs.readFileSync(faqPath, 'utf-8'));
    content.faqs = raw;
  }

  return content;
}

// ============================================================
// Blog Loader
// ============================================================

export function loadBlogArticles(slug: string): BlogArticle[] {
  const blogDir = path.join(SITES_DIR, slug, 'blog');

  if (!fs.existsSync(blogDir)) return [];

  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'));

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    const { data, content: body } = matter(raw);

    return {
      slug: file.replace('.md', ''),
      title: (data.title as string) ?? 'Artigo',
      description: (data.description as string) ?? '',
      author: data.author as string | undefined,
      date: (data.date as string) ?? new Date().toISOString().split('T')[0],
      readingTime: data.readingTime as number | undefined,
      tags: data.tags as string[] | undefined,
      body: sanitizeHtml(marked(body) as string),
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function loadBlogArticle(articleSlug: string, siteSlug: string): BlogArticle | null {
  const articles = loadBlogArticles(siteSlug);
  return articles.find((a) => a.slug === articleSlug) ?? null;
}

// ============================================================
// Accent CSS Injection
// ============================================================

export function getAccentStyle(config: SiteConfig): React.CSSProperties {
  const colors = COLORS[config.category];
  return {
    '--color-accent': colors.accent,
    '--color-accent-hover': colors.accentHover,
    '--color-on-accent': colors.onAccent,
    '--color-secondary': colors.secondary,
    '--color-on-secondary': colors.onSecondary,
  } as React.CSSProperties;
}

// ============================================================
// WhatsApp URL Builder
// ============================================================

export { buildWhatsAppUrl } from '@/lib/whatsapp';

// ============================================================
// Helpers internos
// ============================================================

function sanitizeHtml(html: string): string {
  // Server-side: DOMPurify requer browser, usar regex simples para remoção de scripts
  // (conteúdo é markdown confiável; apenas sanear tags de script/iframe)
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
             .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
}

function getDefaultConfig(slug: string): SiteConfig {
  return {
    slug: slug as CategorySlug,
    name: 'Meu Site',
    category: 'A',
    accentColor: '#2563EB',
    wave: 1,
    funnelStage: 'consideration',
    template: 'landing',
    hasBlog: false,
    schema: ['Organization', 'FAQPage'],
    sectionOrder: 'default',
    headline: 'Solução Profissional para o Seu Negócio',
    subheadline: 'Ajudamos pequenas e médias empresas a crescer com presença digital de qualidade.',
    seo: {
      title: 'Meu Site — Solução Digital',
      description: 'Ajudamos pequenas e médias empresas a crescer com presença digital de qualidade.',
      keywords: ['site profissional', 'presença digital'],
    },
    cta: {
      primaryLabel: 'Solicitar Orçamento Gratuito',
      formEndpoint: 'https://api.staticforms.xyz/submit',
      whatsappNumber: '5511999999999',
      whatsappMessage: 'Olá! Vim pelo site e gostaria de saber mais sobre os serviços.',
    },
    showSystemForgeLogo: true,
  };
}

function getDefaultContent(): SiteContent {
  return {
    problem: {
      headline: 'Você reconhece algum desses problemas?',
      content: '<ul><li>Seu negócio ainda não tem presença digital adequada</li><li>Você está perdendo clientes para a concorrência online</li><li>Não sabe por onde começar na transformação digital</li></ul>',
    },
    solution: {
      headline: 'Nossa solução',
      content: '<p>Desenvolvemos soluções digitais sob medida para o seu negócio, com foco em resultados reais e crescimento sustentável.</p>',
    },
    features: {
      headline: 'Por que escolher nossa solução?',
      items: [
        { title: 'Rápido e Eficiente', description: 'Entregamos resultados em tempo recorde, sem comprometer a qualidade.' },
        { title: 'Focado em Conversão', description: 'Cada detalhe é pensado para transformar visitantes em clientes.' },
        { title: 'Suporte Contínuo', description: 'Estamos ao seu lado em todas as etapas, do início ao sucesso.' },
      ],
    },
    howItWorks: {
      headline: 'Como funciona em 3 passos',
      steps: [
        { title: 'Diagnóstico', description: 'Entendemos seu negócio e seus objetivos em uma conversa inicial.' },
        { title: 'Desenvolvimento', description: 'Criamos a solução ideal com foco em resultados mensuráveis.' },
        { title: 'Lançamento', description: 'Colocamos no ar e acompanhamos o desempenho de perto.' },
      ],
    },
    trust: {
      headline: 'Resultados que falam por si',
      stats: [
        { value: '50+', label: 'Projetos entregues' },
        { value: '98%', label: 'Clientes satisfeitos' },
        { value: '5★', label: 'Avaliação média' },
      ],
    },
    cta: {
      headline: 'Pronto para começar?',
    },
    faqs: {
      headline: 'Perguntas Frequentes',
      items: [
        { question: 'Quanto tempo leva para ficar pronto?', answer: 'O prazo varia conforme a complexidade do projeto. Projetos simples ficam prontos em 1 a 2 semanas.' },
        { question: 'Qual é o investimento?', answer: 'Temos planos para diferentes orçamentos. Entre em contato para um orçamento personalizado.' },
        { question: 'Vocês oferecem suporte após a entrega?', answer: 'Sim, oferecemos suporte contínuo e manutenção para garantir que tudo funcione perfeitamente.' },
      ],
    },
  };
}
