// scripts/sentry-quota-check.ts
// CL-274 — verifica quota mensal Sentry e retorna exit code segundo threshold.
// Exit codes: 0 = ok (<70%), 1 = warning (>=70%), 2 = critical (>=90%).
// Uso: tsx scripts/sentry-quota-check.ts [--org=<org>] [--json]

const TOKEN = process.env.SENTRY_AUTH_TOKEN;
const ORG = process.env.SENTRY_ORG ?? 'systemforge';
const QUOTA_FREE = parseInt(process.env.SENTRY_QUOTA ?? '5000', 10);
const WARN = parseFloat(process.env.SENTRY_WARN_PCT ?? '0.7');
const CRIT = parseFloat(process.env.SENTRY_CRIT_PCT ?? '0.9');

type StatsResponse = {
  groups?: Array<{
    by?: Record<string, string>;
    totals?: { 'sum(quantity)'?: number };
  }>;
};

async function fetchUsage(): Promise<number> {
  if (!TOKEN) {
    throw new Error('SENTRY_AUTH_TOKEN ausente — registrar em credentials.sentry.auth_token');
  }
  const since = new Date();
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);
  const url = `https://sentry.io/api/0/organizations/${ORG}/stats_v2/?statsPeriod=30d&interval=1d&groupBy=outcome&field=sum(quantity)&category=error`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Sentry API error: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as StatsResponse;
  const accepted = (data.groups ?? [])
    .filter((g) => (g.by?.outcome ?? '') === 'accepted')
    .reduce((sum, g) => sum + (g.totals?.['sum(quantity)'] ?? 0), 0);
  return accepted;
}

async function main() {
  const json = process.argv.includes('--json');
  try {
    const used = await fetchUsage();
    const ratio = QUOTA_FREE > 0 ? used / QUOTA_FREE : 0;
    const status = ratio >= CRIT ? 'critical' : ratio >= WARN ? 'warning' : 'ok';
    const exitCode = status === 'critical' ? 2 : status === 'warning' ? 1 : 0;
    const payload = {
      org: ORG,
      used,
      quota: QUOTA_FREE,
      ratio: Number(ratio.toFixed(3)),
      thresholds: { warn: WARN, crit: CRIT },
      status,
    };
    if (json) {
      process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    } else {
      const pct = (ratio * 100).toFixed(1);
      console.log(`[sentry-quota] ${status.toUpperCase()} — ${used}/${QUOTA_FREE} eventos (${pct}%)`);
    }
    process.exit(exitCode);
  } catch (err) {
    console.error('[sentry-quota] erro:', err instanceof Error ? err.message : String(err));
    process.exit(3);
  }
}

main();
