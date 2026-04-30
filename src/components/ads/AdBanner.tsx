/**
 * ADS-10 — AdBanner Client Component.
 *
 * Renderiza <ins class="adsbygoogle"> com idempotencia sob React 19 Strict Mode.
 * Guard: `data-adsbygoogle-status` atributo (Google adiciona apos push). Se
 * presente, pula push() — evita duplicacao no double-mount do dev.
 *
 * ADS-42 — Lazy-load below-the-fold via IntersectionObserver. Slots `header`
 * carregam imediato; demais aguardam viewport entry com 200px rootMargin.
 *
 * ADS-42 — No-fill detection: 2.5s apos push, se data-ad-status="unfilled",
 * colapsa container via data-no-fill="true" (CSS transition em AdBanner.module.css).
 *
 * INV-ADS-08: sem consent.advertising, retorna null antes de qualquer DOM.
 * INV-ADS-09: idempotencia via DOM guard, nao via useRef boolean.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdConsent } from '@/hooks/useAdConsent';
import type { AdSlotName, AdFormat } from '@/lib/adsense';
import { SelfAd } from './SelfAd';
import styles from './AdBanner.module.css';

interface Props {
  clientId: string;
  slotId: string;
  testMode: boolean;
  format?: AdFormat;
  slotName: AdSlotName;
  /** Seed para escolha deterministica do SelfAd fallback (ex: site slug). */
  fallbackSeed?: string;
}

const ABOVE_THE_FOLD: ReadonlySet<AdSlotName> = new Set(['header']);
const NO_FILL_TIMEOUT_MS = 2500;

export function AdBanner({
  clientId,
  slotId,
  testMode,
  format = 'auto',
  slotName,
  fallbackSeed,
}: Props) {
  const advertising = useAdConsent();
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const [pushed, setPushed] = useState(false);
  const [noFill, setNoFill] = useState(false);

  // ADS-42 — IntersectionObserver para BTF; ATF carrega imediato.
  const [inView, setInView] = useState(ABOVE_THE_FOLD.has(slotName));

  useEffect(() => {
    if (ABOVE_THE_FOLD.has(slotName)) return;
    const node = containerRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [slotName]);

  // Push para adsbygoogle queue, com guard de idempotencia DOM-attribute.
  useEffect(() => {
    if (!advertising || !inView || pushed) return;
    const ins = insRef.current;
    if (!ins) return;
    if (ins.getAttribute('data-adsbygoogle-status')) {
      // Strict Mode dev: o efeito anterior ja iniciou; nao duplicar.
      setPushed(true);
      return;
    }
    try {
      const w = window as unknown as { adsbygoogle?: object[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      setPushed(true);
    } catch {
      // Silent — Google as vezes throwa se script nao carregou ainda; tentara
      // de novo no proximo IO trigger ou re-render por consent change.
    }
  }, [advertising, inView, pushed]);

  // ADS-42 — No-fill: apos push, espera 2.5s; se data-ad-status="unfilled" colapsa.
  useEffect(() => {
    if (!pushed) return;
    const ins = insRef.current;
    if (!ins) return;
    const t = setTimeout(() => {
      const status = ins.getAttribute('data-ad-status');
      if (status === 'unfilled') {
        setNoFill(true);
      }
    }, NO_FILL_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [pushed]);

  // Fallback path: sem consent OU no-fill detectado → renderiza SelfAd 1st-party.
  // SelfAd nao precisa de consent.advertising (sem cookies/tracking de terceiros).
  if (!advertising || noFill) {
    return <SelfAd slot={slotName} seed={fallbackSeed} />;
  }

  const containerClass = `${styles.adContainer} ${styles[slotName] ?? ''}`;

  return (
    <div
      ref={containerRef}
      className={containerClass}
      data-ad-slot-name={slotName}
    >
      <ins
        ref={insRef as React.RefObject<HTMLModElement>}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(testMode ? { 'data-adtest': 'on' } : {})}
      />
    </div>
  );
}
