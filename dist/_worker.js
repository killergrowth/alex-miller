// KillerGrowth — Alex Miller Pages Worker
// Handles:
//   /robots.txt     → block pages.dev crawlers, pass-through for live domain
//   /listings       → serve listings page with live data injected from KV
//   /listings.html  → same
//   everything else → serve static assets

const KV_KEY     = 'listings-content';
const KV_UPDATED = 'listings-updated';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── robots.txt ───────────────────────────────────────────────
    if (url.pathname === '/robots.txt') {
      if (url.hostname.endsWith('.pages.dev')) {
        return new Response('User-agent: *\nDisallow: /\n', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
      return env.ASSETS.fetch(request);
    }

    // ── Listings page ────────────────────────────────────────────
    const path = url.pathname.replace(/\/$/, '');
    if (path === '/listings' || path === '/listings.html') {
      return serveListings(request, env, url);
    }

    // ── Everything else ──────────────────────────────────────────
    return env.ASSETS.fetch(request);
  }
};

async function serveListings(request, env, url) {
  // Fetch the static template from Pages assets
  const templateUrl = new URL('/listings.html', url.origin);
  const templateReq = new Request(templateUrl.toString());
  const templateRes = await env.ASSETS.fetch(templateReq);
  let html = await templateRes.text();

  // Try KV for live listings content
  let listingsHtml = null;
  try {
    if (env.LISTINGS_KV) {
      listingsHtml = await env.LISTINGS_KV.get(KV_KEY);
    }
  } catch (e) {
    console.error('KV read error:', e.message);
  }

  if (listingsHtml) {
    // Inject live listings, replacing the placeholder block
    html = html.replace(
      /<!-- BEGIN:LISTINGS_CONTENT[\s\S]*?<!-- END:LISTINGS_CONTENT -->/,
      listingsHtml
    );
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, stale-while-revalidate=86400'
    }
  });
}
