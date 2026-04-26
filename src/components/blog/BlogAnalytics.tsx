'use client';

import { useEffect, useRef } from 'react';

interface BlogAnalyticsProps {
  siteSlug: string;
  articleSlug: string;
  readingTime?: number;
  category?: string;
}

/**
 * GA4 blog-specific event tracking.
 * Events: scroll_depth (25/50/75/100%), time_on_page (10s/30s/60s), article_category_view.
 * Source: TASK-0 ST004 (module-11-blog-pipeline)
 */
export function BlogAnalytics({ siteSlug, articleSlug, readingTime, category }: BlogAnalyticsProps) {
  const firedScrollRef = useRef<Set<number>>(new Set());
  const firedTimeRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const gtag = (window as any).gtag;
    if (typeof gtag !== 'function') return;

    // ── page_view with blog-specific properties ──
    gtag('event', 'blog_page_view', {
      site_slug: siteSlug,
      article_slug: articleSlug,
      reading_time: readingTime,
      category,
    });

    // ── scroll_depth tracking ──
    const MILESTONES = [25, 50, 75, 100];

    function handleScroll() {
      if (typeof gtag !== 'function') return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const pct = Math.round((scrollTop / docHeight) * 100);

      for (const milestone of MILESTONES) {
        if (pct >= milestone && !firedScrollRef.current.has(milestone)) {
          firedScrollRef.current.add(milestone);
          gtag('event', 'scroll_depth', {
            site_slug: siteSlug,
            article_slug: articleSlug,
            depth: milestone,
          });
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // ── time_on_page tracking ──
    const TIME_MILESTONES = [10, 30, 60];
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const seconds of TIME_MILESTONES) {
      const timer = setTimeout(() => {
        if (typeof gtag === 'function' && !firedTimeRef.current.has(seconds)) {
          firedTimeRef.current.add(seconds);
          gtag('event', 'time_on_page', {
            site_slug: siteSlug,
            article_slug: articleSlug,
            duration: seconds,
          });
        }
      }, seconds * 1000);
      timers.push(timer);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      timers.forEach(clearTimeout);
    };
  }, [siteSlug, articleSlug, readingTime, category]);

  return null;
}
