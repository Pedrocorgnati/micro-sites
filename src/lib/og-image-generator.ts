// src/lib/og-image-generator.ts
// Gerador de OG Image build-time: Satori (JSX → SVG) + @resvg/resvg-js (SVG → PNG)
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import type { SiteConfig } from '@/types';
import { ACCENT_COLORS, SITE_LIMITS } from '@/types';

const FONT_PATH = path.join(process.cwd(), 'public/fonts/PlusJakartaSans-Bold.ttf');

/** Trunca texto adicionando '…' se ultrapassar max chars */
function truncate(text: string, max: number = SITE_LIMITS.titleMaxLength): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

/**
 * Gera og-image.png (1200×630) para um site.
 * BUILD_056: falha em satori é warning — não aborta build.
 */
export async function generateOGImage(
  config: SiteConfig,
  outputDir: string
): Promise<string> {
  const accentColors = ACCENT_COLORS[config.category];
  const accentHex = accentColors.accent;
  const title = truncate(config.seo.ogTitle ?? config.seo.title);
  const description = truncate(
    config.seo.ogDescription ?? config.seo.description,
    100
  );

  // Carregar fonte (fallback: sem fonte personalizada)
  const fontData = fs.existsSync(FONT_PATH) ? fs.readFileSync(FONT_PATH) : null;
  const fonts = fontData
    ? [{ name: 'Plus Jakarta Sans', data: fontData, weight: 700 as const }]
    : [];

  // Satori aceita um objeto React-like como plain object via cast
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element: any = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        width: '100%',
        height: '100%',
        backgroundColor: '#0F172A',
        padding: '60px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              width: '60px',
              height: '4px',
              backgroundColor: accentHex,
              marginBottom: '24px',
              borderRadius: '2px',
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '56px',
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.1,
              marginBottom: '20px',
            },
            children: title,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '24px',
              color: '#94A3B8',
              lineHeight: 1.4,
            },
            children: description,
          },
        },
      ],
    },
  };

  const svg = await satori(element, {
    width: SITE_LIMITS.ogImageWidth,
    height: SITE_LIMITS.ogImageHeight,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: SITE_LIMITS.ogImageWidth },
  });
  const png = resvg.render().asPng();

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'og-image.png');
  fs.writeFileSync(outputPath, png);
  return outputPath;
}
