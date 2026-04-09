'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { useEffect, useState } from 'react';

export function WebVitalsReporter() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    try {
      setConsented(localStorage.getItem('cookie_consent') === 'accepted');
    } catch {
      // silencioso
    }

    const handle = (e: CustomEvent<string>) => {
      setConsented(e.detail === 'accepted');
    };
    window.addEventListener('cookie_consent', handle as EventListener);
    return () => window.removeEventListener('cookie_consent', handle as EventListener);
  }, []);

  useReportWebVitals((metric) => {
    if (!consented) return;
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vital', {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
      });
    }
  });

  return null;
}
