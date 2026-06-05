// Thin HTTP orchestrator. Drives the backend's existing AI endpoints
// (/admin/ai/service + /admin/ai/image + /admin/ai/apply) to bulk-create the
// full service catalog. NO prompt or model logic lives here — that all stays
// in the backend AI module so there is one source of truth.
//
// Inputs:
//   - SERVICE_CATALOG below (user's spec) — list of {name, cat}
//   - CATEGORY_CATALOG below — slug, name, icon, order
//
// Requires: backend on http://localhost:3000 and admin creds working.

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@pestcontrolrajshahi.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2026';

// ─────────────────────────────────────────────────────────────────────────────
// User catalog (verbatim from chat). Edit here if the list changes.
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_CATALOG = [
  { slug: 'normal-cleaning', name: 'Normal Cleaning', icon: 'sparkles', order: 1 },
  { slug: 'deep-cleaning', name: 'Deep Cleaning', icon: 'wand-2', order: 2 },
  { slug: 'furnishings', name: 'Carpet, Sofa & Tile', icon: 'sofa', order: 3 },
  { slug: 'polishing', name: 'Marble & Brass Polishing', icon: 'gem', order: 4 },
  { slug: 'pest-control', name: 'Pest Control', icon: 'bug', order: 5 },
  { slug: 'specialty', name: 'Specialty', icon: 'shield-check', order: 6 },
];

const VENUES = ['Home', 'Office', 'Hotel', 'Restaurant', 'Clinic', 'School', 'College', 'Hospital'];

const SERVICE_CATALOG = [
  ...VENUES.map((v) => ({ name: `${v} Normal Cleaning`, cat: 'normal-cleaning' })),
  ...VENUES.map((v) => ({ name: `${v} Deep Cleaning`, cat: 'deep-cleaning' })),
  { name: 'Carpet Cleaning', cat: 'furnishings' },
  { name: 'Sofa Cleaning', cat: 'furnishings' },
  { name: 'Tile Cleaning', cat: 'furnishings' },
  { name: 'Marble Polishing', cat: 'polishing' },
  { name: 'Brass Polishing', cat: 'polishing' },
  { name: 'Mice Control', cat: 'pest-control' },
  { name: 'Cockroach Control', cat: 'pest-control' },
  { name: 'Bed Bug Treatment', cat: 'pest-control' },
  { name: 'Termite Treatment', cat: 'pest-control' },
  { name: 'Snake Removal', cat: 'pest-control' },
  { name: 'Window Glass Cleaning (Inside & Outside)', cat: 'specialty' },
  { name: 'Water Tank Cleaning', cat: 'specialty' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tiny HTTP client with cookie jar
// ─────────────────────────────────────────────────────────────────────────────
class Client {
  constructor() {
    this.cookie = '';
  }
  async post(path, body) {
    const res = await fetch(`${BACKEND}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.cookie ? { cookie: this.cookie } : {}),
      },
      body: JSON.stringify(body ?? {}),
    });
    // Capture Set-Cookie on login
    const sc = res.headers.getSetCookie?.() || [];
    for (const line of sc) {
      const m = /^([^=]+=[^;]+)/.exec(line);
      if (m) {
        const existing = this.cookie.split('; ').filter((c) => c && !c.startsWith(m[1].split('=')[0] + '='));
        existing.push(m[1]);
        this.cookie = existing.join('; ');
      }
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${path} → ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    // unwrap {success, data: ...}
    return json?.data ?? json;
  }
  async get(path) {
    const res = await fetch(`${BACKEND}${path}`, {
      headers: { ...(this.cookie ? { cookie: this.cookie } : {}) },
    });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    const json = await res.json();
    return json?.data ?? json;
  }
}

// Map[(item, idx) → result] with capped concurrency.
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let i = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      try {
        results[idx] = { ok: true, value: await worker(items[idx], idx) };
      } catch (e) {
        results[idx] = { ok: false, error: e?.message ?? String(e) };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────────────────
const t0 = Date.now();
const c = new Client();

console.log(`== 1. Login as ${ADMIN_EMAIL} ==`);
await c.post('/auth/admin/login', { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD });

console.log(`\n== 2. Generate service text (parallel 5) — ${SERVICE_CATALOG.length} services ==`);
const textT = Date.now();
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const textResults = await mapWithConcurrency(SERVICE_CATALOG, 5, async (svc, idx) => {
  const res = await c.post('/admin/ai/service', { name: svc.name });
  // backend returns {data: <ServicePayload>, modelUsed, attempts}; unwrap.
  const payload = res?.data ?? res;
  // Defense in depth: even if the model drifts on name/slug, force ours so the
  // URL space stays predictable and matches the user's catalog 1:1.
  payload.name = svc.name;
  payload.slug = slugify(svc.name);
  console.log(`  ✓ [${idx + 1}/${SERVICE_CATALOG.length}] ${svc.name}  (via ${res?.modelUsed || '?'})`);
  return { ...payload, categorySlug: svc.cat };
});
console.log(`  text done in ${Math.round((Date.now() - textT) / 1000)}s`);
const okText = textResults.filter((r) => r.ok).map((r) => r.value);
const failText = textResults.filter((r) => !r.ok);
if (failText.length) {
  console.warn(`  ${failText.length} text gen failures:`);
  failText.forEach((f, i) => console.warn(`    [${i}] ${f.error?.slice(0, 200)}`));
}

console.log(`\n== 3. Generate images (parallel 3) — ${okText.length} images ==`);
const imgT = Date.now();
const imgResults = await mapWithConcurrency(okText, 3, async (svc, idx) => {
  const res = await c.post('/admin/ai/image', {
    prompt: svc.imagePrompt,
    folderTag: `service-${svc.slug}`,
    alt: svc.name,
  });
  console.log(`  ✓ [${idx + 1}/${okText.length}] ${svc.name} → ${res?.publicId}`);
  return { ...svc, imageUrl: res?.url, imagePublicId: res?.publicId };
});
console.log(`  images done in ${Math.round((Date.now() - imgT) / 1000)}s`);
const okImg = imgResults.filter((r) => r.ok).map((r) => r.value);
const failImg = imgResults.filter((r) => !r.ok);
if (failImg.length) {
  console.warn(`  ${failImg.length} image gen failures (services will be created with no image):`);
  failImg.forEach((f, i) => console.warn(`    [${i}] ${f.error?.slice(0, 200)}`));
}

// Re-merge: services that lost their image still get created (just without one)
const allWithImgOrNot = textResults.map((r, i) => {
  if (!r.ok) return null;
  const base = r.value;
  const withImg = okImg.find((s) => s.slug === base.slug);
  return withImg || base;
}).filter(Boolean);

console.log(`\n== 4. Apply to DB (wipeContent: true) ==`);
const applyRes = await c.post('/admin/ai/apply', {
  wipeContent: true,
  categories: CATEGORY_CATALOG,
  services: allWithImgOrNot,
});
console.log('  summary:', JSON.stringify(applyRes?.summary || applyRes, null, 2));

console.log(`\n== DONE ==  wall clock: ${Math.round((Date.now() - t0) / 1000)}s`);
