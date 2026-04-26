// CL-164, CL-557 — POST sintetico ao endpoint Static Forms (ou fallback)
// Exit codes: 0 ok, 1 falha rede, 2 status code !=2xx, 3 captcha/redirect, 4 config ausente
//
// Uso: tsx scripts/synthetic-static-forms.ts [--dry-run]

const ENDPOINT = process.env.FORMS_ENDPOINT_FALLBACK_URL ?? process.env.SF_SYNTHETIC_ENDPOINT ?? 'https://api.staticforms.xyz/submit';
const ACCESS_KEY = process.env.SF_ACCESS_KEY ?? '';
const DRY = process.argv.includes('--dry-run');

const PAYLOAD = {
  name: 'SYNTHETIC_TEST',
  email: 'synthetic+ms@noreply.systemforge.dev',
  message: '[SYNTHETIC] Monitor sintetico micro-sites — descartar.',
  __synthetic: true,
  accessKey: ACCESS_KEY,
  $honeypot: '',
};

async function run() {
  if (!ACCESS_KEY && !DRY) {
    console.error('[synthetic-sf] SF_ACCESS_KEY ausente — registrar em credentials.static_forms.access_key');
    process.exit(4);
  }

  if (DRY) {
    console.log('[synthetic-sf] DRY RUN — payload:', JSON.stringify(PAYLOAD));
    process.exit(0);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(PAYLOAD),
      signal: ctrl.signal,
      redirect: 'manual',
    });
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location') ?? '';
      console.error(`[synthetic-sf] FAIL — redirect inesperado para ${loc}`);
      process.exit(3);
    }

    if (res.status >= 200 && res.status < 300) {
      console.log(`[synthetic-sf] OK — __SYNTHETIC_OK__ status=${res.status}`);
      process.exit(0);
    }

    console.error(`[synthetic-sf] FAIL — status ${res.status} ${res.statusText}`);
    process.exit(2);
  } catch (err) {
    clearTimeout(timer);
    console.error('[synthetic-sf] FAIL — network error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

run();
