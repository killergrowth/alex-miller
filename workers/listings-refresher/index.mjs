/**
 * alex-miller-listings-refresher
 * Cloudflare Worker with a daily cron trigger.
 * Fetches L2 Realty listings from REALSTACK, builds the HTML grid,
 * and stores it in KV so the Pages site can serve it dynamically.
 *
 * Cron: 0 13 * * * (8am CT)
 */

const FEED_URL    = 'https://app.realstack.com/export/realstack-wp-plugin/1129-l2-realty-inc-land-and-lifestyle-properties.xml';
const ACCESS_TOKEN = '169cefeb23e934a9029aaf61c99d79bf';
const KV_KEY       = 'listings-content';
const KV_UPDATED   = 'listings-updated';

export default {
  // ── Cron trigger ──────────────────────────────────────────────
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshListings(env));
  },

  // ── HTTP trigger (manual refresh via /refresh-listings) ───────
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/refresh-listings') {
      await refreshListings(env);
      const updated = await env.LISTINGS_KV.get(KV_UPDATED);
      return new Response(JSON.stringify({ ok: true, updated }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.pathname === '/listings-status') {
      const updated = await env.LISTINGS_KV.get(KV_UPDATED);
      const content = await env.LISTINGS_KV.get(KV_KEY);
      return new Response(JSON.stringify({
        updated,
        contentLength: content ? content.length : 0
      }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('Alex Miller Listings Refresher — OK', { status: 200 });
  }
};

// ─────────────────────────────────────────────────────────────────
// Core refresh logic
// ─────────────────────────────────────────────────────────────────
async function refreshListings(env) {
  console.log('Fetching REALSTACK feed...');
  const res = await fetch(FEED_URL, {
    headers: { 'X-ACCESS-TOKEN': ACCESS_TOKEN },
    cf: { cacheTtl: 0 }  // bypass CF edge cache
  });

  if (!res.ok) {
    console.error('REALSTACK fetch failed:', res.status, await res.text());
    return;
  }

  const xml = await res.text();
  console.log(`Feed fetched: ${Math.round(xml.length / 1024)}KB`);

  const listings = parseListings(xml);
  console.log(`Parsed ${listings.length} available listings`);

  const html = buildListingsSection(listings);
  const now  = new Date().toISOString();

  // Store with 36-hour TTL (cron runs every 24h, this is a safety buffer)
  await env.LISTINGS_KV.put(KV_KEY, html, { expirationTtl: 60 * 60 * 36 });
  await env.LISTINGS_KV.put(KV_UPDATED, now, { expirationTtl: 60 * 60 * 36 });
  console.log(`KV updated at ${now} with ${listings.length} listings`);
}

// ─────────────────────────────────────────────────────────────────
// XML parsing helpers
// ─────────────────────────────────────────────────────────────────
// Allow optional whitespace before/after CDATA — realstack formats <url>\n    <![CDATA[...]]>\n</url>
function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))\\s*<\\/${tag}>`, 'i');
  const m  = xml.match(re);
  if (!m) return '';
  return (m[1] !== undefined ? m[1] : m[2] || '').trim();
}

function extractAllTags(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))\\s*<\\/${tag}>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    const v = (m[1] !== undefined ? m[1] : m[2] || '').trim();
    if (v) out.push(v);
  }
  return out;
}

function getBlock(xml, tag) {
  const re = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'i');
  const m  = xml.match(re);
  return m ? m[0] : '';
}

function parseListings(xml) {
  const parts = xml.split(/<item\s/);
  parts.shift();

  const listings = [];

  for (const part of parts) {
    const block = '<item ' + part.split('</item>')[0] + '</item>';

    const status = extractTag(getBlock(block, 'status'), 'name').toLowerCase();
    // Show active listings: 'available' + 'new listing' (72 items). Exclude 'sold' and 'under contract'.
    if (status !== 'available' && status !== 'new listing') continue;

    const id         = extractTag(block, 'realstack_id');
    const title      = extractTag(block, 'title');
    const price      = extractTag(block, 'price');
    const acreage    = extractTag(block, 'acreage');

    const locBlock   = getBlock(block, 'location');
    const city       = extractTag(locBlock, 'city');
    const stateAbbr  = extractTag(getBlock(locBlock, 'state'), 'abbreviation');
    const county     = extractTag(getBlock(locBlock, 'county'), 'name');

    const typesBlock = getBlock(block, 'types');
    const types      = extractAllTags(typesBlock, 'name');

    const repBlock   = getBlock(block, 'listing_rep');
    const agentFirst = extractTag(repBlock, 'first_name');
    const agentLast  = extractTag(repBlock, 'last_name');

    const gallery    = getBlock(block, 'gallery');
    const imgs       = extractAllTags(gallery, 'url');
    // Use 'big' (127KB) not 'extrabig' (290KB) — cuts image payload by 55%
    const image      = (imgs[0] || '').replace('/extrabig/', '/big/');

    const link       = extractTag(block, 'website_url') || extractTag(block, 'external_listing_url');
    const featured   = extractTag(block, 'featured') === 'true';

    listings.push({ id, title, price, acreage, city, stateAbbr, county, types, agentFirst, agentLast, image, link, featured, status });
  }

  // Featured first, then by price descending
  listings.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return parseInt(b.price || 0) - parseInt(a.price || 0);
  });

  return listings;
}

// ─────────────────────────────────────────────────────────────────
// HTML generation
// ─────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPrice(p) {
  const n = parseInt(p);
  if (!n || n < 100) return 'Contact for Price';
  return '$' + n.toLocaleString('en-US');
}

function renderCard(l) {
  const title    = esc(l.title || 'Property Listing');
  const price    = formatPrice(l.price);
  const acres    = l.acreage ? esc(l.acreage) + '+/- Acres' : '';
  const location = [l.city, l.county ? l.county + ' Co.' : '', l.stateAbbr].filter(Boolean).map(esc).join(', ');
  const agent    = [l.agentFirst, l.agentLast].filter(Boolean).map(esc).join(' ');
  const types    = (l.types || []).slice(0, 3);
  const link     = esc(l.link || '#');
  const typeData = esc((l.types || []).join(','));

  const imgHtml = l.image
    ? `<img src="${esc(l.image)}" alt="${title}" loading="lazy" width="400" height="200" decoding="async">`
    : `<div class="img-placeholder"><i class="fas fa-map-marked-alt" style="font-size:44px;color:#c9a227;opacity:0.6;"></i></div>`;

  const featuredBadge = l.featured
    ? `<span class="featured-badge">Featured</span>`
    : l.status === 'new listing'
      ? `<span class="featured-badge" style="background:#0d1b3e;color:#c9a227;">New Listing</span>`
      : '';

  const typeTags = types.map(t =>
    `<span class="type-tag">${esc(t)}</span>`
  ).join('');

  return `
            <div class="col-lg-4 col-md-6 mb-30 am-prop-card-wrap" data-types="${typeData}">
                <div class="am-prop-card">
                    <div class="card-img-wrap">
                        ${imgHtml}
                        ${featuredBadge}
                        <span class="price-badge">${price}</span>
                    </div>
                    <div class="card-body">
                        ${typeTags ? `<div class="type-tags">${typeTags}</div>` : ''}
                        <p class="prop-title">${title}</p>
                        <ul class="prop-meta">
                            ${location ? `<li><i class="fas fa-map-marker-alt"></i>${location}</li>` : ''}
                            ${acres ? `<li><i class="fas fa-ruler-combined"></i>${acres}</li>` : ''}
                        </ul>
                        ${agent ? `<p class="prop-agent"><i class="fas fa-user"></i>${agent}</p>` : ''}
                        <a href="${link}" target="_blank" rel="noopener" class="btn-view">View Listing &rarr;</a>
                    </div>
                </div>
            </div>`;
}

function buildListingsSection(listings) {
  const count   = listings.length;
  const updated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const cards   = listings.map(renderCard).join('\n');

  const emptyOrGrid = count > 0
    ? `<div class="row" id="am-listings-grid">\n${cards}\n            </div>`
    : `<div class="col-12 am-empty-state"><i class="fas fa-map-marked-alt"></i><p>No listings currently available. Check back soon or <a href="/contact.html">contact Alex</a> directly.</p></div>`;

  return `<!-- BEGIN:LISTINGS_CONTENT (auto-generated ${new Date().toISOString().split('T')[0]}, ${count} active listings) -->
    <section class="pt-20 pb-60" id="am-listings-section">
        <div class="container">
            ${emptyOrGrid}
            <p class="am-updated-note">Listings updated ${updated} &mdash; sourced from <a href="https://l2realtyinc.com/" target="_blank" rel="noopener" style="color:#b0b7c3;">L2 Realty Inc.</a></p>
        </div>
    </section>
<!-- END:LISTINGS_CONTENT -->`;
}
