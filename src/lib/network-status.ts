/**
 * network-status — hook `useOnlineStatus` para detectar conectividade.
 *
 * TASK-19 ST001 (CL-157) — usado por forms para mostrar fallback offline.
 *
 * Notas:
 *   - SSR-safe (retorna `true` no server)
 *   - Reativo a `online`/`offline` events do navegador
 *   - `navigator.onLine` e best-effort; alguns browsers reportam true mesmo sem conectividade real
 */
'use client';

import { useEffect, useState } from 'react';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    setOnline(navigator.onLine);

    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener('online', onUp);
    window.addEventListener('offline', onDown);
    return () => {
      window.removeEventListener('online', onUp);
      window.removeEventListener('offline', onDown);
    };
  }, []);

  return online;
}
