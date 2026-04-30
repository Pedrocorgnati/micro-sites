/**
 * SelfAd — banner proprio servido como fallback do AdSense.
 *
 * Exibido quando:
 *   - consent.advertising === false (incluindo pre-consent)
 *   - mode === 'off'
 *   - clientId env ausente
 *   - AdSense retornou unfilled (no-fill detectado pelo AdBanner)
 *
 * Renderiza desktop/mobile via picture+source para mudar o asset por
 * breakpoint sem cliente JS — funciona em SSG estatico.
 *
 * Sem cookies, sem tracking de terceiros, 1st-party. Nao precisa de consent.
 */

import type { AdSlotName } from '@/lib/adsense';
import { pickSelfAd, type SelfAdCreative } from '@/lib/self-ads';
import styles from './AdBanner.module.css';

interface Props {
  slot: AdSlotName;
  /** Seed opcional para escolha deterministica do creative (ex: site slug). */
  seed?: string;
}

export function SelfAd({ slot, seed }: Props) {
  const creative = pickSelfAd(slot, seed);
  if (!creative) return null;
  return <SelfAdRenderer creative={creative} />;
}

interface RendererProps {
  creative: SelfAdCreative;
}

function SelfAdRenderer({ creative }: RendererProps) {
  const { href, alt, desktop, desktopSize, mobile, mobileSize, slot } = creative;
  const containerClass = `${styles.adContainer} ${styles[slot] ?? ''}`;

  return (
    <div
      className={containerClass}
      data-ad-slot-name={slot}
      data-ad-fallback="self"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label={alt}
        style={{
          display: 'inline-block',
          maxWidth: '100%',
          textDecoration: 'none',
        }}
      >
        <picture>
          {mobile && mobileSize ? (
            <source media="(max-width: 767px)" srcSet={mobile} />
          ) : null}
          <img
            src={desktop}
            width={desktopSize.w}
            height={desktopSize.h}
            alt={alt}
            loading="lazy"
            decoding="async"
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: '4px',
            }}
          />
        </picture>
      </a>
    </div>
  );
}
