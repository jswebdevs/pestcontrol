// HTML payload for the API host root (e.g. https://backend.pestcontrolrajshahi.com/).
// Used by both the local main.ts bootstrap and the Vercel api/index.ts entry —
// registered as a direct Fastify route (NestJS's setGlobalPrefix exclude is
// unreliable on the Fastify adapter).

export function buildRootLandingHtml(): string {
  const siteUrl =
    process.env.PUBLIC_SITE_URL || 'https://www.pestcontrolrajshahi.com';
  const appName = process.env.APP_NAME || 'Pest Control Rajshahi';
  const escaped = siteUrl.replace(/"/g, '&quot;');
  const baseTrimmed = escaped.replace(/\/$/, '');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${appName} — API server</title>
  <meta http-equiv="refresh" content="5;url=${escaped}" />
  <meta name="robots" content="noindex" />
  <link rel="canonical" href="${escaped}" />
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, sans-serif;
      background: radial-gradient(ellipse at top, #e0f2fe 0%, #f8fafc 50%, #f1f5f9 100%);
      color: #0f172a;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    @media (prefers-color-scheme: dark) {
      body { background: radial-gradient(ellipse at top, #0f172a 0%, #020617 60%); color: #f1f5f9; }
      .card { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); }
      .muted { color: #94a3b8; }
      .badge { background: #14532d; color: #bbf7d0; }
      a.cta { background: #f8fafc; color: #0f172a; }
      .small code { background: rgba(255,255,255,0.08); }
    }
    .card {
      width: 100%;
      max-width: 560px;
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(15,23,42,0.08);
      border-radius: 24px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 24px 48px -24px rgba(2,6,23,0.18);
    }
    .badge {
      display: inline-block;
      background: #dcfce7;
      color: #14532d;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 12px;
      border-radius: 999px;
      margin-bottom: 18px;
    }
    h1 {
      font-size: clamp(24px, 4vw, 32px);
      font-weight: 800;
      margin: 0 0 10px;
      letter-spacing: -0.02em;
    }
    p { margin: 6px 0; line-height: 1.55; }
    .muted { color: #475569; font-size: 14px; }
    .countdown {
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      color: #0ea5e9;
    }
    a.cta {
      display: inline-block;
      margin-top: 24px;
      background: #0f172a;
      color: #f8fafc;
      text-decoration: none;
      font-weight: 600;
      padding: 12px 22px;
      border-radius: 999px;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    a.cta:hover { transform: translateY(-1px); opacity: 0.92; }
    .small {
      margin-top: 22px;
      font-size: 12px;
      color: #64748b;
      word-break: break-all;
    }
    .small code { background: rgba(15,23,42,0.06); padding: 2px 6px; border-radius: 6px; }
  </style>
</head>
<body>
  <main class="card">
    <span class="badge">API server</span>
    <h1>${appName}</h1>
    <p>You've reached the API host. The website lives at the address below.</p>
    <p class="muted">Redirecting in <span id="cd" class="countdown">5</span> seconds…</p>
    <a class="cta" href="${escaped}">Go to the website now &rarr;</a>
    <p class="small">
      API base: <code>${baseTrimmed}/api/v1</code> &middot;
      Docs at <code>/docs</code>
    </p>
  </main>
  <script>
    var t = 5;
    var el = document.getElementById('cd');
    var iv = setInterval(function () {
      t -= 1;
      if (el) el.textContent = String(t);
      if (t <= 0) {
        clearInterval(iv);
        window.location.replace(${JSON.stringify(siteUrl)});
      }
    }, 1000);
  </script>
</body>
</html>`;
}
