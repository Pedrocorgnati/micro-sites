import type { ImgHTMLAttributes } from 'react';

type PictureProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
  alt: string;
};

/**
 * <Picture> — wrapper <picture> com fallback AVIF -> WebP -> JPG/PNG.
 * Assume que derivados (.webp e .avif) existem em paralelo ao fonte,
 * gerados via `scripts/optimize-content-images.ts`.
 * Para imagens remotas/dinâmicas, use `next/image`.
 */
export function Picture({ src, alt, ...imgProps }: PictureProps) {
  const base = src.replace(/\.(jpe?g|png)$/i, '');
  const webp = `${base}.webp`;
  const avif = `${base}.avif`;
  return (
    <picture>
      <source srcSet={avif} type="image/avif" />
      <source srcSet={webp} type="image/webp" />
      <img src={src} alt={alt} {...imgProps} />
    </picture>
  );
}

export default Picture;
