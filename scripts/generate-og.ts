#!/usr/bin/env tsx
/**
 * generate-og.ts — Gerador de OG Image (1200×630) para micro-sites
 *
 * Usa Satori (JSX → SVG) + @resvg/resvg-js (SVG → PNG via WASM)
 * Lê sites/{slug}/config.json para obter nome, categoria e cor de acento.
 *
 * Uso:
 *   SITE_SLUG=c01-site-institucional-pme npx tsx scripts/generate-og.ts
 *   npx tsx scripts/generate-og.ts c01-site-institucional-pme
 *
 * Dependências (instalar separadamente):
 *   npm install satori @resvg/resvg-js
 *   (não incluídas no package.json base pois só são usadas no build pipeline)
 */

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const ROOT_DIR = path.resolve(__dirname, '..');
const SLUG = process.argv[2] ?? process.env.SITE_SLUG ?? '';

if (!SLUG) {
  console.error('[generate-og] ERRO: Informe o slug como argumento ou via SITE_SLUG env');
  console.error('  Uso: npx tsx scripts/generate-og.ts <slug>');
  process.exit(1);
}

const CONFIG_PATH = path.join(ROOT_DIR, 'sites', SLUG, 'config.json');
const OUTPUT_DIR  = path.join(ROOT_DIR, 'dist', SLUG);
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'og-image.png');

// ---------------------------------------------------------------------------
// Leitura do config
// ---------------------------------------------------------------------------

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`[generate-og] ERRO: config.json não encontrado: ${CONFIG_PATH}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as {
  slug: string;
  name: string;
  category: string;
  seo?: { title?: string; description?: string };
};

// Mapa de cores por categoria (espelha ACCENT_COLORS em src/types/index.ts)
const ACCENT_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  A: { bg: '#2563EB', text: '#FFFFFF', badge: 'Nicho Vertical' },
  B: { bg: '#EA580C', text: '#FFFFFF', badge: 'Solução para Dor' },
  C: { bg: '#059669', text: '#FFFFFF', badge: 'Serviço Digital' },
  D: { bg: '#7C3AED', text: '#FFFFFF', badge: 'Ferramenta Interativa' },
  E: { bg: '#0891B2', text: '#FFFFFF', badge: 'Lista de Espera' },
  F: { bg: '#1E40AF', text: '#FFFFFF', badge: 'Blog Educativo' },
};

const colors = ACCENT_COLORS[config.category] ?? ACCENT_COLORS['A'];
const siteTitle = config.seo?.title ?? config.name;
const siteDesc  = config.seo?.description ?? 'Solução digital profissional para o seu negócio.';

// Trunca textos longos para a OG image
const displayTitle = siteTitle.length > 55 ? siteTitle.slice(0, 52) + '...' : siteTitle;
const displayDesc  = siteDesc.length  > 90 ? siteDesc.slice(0, 87)  + '...' : siteDesc;

// ---------------------------------------------------------------------------
// Geração da imagem via Satori + @resvg/resvg-js
// ---------------------------------------------------------------------------

async function generateOGImage(): Promise<void> {
  // Importações dinâmicas para evitar erro se não estiverem instaladas
  let satori: typeof import('satori').default;
  let Resvg: typeof import('@resvg/resvg-js').Resvg;

  try {
    const satoriModule = await import('satori');
    satori = satoriModule.default;
  } catch {
    console.error('[generate-og] ERRO: satori não instalado. Execute: npm install satori');
    process.exit(1);
  }

  try {
    const resvgModule = await import('@resvg/resvg-js');
    Resvg = resvgModule.Resvg;
  } catch {
    console.error('[generate-og] ERRO: @resvg/resvg-js não instalado. Execute: npm install @resvg/resvg-js');
    process.exit(1);
  }

  // Verifica que o diretório de output existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error(`[generate-og] ERRO: Diretório dist/${SLUG}/ não existe. Execute build primeiro.`);
    process.exit(1);
  }

  // Carrega fonte Inter (usa a da Vercel/Google se disponível localmente)
  // Fallback: usa sistema de fontes CSS
  let fontData: ArrayBuffer | null = null;
  const possibleFontPaths = [
    path.join(ROOT_DIR, 'public', 'fonts', 'Inter-Bold.ttf'),
    path.join(ROOT_DIR, 'node_modules', '@fontsource', 'inter', 'files', 'inter-latin-700-normal.woff'),
  ];

  for (const fontPath of possibleFontPaths) {
    if (fs.existsSync(fontPath)) {
      fontData = fs.readFileSync(fontPath).buffer as ArrayBuffer;
      break;
    }
  }

  // Layout JSX para o Satori (retorna objeto React-like sem depender do React)
  const element = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: colors.bg,
        padding: '60px 80px',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative' as const,
      },
      children: [
        // Badge de categoria
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: colors.text,
                    padding: '8px 20px',
                    borderRadius: '999px',
                    fontSize: '20px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase' as const,
                  },
                  children: colors.badge,
                },
              },
            ],
          },
        },
        // Título principal
        {
          type: 'div',
          props: {
            style: {
              color: colors.text,
              fontSize: displayTitle.length > 40 ? '52px' : '64px',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '28px',
              flex: 1,
            },
            children: displayTitle,
          },
        },
        // Descrição
        {
          type: 'div',
          props: {
            style: {
              color: `${colors.text}CC`,  // 80% opacidade
              fontSize: '28px',
              fontWeight: 400,
              lineHeight: 1.4,
              marginBottom: '48px',
            },
            children: displayDesc,
          },
        },
        // Footer com logo SystemForge
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `2px solid rgba(255,255,255,0.3)`,
              paddingTop: '28px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    color: colors.text,
                    fontSize: '28px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                  },
                  children: 'SystemForge',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    color: `${colors.text}99`,
                    fontSize: '22px',
                  },
                  children: `Categoria ${config.category} · systemforge.com.br`,
                },
              },
            ],
          },
        },
      ],
    },
  };

  // Configuração do Satori
  const satoriOptions: Parameters<typeof satori>[1] = {
    width: 1200,
    height: 630,
    fonts: fontData
      ? [{ name: 'Inter', data: fontData, weight: 700, style: 'normal' }]
      : [],
  };

  // Gera SVG
  console.log(`[generate-og] Gerando SVG via Satori...`);
  const svg = await satori(element as Parameters<typeof satori>[0], satoriOptions);

  // Converte SVG → PNG via @resvg/resvg-js
  console.log(`[generate-og] Convertendo SVG → PNG via @resvg/resvg-js...`);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const pngBuffer = resvg.render().asPng();

  // Grava o arquivo
  fs.writeFileSync(OUTPUT_PATH, pngBuffer);

  const fileSizeKB = Math.round(pngBuffer.length / 1024);
  console.log(`[generate-og] OG image gerada: ${OUTPUT_PATH} (${fileSizeKB}KB)`);
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

generateOGImage().catch((err: unknown) => {
  console.error('[generate-og] ERRO:', err);
  process.exit(1);
});
