/**
 * generate-auctions.mjs - Alex Miller Real Estate Auctions
 *
 * Fetches live auction data from the BidWrangler API and generates:
 *   - auctions/index.html         (master listing page — active + past)
 *   - auctions/{slug}/index.html  (individual SEO-ready auction detail pages)
 *
 * Pages use <!-- HEADER --> and <!-- FOOTER --> placeholders so build.js
 * can inject the site header/footer and run standard transformations.
 *
 * State is tracked in auctions/_state.json and committed to the repo so
 * it persists across GitHub Action runs.
 *
 * Usage: node generate-auctions.mjs
 * Run BEFORE build.js.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────

const BW_BASE_URL = 'https://bid.l2realtyinc.com';
const BW_FEED_URL = `${BW_BASE_URL}/api/feed/all`;
const BW_FIELDS   = [
  'type','id','name','status','starts_at','scheduled_end_time','timezone',
  'location','description','simple_description','formatted_simple_description',
  'featured_images','tag_line','items_count'
].join(',');

const AUCTIONS_DIR = path.join(__dirname, 'auctions');
const DIST_DIR     = path.join(__dirname, 'dist');
const STATE_FILE   = path.join(AUCTIONS_DIR, '_state.json');

// --direct flag: write assembled pages straight to dist/ (for GitHub Actions)
// Default (no flag): write source files to auctions/ for build.js to process
const DIRECT_MODE  = process.argv.includes('--direct');

// ── Helpers ──────────────────────────────────────────────────────────────

function slugify(name, id) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
    .replace(/-$/, '');
  return `${base}-${id}`;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(str) {
  return String(str || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(str, len) {
  const text = stripHtml(str);
  return text.length > len ? text.substring(0, len - 3) + '...' : text;
}

function isActive(status) {
  // BidWrangler uses 'pending' for scheduled/upcoming auctions
  return ['active', 'upcoming', 'preview', 'pending', 'scheduled'].includes((status || '').toLowerCase());
}

function statusLabel(status) {
  const s = (status || '').toLowerCase();
  if (s === 'active')    return 'ACTIVE';
  if (s === 'upcoming' || s === 'pending' || s === 'scheduled') return 'UPCOMING';
  if (s === 'preview')   return 'PREVIEW';
  if (s === 'complete' || s === 'completed') return 'SOLD';
  if (s === 'cancelled') return 'CANCELLED';
  return (status || 'PAST').toUpperCase();
}

function statusPillClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'active')   return 'pill-active';
  if (s === 'upcoming' || s === 'pending' || s === 'scheduled') return 'pill-upcoming';
  return 'pill-sold';
}

function formatDateTime(isoStr) {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
      timeZone: 'America/Chicago', timeZoneName: 'short'
    });
  } catch { return String(isoStr); }
}

function formatLocation(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  const parts = [loc.city, loc.state].filter(Boolean);
  if (parts.length) return parts.join(', ');
  if (loc.address) return loc.address;
  return '';
}

function bestImage(images, size = 'lg') {
  if (!images || !images.length) return '';
  const img = images[0];
  return img[size] || img.sm || img.xs || '';
}

// ── API ───────────────────────────────────────────────────────────────────

async function fetchAllAuctions() {
  const url = `${BW_FEED_URL}?fields=${BW_FIELDS}&page=1&per_page=100&include_syndicated=true&version=2`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`BidWrangler API ${res.status}`);
  const data = await res.json();

  const active   = (data.active || {}).results || [];
  // API uses 'past' or 'complete' depending on context — handle both
  const pastData  = data.past || data.complete || {};
  const complete  = pastData.results || [];
  const all       = [...active, ...complete];

  // Paginate past/complete if needed
  const total = pastData.total || pastData.total_count || 0;
  let fetched = complete.length;
  let page = 2;
  while (fetched < total && page <= 10) {
    const r = await fetch(
      `${BW_FEED_URL}?fields=${BW_FIELDS}&page=${page}&per_page=100&include_syndicated=true&version=2`,
      { headers: { Accept: 'application/json' } }
    );
    if (!r.ok) break;
    const d  = await r.json();
    const rs = ((d.past || d.complete) || {}).results || [];
    if (!rs.length) break;
    all.push(...rs);
    fetched += rs.length;
    page++;
  }

  console.log(`  BidWrangler: ${active.length} active, ${all.length - active.length} complete`);
  return all;
}

// ── State ─────────────────────────────────────────────────────────────────

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}
  }
  return { lastFetch: null, auctions: {} };
}

function saveState(state) {
  fs.mkdirSync(AUCTIONS_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// ── Shared CSS ────────────────────────────────────────────────────────────

const PAGE_CSS = `
        /* ── Auction page styles ── */
        .am-auction-hero {
            background-size: cover; background-position: center;
            min-height: 320px; position: relative;
            display: flex; align-items: flex-end;
        }
        .am-auction-hero::before {
            content: ''; position: absolute; inset: 0;
            background: linear-gradient(to bottom, rgba(13,27,62,.4) 0%, rgba(13,27,62,.78) 100%);
        }
        .am-auction-hero .hero-inner { position: relative; z-index: 2; width: 100%; padding: 40px 0 36px; }
        .am-spill { display:inline-block; padding:4px 14px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-bottom:12px; }
        .pill-active   { background:#16a34a; color:#fff; }
        .pill-upcoming { background:#c9a227; color:#0d1b3e; }
        .pill-sold     { background:rgba(255,255,255,.2); color:#fff; border:1px solid rgba(255,255,255,.4); }
        .am-sold-banner { background:#0d1b3e; border-left:4px solid #c9a227; padding:18px 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; }
        .am-sold-banner p { margin:0; color:#fff; font-weight:600; font-size:15px; }
        .am-sold-banner .btn-go { background:#c9a227; color:#0d1b3e; padding:9px 22px; border-radius:4px; font-weight:700; font-size:13px; text-decoration:none; white-space:nowrap; }
        .am-info-card { background:#fff; border-radius:10px; box-shadow:0 4px 24px rgba(13,27,62,.10); padding:28px; position:sticky; top:90px; }
        .am-info-card h4 { color:#0d1b3e; font-size:15px; font-weight:700; margin-bottom:18px; padding-bottom:12px; border-bottom:2px solid #c9a227; }
        .am-meta-list { list-style:none; padding:0; margin:0; }
        .am-meta-list li { display:flex; gap:12px; align-items:flex-start; padding:10px 0; border-bottom:1px solid #f0f0f0; font-size:14px; color:#374151; }
        .am-meta-list li:last-child { border-bottom:none; }
        .am-meta-list .mlabel { color:#9ca3af; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; display:block; margin-bottom:2px; }
        .am-meta-list i { color:#c9a227; width:18px; flex-shrink:0; margin-top:3px; }
        .btn-bid { display:block; background:#c9a227; color:#0d1b3e!important; text-align:center; padding:13px; border-radius:6px; font-weight:700; font-size:14px; margin-top:20px; text-decoration:none; }
        .btn-bid:hover { background:#b8911e; }
        .btn-all { display:block; background:transparent; color:#0d1b3e!important; text-align:center; padding:11px; border-radius:6px; font-weight:600; font-size:13px; margin-top:12px; text-decoration:none; border:2px solid #0d1b3e; }
        .btn-all:hover { background:#f5f7fb; }
        .am-desc h3 { color:#0d1b3e; font-size:20px; font-weight:700; margin-bottom:16px; padding-bottom:10px; border-bottom:2px solid #c9a227; display:inline-block; }
        .am-desc p { color:#374151; line-height:1.8; margin-bottom:14px; font-size:15px; }
        .am-photo-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px; margin-top:30px; }
        .am-photo-grid img { width:100%; height:160px; object-fit:cover; border-radius:6px; transition:opacity .2s; }
        .am-photo-grid img:hover { opacity:.88; }
        .am-embed-wrap { background:#f5f7fb; padding:60px 0; }
        .am-embed-wrap iframe { display:block; width:100%; min-height:700px; border:none; border-radius:10px; box-shadow:0 4px 24px rgba(13,27,62,.10); }
        .am-cta-dark { background:#0d1b3e; padding:60px 0; }
        .am-cta-dark h3 { color:#fff; font-size:22px; font-weight:700; margin-bottom:16px; }
        .btn-gold { display:inline-block; background:#c9a227; color:#0d1b3e; padding:13px 30px; border-radius:6px; font-weight:700; font-size:14px; text-decoration:none; }
        .btn-gold:hover { background:#b8911e; color:#0d1b3e; }
        .btn-outline-white { display:inline-block; background:transparent; color:#fff; padding:11px 28px; border-radius:6px; font-weight:600; font-size:14px; text-decoration:none; border:2px solid rgba(255,255,255,.4); margin-left:12px; }
        .btn-outline-white:hover { background:rgba(255,255,255,.08); color:#fff; }

        /* Index card styles */
        .am-card { background:#fff; border-radius:10px; box-shadow:0 4px 18px rgba(13,27,62,.08); overflow:hidden; height:100%; display:flex; flex-direction:column; }
        .am-card-img { height:200px; background-size:cover; background-position:center; position:relative; flex-shrink:0; }
        .am-card-badge { position:absolute; top:12px; left:12px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
        .am-card-badge.active   { background:#16a34a; color:#fff; }
        .am-card-badge.upcoming { background:#c9a227; color:#0d1b3e; }
        .am-card-badge.sold     { background:rgba(0,0,0,.55); color:#ddd; }
        .am-card-body { padding:20px; flex:1; display:flex; flex-direction:column; }
        .am-card-title { font-size:16px; font-weight:700; color:#0d1b3e; margin-bottom:8px; line-height:1.4; }
        .am-card-meta  { font-size:13px; color:#6b7280; margin-bottom:5px; }
        .am-card-meta i { color:#c9a227; margin-right:6px; }
        .am-card-link { margin-top:auto; padding-top:14px; color:#c9a227; font-weight:700; font-size:13px; text-decoration:none; display:inline-block; }
        .am-card-link:hover { color:#0d1b3e; }
        .am-card-wrap { display:block; text-decoration:none; color:inherit; height:100%; }
        .am-card-wrap:hover .am-card { box-shadow:0 8px 32px rgba(13,27,62,.18); transform:translateY(-2px); }
        .am-card { position:relative; cursor:pointer; transition:box-shadow .2s, transform .2s; }
        .am-eyebrow { font-size:12px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#c9a227; display:block; margin-bottom:8px; }
        .sold-overlay { position:absolute; inset:0; background:rgba(13,27,62,.45); display:flex; align-items:center; justify-content:center; }
        .sold-overlay span { background:#0d1b3e; color:#ccc; padding:6px 16px; border-radius:4px; font-weight:700; font-size:13px; letter-spacing:.08em; }
        @media(max-width:768px) {
            .am-embed-wrap iframe { min-height:500px; }
            .am-info-card { position:static; margin-top:30px; }
            .am-sold-banner { flex-direction:column; }
            .btn-outline-white { margin-left:0; margin-top:12px; }
        }`;

// ── Individual auction page ───────────────────────────────────────────────

function renderPhotoGrid(images) {
  if (!images || images.length <= 1) return '';
  const imgs = images.slice(0, 12).map(img => {
    const src = img.lg || img.sm || img.xs || '';
    return src ? `        <img src="${esc(src)}" alt="Property photo" loading="lazy">` : '';
  }).filter(Boolean).join('\n');
  return imgs ? `\n    <div class="am-photo-grid">\n${imgs}\n    </div>` : '';
}

function renderInfoCard(auction) {
  const active  = isActive(auction.status);
  const startDt = formatDateTime(auction.starts_at);
  const endDt   = formatDateTime(auction.scheduled_end_time);
  const loc     = formatLocation(auction.location);
  const bwUrl   = `${BW_BASE_URL}/ui/auctions/${auction.id}`;

  const cta = active
    ? `        <a href="${esc(bwUrl)}" target="_blank" rel="noopener" class="btn-bid">Register to Bid &rarr;</a>
        <a href="/auctions/" class="btn-all">&larr; All Auctions</a>`
    : `        <p style="font-size:13px;color:#6b7280;margin-top:16px;text-align:center;">This auction has closed.</p>
        <a href="/auctions/" class="btn-bid" style="background:#0d1b3e;color:#fff!important;">View Active Auctions &rarr;</a>`;

  return `    <div class="am-info-card">
        <h4>Auction Details</h4>
        <ul class="am-meta-list">
            ${startDt ? `<li><i class="fas fa-calendar-alt"></i><div><span class="mlabel">Starts</span>${esc(startDt)}</div></li>` : ''}
            ${endDt   ? `<li><i class="fas fa-flag-checkered"></i><div><span class="mlabel">Closes</span>${esc(endDt)}</div></li>` : ''}
            ${loc     ? `<li><i class="fas fa-map-marker-alt"></i><div><span class="mlabel">Location</span>${esc(loc)}</div></li>` : ''}
            <li><i class="fas fa-gavel"></i><div><span class="mlabel">Status</span>${esc(statusLabel(auction.status))}</div></li>
            <li><i class="fas fa-phone"></i><div><span class="mlabel">Questions?</span><a href="tel:3163134759" style="color:#c9a227;">316-313-4759</a></div></li>
        </ul>
${cta}
    </div>`;
}

function renderAuctionPage(auction) {
  const slug      = slugify(auction.name, auction.id);
  const heroImg   = bestImage(auction.featured_images, 'lg');
  const ogImg     = bestImage(auction.featured_images, 'xl') || heroImg;
  const loc       = formatLocation(auction.location);
  const metaTitle = `${auction.name || 'Auction'} | Alex Miller Real Estate Auctions`;
  const descText  = truncate(auction.simple_description || auction.description || '', 160);
  const metaDesc  = descText || `Real estate auction in ${loc || 'Central Kansas'}. Alex Miller, licensed auctioneer with L2 Realty.`;
  const pillClass = statusPillClass(auction.status);
  const sLabel    = statusLabel(auction.status);
  const active    = isActive(auction.status);

  const heroStyle = heroImg
    ? `style="background-image:url('${esc(heroImg)}')" `
    : `style="background:#0d1b3e" `;

  const soldBanner = !active
    ? `\n    <div class="am-sold-banner">
        <p><i class="fas fa-gavel" style="color:#c9a227;margin-right:10px;"></i>This auction has closed. Thank you to everyone who participated.</p>
        <a href="/auctions/" class="btn-go">View Active Auctions &rarr;</a>
    </div>`
    : '';

  // Description
  let descHtml = '';
  if (auction.formatted_simple_description) {
    descHtml = auction.formatted_simple_description;
  } else if (auction.simple_description) {
    descHtml = `<p>${esc(auction.simple_description)}</p>`;
  } else if (auction.description) {
    descHtml = `<p>${esc(auction.description)}</p>`;
  } else {
    descHtml = '<p>Contact Alex for more information about this property.</p>';
  }

  const photoGrid = renderPhotoGrid(auction.featured_images);
  const infoCard  = renderInfoCard(auction);

  const bwEmbed = active ? `
    <!-- BidWrangler live embed for this auction -->
    <div class="am-embed-wrap">
        <div class="container">
            <div class="section-title text-center wow fadeInDown animated mb-40">
                <span>Online Bidding</span>
                <h2>Place Your Bid</h2>
                <div class="divider-gold"></div>
                <p class="mt-15" style="max-width:600px;margin:12px auto 0;color:#6b7280;font-size:15px;">Register below to participate in this auction online. Create a free account to get started.</p>
            </div>
            <iframe
                src="${esc(`${BW_BASE_URL}/ui/auctions/${auction.id}`)}"
                title="${esc(auction.name)} — Online Bidding"
                allowfullscreen
                loading="lazy"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation">
            </iframe>
        </div>
    </div>` : '';

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: auction.name || undefined,
    startDate: auction.starts_at || undefined,
    endDate: auction.scheduled_end_time || undefined,
    eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
    eventStatus: active ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventEnded',
    location: loc ? { '@type': 'Place', name: loc } : undefined,
    image: ogImg ? [ogImg] : undefined,
    description: metaDesc,
    organizer: { '@type': 'Person', name: 'Alex Miller', url: 'https://amauctionsandrealestate.com' }
  }, null, 0);

  const canonical = `https://amauctionsandrealestate.com/auctions/${slug}/`;

  return `<!doctype html>
<html class="no-js" lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>${esc(metaTitle)}</title>
    <meta name="description" content="${esc(metaDesc)}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="canonical" href="${esc(canonical)}">
    <meta property="og:title" content="${esc(metaTitle)}">
    <meta property="og:description" content="${esc(metaDesc)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${esc(canonical)}">
    ${ogImg ? `<meta property="og:image" content="${esc(ogImg)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="756">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${esc(ogImg)}">` : ''}
    <script type="application/ld+json">${schema}</script>
    <link rel="stylesheet" href="/css/bootstrap.min.css">
    <link rel="stylesheet" href="/css/animate.min.css">
    <link rel="stylesheet" href="/fontawesome/css/all.min.css">
    <link rel="stylesheet" href="/css/dripicons.css">
    <link rel="stylesheet" href="/css/default.css">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/responsive.css">
    <link rel="stylesheet" href="/css/alex-miller.css">
    <style>${PAGE_CSS}    </style>
</head>
<body>

<!-- HEADER -->

<main>

    <section class="am-auction-hero" ${heroStyle}>
        <div class="hero-inner">
            <div class="container">
                <div class="col-xl-8 offset-xl-2 col-lg-10 offset-lg-1">
                    <div class="text-center">
                        <span class="am-spill ${pillClass}">${sLabel}</span>
                        <h1 style="color:#fff;font-size:clamp(24px,4vw,42px);font-weight:800;margin-bottom:10px;line-height:1.2;">${esc(auction.name || 'Real Estate Auction')}</h1>
                        ${loc ? `<p style="color:rgba(255,255,255,.82);font-size:15px;margin-bottom:0;"><i class="fas fa-map-marker-alt" style="color:#c9a227;margin-right:6px;"></i>${esc(loc)}</p>` : ''}
                        <nav aria-label="breadcrumb" style="margin-top:16px;">
                            <ol class="breadcrumb justify-content-center" style="background:transparent;margin:0;">
                                <li class="breadcrumb-item"><a href="/index.html" style="color:rgba(255,255,255,.7);">Home</a></li>
                                <li class="breadcrumb-item"><a href="/auctions/" style="color:rgba(255,255,255,.7);">Auctions</a></li>
                                <li class="breadcrumb-item active" aria-current="page" style="color:#c9a227;">${esc((auction.name || 'Auction').substring(0, 40))}</li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    </section>
${soldBanner}

    <section class="pt-60 pb-60">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mb-30">
                    <div class="am-desc">
                        <h3>About This Auction</h3>
                        ${descHtml}
                    </div>${photoGrid}
                </div>
                <div class="col-lg-4">
${infoCard}
                </div>
            </div>
        </div>
    </section>
${bwEmbed}

    <section class="am-cta-dark">
        <div class="container text-center">
            <h3>Looking for More Opportunities?</h3>
            <p style="color:rgba(255,255,255,.75);max-width:520px;margin:0 auto 28px;font-size:15px;">Browse all active and past real estate auctions from Alex Miller and L2 Realty in Central Kansas.</p>
            <a href="/auctions/" class="btn-gold">View All Auctions &rarr;</a>
            <a href="/contact.html" class="btn-outline-white">Contact Alex</a>
        </div>
    </section>

</main>

<!-- FOOTER -->

<script src="/js/vendor/modernizr-3.5.0.min.js"></script>
<script src="/js/vendor/jquery-1.12.4.min.js"></script>
<script src="/js/popper.min.js"></script>
<script src="/js/bootstrap.min.js"></script>
<script src="/js/wow.min.js"></script>
<script src="/js/jquery.scrollUp.min.js"></script>
<script src="/js/main.js"></script>
</body>
</html>
`;
}

// ── Master index page ─────────────────────────────────────────────────────

function renderCard(auction, slug, cardIndex) {
  const imgUrl    = bestImage(auction.featured_images, 'sm');
  const loc       = formatLocation(auction.location);
  const startDt   = formatDateTime(auction.starts_at);
  const active    = isActive(auction.status);
  const badgeClass = active ? (auction.status === 'upcoming' ? 'upcoming' : 'active') : 'sold';
  const badgeLabel = statusLabel(auction.status);

  const cardImg = imgUrl
    ? `style="background-image:url('${esc(imgUrl)}')" `
    : `style="background:#0d1b3e" `;

  const soldOverlay = !active
    ? `\n                <div class="sold-overlay"><span>SOLD</span></div>` : '';

  const cardId = cardIndex !== undefined ? ` id="card-${auction.id}"` : '';
  return `        <div class="col-lg-4 col-md-6 mb-30">
            <a href="/auctions/${esc(slug)}/" class="am-card-wrap" target="_blank" rel="noopener">
                <div class="am-card"${cardId}>
                    <div class="am-card-img" ${cardImg}>
                        <span class="am-card-badge ${badgeClass}">${badgeLabel}</span>${soldOverlay}
                    </div>
                    <div class="am-card-body">
                        <p class="am-card-title">${esc(auction.name || 'Auction')}</p>
                        ${loc     ? `<p class="am-card-meta"><i class="fas fa-map-marker-alt"></i>${esc(loc)}</p>` : ''}
                        ${startDt ? `<p class="am-card-meta"><i class="fas fa-calendar-alt"></i>${esc(startDt)}</p>` : ''}
                        <span class="am-card-link">View Auction Details &rarr;</span>
                    </div>
                </div>
            </a>
        </div>`;
}

function renderIndexPage(auctions, stateAuctions) {
  const active = auctions.filter(a => isActive(a.status));
  const past   = auctions.filter(a => !isActive(a.status));

  // Build map pin data for active auctions
  const mapPins = active
    .map((a, i) => {
      const loc = a.location;
      if (!loc || !loc.lat || !loc.lng) return null;
      const slug = stateAuctions[String(a.id)]?.slug || slugify(a.name, a.id);
      const startDt = a.starts_at ? new Date(a.starts_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', timeZone:'America/Chicago' }) : '';
      return {
        id: `card-${a.id}`,
        lat: parseFloat(loc.lat),
        lng: parseFloat(loc.lng),
        title: a.name,
        city: loc.city || '',
        state: loc.state || '',
        date: startDt,
        url: `/auctions/${slug}/`,
        index: i
      };
    })
    .filter(Boolean);

  const mapPinsJson = JSON.stringify(mapPins);

  const activeCards = active.length
    ? active.map((a, i) => renderCard(a, stateAuctions[String(a.id)]?.slug || slugify(a.name, a.id), i)).join('\n')
    : `        <div class="col-12 text-center py-40">
            <p style="color:#6b7280;font-size:16px;">No active auctions at this time. Check back soon or <a href="/contact.html" style="color:#c9a227;">contact Alex</a> directly.</p>
        </div>`;

  const pastCards = past.slice(0, 24)
    .map(a => renderCard(a, stateAuctions[String(a.id)]?.slug || slugify(a.name, a.id))).join('\n');

  const pastSection = past.length ? `
    <section class="pt-0 pb-80" style="background:#f5f7fb;">
        <div class="container">
            <div class="section-title text-center wow fadeInDown animated mb-50">
                <span class="am-eyebrow">Archives</span>
                <h2>Past Auctions</h2>
                <div class="divider-gold"></div>
                <p class="mt-15" style="max-width:600px;margin:12px auto 0;color:#6b7280;font-size:15px;">Sold properties below. Each page includes property details, photos, and location — great for research or finding what moves in this market.</p>
            </div>
            <div class="row">
${pastCards}
            </div>
        </div>
    </section>` : '';

  return `<!doctype html>
<html class="no-js" lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Real Estate Auctions | Alex Miller Real Estate Auctions</title>
    <meta name="description" content="Browse active and past real estate auctions in Central Kansas from Alex Miller, licensed auctioneer with L2 Realty. Bid online or contact Alex to learn more.">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="canonical" href="https://amauctionsandrealestate.com/auctions/">
    <meta property="og:title" content="Real Estate Auctions | Alex Miller Real Estate Auctions">
    <meta property="og:description" content="Browse active and past real estate auctions in Central Kansas from Alex Miller, licensed auctioneer with L2 Realty.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://amauctionsandrealestate.com/auctions/">
    <link rel="stylesheet" href="/css/bootstrap.min.css">
    <link rel="stylesheet" href="/css/animate.min.css">
    <link rel="stylesheet" href="/fontawesome/css/all.min.css">
    <link rel="stylesheet" href="/css/dripicons.css">
    <link rel="stylesheet" href="/css/default.css">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/responsive.css">
    <link rel="stylesheet" href="/css/alex-miller.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
    <style>${PAGE_CSS}
        .am-view-toggle { display:flex; gap:8px; justify-content:flex-end; margin-bottom:28px; }
        .am-view-btn { display:inline-flex; align-items:center; gap:7px; padding:8px 20px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer; border:2px solid #0d1b3e; background:#fff; color:#0d1b3e; transition:all .15s; text-decoration:none; }
        .am-view-btn.active { background:#0d1b3e; color:#c9a227; border-color:#0d1b3e; }
        .am-view-btn:hover:not(.active) { background:#f5f7fb; color:#0d1b3e; text-decoration:none; }
        .am-map-layout { display:none; }
        .am-map-layout.visible { display:flex; gap:0; align-items:flex-start; }
        .am-map-col { position:sticky; top:84px; flex:0 0 45%; height:calc(100vh - 110px); max-height:680px; border-radius:10px; overflow:hidden; box-shadow:0 4px 24px rgba(13,27,62,.12); }
        #am-map { height:100%; width:100%; }
        .am-grid-col { flex:1; overflow-y:auto; max-height:calc(100vh - 110px); padding-left:24px; }
        .am-grid-col::-webkit-scrollbar { width:5px; }
        .am-grid-col::-webkit-scrollbar-thumb { background:#c9a227; border-radius:3px; }
        .am-card.pin-active { outline:3px solid #c9a227; outline-offset:2px; box-shadow:0 8px 32px rgba(201,162,39,.3) !important; }
        .am-grid-section.map-mode-hidden { display:none; }
        @media(max-width:900px) {
            .am-map-layout.visible { flex-direction:column; }
            .am-map-col { position:static; flex:none; width:100%; height:320px; max-height:320px; }
            .am-grid-col { padding-left:0; max-height:none; overflow-y:visible; }
        }
    </style>
</head>
<body>

<!-- HEADER -->

<main>

    <section class="am-auction-hero" style="background-image:url('/images/barton-48.jpg')">
        <div class="hero-inner">
            <div class="container">
                <div class="col-xl-6 offset-xl-3 col-lg-8 offset-lg-2">
                    <div class="text-center">
                        <div style="margin-bottom:12px;"><span style="color:#c9a227;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">L2 Realty Inc.</span></div>
                        <h1 style="color:#fff;font-size:clamp(28px,5vw,46px);font-weight:800;margin-bottom:10px;">Real Estate Auctions</h1>
                        <p style="color:rgba(255,255,255,.82);font-size:15px;margin-bottom:0;">Active and past auction opportunities in Central Kansas</p>
                        <nav aria-label="breadcrumb" style="margin-top:16px;">
                            <ol class="breadcrumb justify-content-center" style="background:transparent;margin:0;">
                                <li class="breadcrumb-item"><a href="/index.html" style="color:rgba(255,255,255,.7);">Home</a></li>
                                <li class="breadcrumb-item active" aria-current="page" style="color:#c9a227;">Auctions</li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="pt-60 pb-60 am-grid-section" id="active-section">
        <div class="container">
            <div class="section-title text-center wow fadeInDown animated mb-40">
                <span class="am-eyebrow">Active &amp; Upcoming</span>
                <h2>Current Auctions</h2>
                <div class="divider-gold"></div>
                <p class="mt-15" style="max-width:650px;margin:12px auto 0;color:#6b7280;font-size:15px;">Browse live auction opportunities through Alex Miller Real Estate Auctions and L2 Realty. Click any listing for full details, photos, and online bidding.</p>
            </div>

            <!-- Grid / Map toggle -->
            <div class="am-view-toggle">
                <button class="am-view-btn active" id="btn-grid" onclick="setView('grid')">
                    <i class="fas fa-th"></i> Grid
                </button>
                <button class="am-view-btn" id="btn-map" onclick="setView('map')">
                    <i class="fas fa-map-marker-alt"></i> Map
                </button>
            </div>

            <!-- Map layout (hidden until map mode) -->
            <div class="am-map-layout" id="map-layout">
                <div class="am-map-col">
                    <div id="am-map"></div>
                </div>
                <div class="am-grid-col">
                    <div class="row" id="map-grid-cards">
${activeCards}
                    </div>
                </div>
            </div>

            <!-- Grid layout (default) -->
            <div class="row" id="grid-cards">
${activeCards}
            </div>
        </div>
    </section>
${pastSection}

    <section class="am-cta-dark">
        <div class="container text-center">
            <h3>Ready to Bid or Have a Property to Sell?</h3>
            <p style="color:rgba(255,255,255,.75);max-width:520px;margin:0 auto 28px;font-size:15px;">Alex Miller handles every auction with transparency and a commitment to getting sellers the best outcome.</p>
            <a href="/contact.html" class="btn-gold">Contact Alex &rarr;</a>
            <a href="/upcoming-auctions.html" class="btn-outline-white">Live Auction Feed</a>
        </div>
    </section>

</main>

<!-- FOOTER -->

<script src="/js/vendor/modernizr-3.5.0.min.js"></script>
<script src="/js/vendor/jquery-1.12.4.min.js"></script>
<script src="/js/popper.min.js"></script>
<script src="/js/bootstrap.min.js"></script>
<script src="/js/wow.min.js"></script>
<script src="/js/jquery.scrollUp.min.js"></script>
<script src="/js/main.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN/WLkI=" crossorigin=""></script>
<script>
const AUCTION_PINS = ${mapPinsJson};
let map = null, markers = {}, activeMarker = null;

function goldIcon() {
  return L.divIcon({ className:'', html:'<div style="width:34px;height:34px;background:#0d1b3e;border:3px solid #c9a227;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.3);"></div>', iconSize:[34,34], iconAnchor:[17,34], popupAnchor:[0,-36] });
}
function goldIconActive() {
  return L.divIcon({ className:'', html:'<div style="width:40px;height:40px;background:#c9a227;border:3px solid #0d1b3e;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 12px rgba(201,162,39,.6);"></div>', iconSize:[40,40], iconAnchor:[20,40], popupAnchor:[0,-42] });
}

function initMap() {
  if (map) return;
  map = L.map('am-map', { zoomControl:true, scrollWheelZoom:false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:'&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    subdomains:'abcd', maxZoom:19
  }).addTo(map);

  var bounds = [];
  AUCTION_PINS.forEach(function(pin) {
    var gi = goldIcon();
    var m = L.marker([pin.lat, pin.lng], { icon: gi })
      .bindPopup(
        '<div style="min-width:190px;">'
        + '<strong style="color:#0d1b3e;font-size:13px;display:block;margin-bottom:4px;">' + pin.title + '</strong>'
        + (pin.city ? '<span style="color:#6b7280;font-size:12px;">' + pin.city + ', ' + pin.state + '</span>' : '')
        + (pin.date ? '<br><span style="color:#c9a227;font-size:12px;font-weight:700;margin-top:4px;display:block;">📅 ' + pin.date + '</span>' : '')
        + '<br><a href="' + pin.url + '" target="_blank" style="display:inline-block;margin-top:8px;background:#c9a227;color:#0d1b3e;padding:5px 12px;border-radius:4px;font-size:12px;font-weight:700;text-decoration:none;">View Details →</a>'
        + '</div>',
        { maxWidth: 260 }
      )
      .addTo(map);

    m.on('click', function() {
      highlightCard(pin.id);
      if (activeMarker) { activeMarker.m.setIcon(activeMarker.gi); }
      m.setIcon(goldIconActive());
      activeMarker = { m: m, gi: gi };
    });

    markers[pin.id] = m;
    bounds.push([pin.lat, pin.lng]);
  });

  if (bounds.length > 1) map.fitBounds(bounds, { padding:[50,50] });
  else if (bounds.length === 1) map.setView(bounds[0], 10);
  else map.setView([38.5, -98.35], 7);
}

function highlightCard(cardId) {
  document.querySelectorAll('.am-card.pin-active').forEach(function(el) { el.classList.remove('pin-active'); });
  document.querySelectorAll('#' + cardId).forEach(function(card) {
    card.classList.add('pin-active');
    var col = card.closest('.am-grid-col');
    if (col) {
      var row = card.closest('[class*="col-"]');
      if (row) col.scrollTo({ top: row.offsetTop - 16, behavior:'smooth' });
    }
  });
}

function setView(mode) {
  var gc = document.getElementById('grid-cards');
  var ml = document.getElementById('map-layout');
  var pastSec = document.querySelector('.am-grid-section:not(#active-section)');
  if (mode === 'map') {
    gc.style.display = 'none';
    ml.classList.add('visible');
    document.getElementById('btn-grid').classList.remove('active');
    document.getElementById('btn-map').classList.add('active');
    if (pastSec) pastSec.classList.add('map-mode-hidden');
    setTimeout(initMap, 60);
    setTimeout(function() { if (map) map.invalidateSize(); }, 350);
  } else {
    gc.style.display = '';
    ml.classList.remove('visible');
    document.getElementById('btn-grid').classList.add('active');
    document.getElementById('btn-map').classList.remove('active');
    if (pastSec) pastSec.classList.remove('map-mode-hidden');
  }
}
</script>
</body>
</html>
`;
}

// ── Main ──────────────────────────────────────────────────────────────────

// ── Direct mode helpers (reads partials, writes to dist/) ────────────────

function loadPartials() {
  const headerPath = path.join(__dirname, '_partials', 'header.html');
  const footerPath = path.join(__dirname, '_partials', 'footer.html');
  const header = fs.existsSync(headerPath) ? fs.readFileSync(headerPath, 'utf8') : '';
  const footer = fs.existsSync(footerPath) ? fs.readFileSync(footerPath, 'utf8') : '';
  return { header, footer };
}

function assemblePage(html, header, footer) {
  return html
    .replace('<!-- HEADER -->', header)
    .replace('<!-- FOOTER -->', footer);
}

function updateSitemap(newSlugs) {
  const sitemapPath = path.join(DIST_DIR, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return;
  let xml = fs.readFileSync(sitemapPath, 'utf8');
  let added = 0;
  for (const slug of newSlugs) {
    const url = `https://amauctionsandrealestate.com/auctions/${slug}/`;
    if (!xml.includes(url)) {
      const entry = `  <url>\n    <loc>${url}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      xml = xml.replace('</urlset>', `${entry}\n</urlset>`);
      added++;
    }
  }
  // Also ensure /auctions/ index is in sitemap
  const indexUrl = 'https://amauctionsandrealestate.com/auctions/';
  if (!xml.includes(indexUrl)) {
    const entry = `  <url>\n    <loc>${indexUrl}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    xml = xml.replace('</urlset>', `${entry}\n</urlset>`);
    added++;
  }
  if (added > 0) {
    fs.writeFileSync(sitemapPath, xml, 'utf8');
    console.log(`  Sitemap: added ${added} URL(s)`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`generate-auctions.mjs starting... (mode: ${DIRECT_MODE ? 'direct → dist/' : 'source → auctions/'})`);

  const state = loadState();
  const prevAuctions = state.auctions || {};

  let auctions;
  try {
    auctions = await fetchAllAuctions();
  } catch (err) {
    console.error('Failed to fetch auctions:', err.message);
    process.exit(1);
  }

  if (!auctions.length) {
    console.warn('No auctions returned — aborting to avoid overwriting pages.');
    process.exit(0);
  }

  fs.mkdirSync(AUCTIONS_DIR, { recursive: true });

  // Load partials for direct mode
  const { header, footer } = DIRECT_MODE ? loadPartials() : { header: '', footer: '' };

  let created = 0;
  let updated = 0;
  const newState = { lastFetch: new Date().toISOString(), auctions: { ...prevAuctions } };
  const newSlugs = [];

  for (const auction of auctions) {
    const id  = String(auction.id);
    const prev = prevAuctions[id];
    const slug = prev?.slug || slugify(auction.name, auction.id);
    const statusChanged = prev && prev.status !== auction.status;

    newState.auctions[id] = {
      slug, status: auction.status, name: auction.name,
      generated: prev?.generated || new Date().toISOString(),
      ...(statusChanged ? { updated: new Date().toISOString() } : {})
    };

    if (!prev) newSlugs.push(slug); // track genuinely new pages

    if (DIRECT_MODE) {
      // Write assembled pages directly to dist/auctions/
      const distDir  = path.join(DIST_DIR, 'auctions', slug);
      const distPath = path.join(distDir, 'index.html');
      fs.mkdirSync(distDir, { recursive: true });
      if (!fs.existsSync(distPath) || statusChanged) {
        const raw  = renderAuctionPage(auction);
        const html = assemblePage(raw, header, footer);
        fs.writeFileSync(distPath, html, 'utf8');
        if (!fs.existsSync(distPath) || !prev) { console.log(`  Created (dist): auctions/${slug}/`); created++; }
        else                                   { console.log(`  Updated (dist, ${auction.status}): auctions/${slug}/`); updated++; }
      }
    } else {
      // Write source files for build.js to process
      const srcDir  = path.join(AUCTIONS_DIR, slug);
      const srcPath = path.join(srcDir, 'index.html');
      fs.mkdirSync(srcDir, { recursive: true });
      if (!fs.existsSync(srcPath) || statusChanged) {
        fs.writeFileSync(srcPath, renderAuctionPage(auction), 'utf8');
        if (!prev) { console.log(`  Created: auctions/${slug}/`); created++; }
        else       { console.log(`  Updated (${auction.status}): auctions/${slug}/`); updated++; }
      }
    }
  }

  // Write index page
  const indexHtml = renderIndexPage(auctions, newState.auctions);
  if (DIRECT_MODE) {
    const distIndexDir = path.join(DIST_DIR, 'auctions');
    fs.mkdirSync(distIndexDir, { recursive: true });
    fs.writeFileSync(path.join(distIndexDir, 'index.html'), assemblePage(indexHtml, header, footer), 'utf8');
    console.log('  Wrote: dist/auctions/index.html');
    // Update sitemap with any new URLs
    if (newSlugs.length) updateSitemap(newSlugs);
  } else {
    fs.writeFileSync(path.join(AUCTIONS_DIR, 'index.html'), indexHtml, 'utf8');
    console.log('  Wrote: auctions/index.html');
  }

  saveState(newState);
  console.log(`\nDone. ${created} created, ${updated} updated. Total: ${auctions.length} auctions.`);
  if (!DIRECT_MODE) console.log('Now run: node build.js');
}

main().catch(e => { console.error(e); process.exit(1); });