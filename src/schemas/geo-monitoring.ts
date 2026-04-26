// CL-112, CL-538 — schema para GEO monitoring
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

export const SiteGeoConfig = z.object({
  category: z.string().regex(/^[A-F]$/),
  domain: z.string().min(3),
  priority: z.enum(['low', 'medium', 'high']),
  keywords: z.array(z.string().min(2)).min(1).max(20),
});

export const GeoMonitoringFile = z.object({
  $schema: z.string().optional(),
  version: z.string(),
  lastUpdatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sites: z.record(z.string(), SiteGeoConfig),
});

export type SiteGeoConfig = z.infer<typeof SiteGeoConfig>;
export type GeoMonitoringFile = z.infer<typeof GeoMonitoringFile>;

export type GeoQueryResult = {
  source: 'perplexity' | 'chatgpt' | 'google_ai_overview';
  site: string;
  keyword: string;
  present: boolean;
  position?: number;
  citationUrl?: string;
  snippet?: string;
  collectedAt: string;
  raw?: unknown;
};

export function loadGeoMonitoringConfig(repoRoot: string = process.cwd()): GeoMonitoringFile {
  const file = path.join(repoRoot, 'config', 'geo-monitoring-keywords.json');
  const raw = fs.readFileSync(file, 'utf8');
  return GeoMonitoringFile.parse(JSON.parse(raw));
}
