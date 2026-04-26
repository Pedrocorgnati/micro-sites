/**
 * export-monitoring-config — exporta inventario UptimeRobot para config commitavel.
 *
 * Saida: config/monitoring-snapshot.json
 *   { version: 1, source: "uptimerobot", exported_at: ISO, monitors: [...] }
 *
 * TASK-22 ST003 — gap CL-278
 *
 * Variaveis:
 *   UPTIMEROBOT_API_KEY  — readOnly key
 *
 * Usage:
 *   UPTIMEROBOT_API_KEY=ur123-xxx npx tsx scripts/export-monitoring-config.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const CONFIG_DIR = path.resolve('config');
const API_URL = 'https://api.uptimerobot.com/v2/getMonitors';
const API_KEY = process.env.UPTIMEROBOT_API_KEY;

interface MonitorRaw {
  id?: number;
  friendly_name?: string;
  url?: string;
  type?: number;
  interval?: number;
  status?: number;
  alert_contacts?: Array<{ id?: string; threshold?: number; recurrence?: number }>;
  keyword_value?: string;
}

interface MonitorSnapshot {
  id: number | null;
  name: string;
  url: string;
  type: 'http' | 'keyword' | 'ping' | 'port' | 'unknown';
  interval_sec: number;
  keyword?: string;
  alert_threshold: number;
  status: 'up' | 'down' | 'paused' | 'unknown';
}

const TYPE_MAP: Record<number, MonitorSnapshot['type']> = {
  1: 'http',
  2: 'keyword',
  3: 'ping',
  4: 'port',
};

const STATUS_MAP: Record<number, MonitorSnapshot['status']> = {
  0: 'paused',
  1: 'unknown', // not checked yet
  2: 'up',
  8: 'down',
  9: 'down',
};

async function fetchMonitors(): Promise<MonitorRaw[]> {
  if (!API_KEY) {
    console.warn('[ur-export] UPTIMEROBOT_API_KEY ausente — exportando snapshot vazio');
    return [];
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cache: 'no-cache' },
    body: new URLSearchParams({
      api_key: API_KEY,
      format: 'json',
      alert_contacts: '1',
    }).toString(),
  });
  if (!res.ok) {
    console.warn(`[ur-export] API status ${res.status}`);
    return [];
  }
  const data = (await res.json()) as { stat?: string; monitors?: MonitorRaw[] };
  if (data.stat !== 'ok') {
    console.warn(`[ur-export] API stat=${data.stat}`);
    return [];
  }
  return data.monitors ?? [];
}

function normalize(raw: MonitorRaw): MonitorSnapshot {
  const alertThreshold = raw.alert_contacts?.[0]?.threshold ?? 0;
  return {
    id: raw.id ?? null,
    name: raw.friendly_name ?? '(unnamed)',
    url: raw.url ?? '',
    type: TYPE_MAP[raw.type ?? 0] ?? 'unknown',
    interval_sec: raw.interval ?? 0,
    keyword: raw.keyword_value || undefined,
    alert_threshold: alertThreshold,
    status: STATUS_MAP[raw.status ?? -1] ?? 'unknown',
  };
}

async function main(): Promise<void> {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });

  const monitors = (await fetchMonitors()).map(normalize);
  monitors.sort((a, b) => a.name.localeCompare(b.name));

  const snapshot = {
    version: 1,
    source: 'uptimerobot',
    exported_at: new Date().toISOString(),
    total: monitors.length,
    monitors,
  };

  const file = path.join(CONFIG_DIR, 'monitoring-snapshot.json');
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2) + '\n', 'utf-8');
  console.log(`[ur-export] ${file} (${monitors.length} monitors)`);

  // Sumario por status
  const byStatus = monitors.reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`[ur-export] status:`, byStatus);
}

main().catch((e) => {
  console.error('[ur-export] erro fatal:', e);
  process.exit(1);
});
