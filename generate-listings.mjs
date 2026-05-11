/**
 * generate-listings.mjs - Alex Miller Real Estate Auctions
 * Fetches live listings from the REALSTACK XML feed and rewrites
 * the <!-- LISTINGS_CONTENT --> section in listings.html.
 *
 * Usage: node generate-listings.mjs
 * Run before build.js when listings need to be refreshed.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FEED_URL   = 'https://app.realstack.com/export/realstack-wp-plugin/1129-l2-realty-inc-land-and-lifestyle-properties.xml';
const ACCESS_TOKEN = '169cefeb23e934a9029aaf61c99d79bf';
const LISTINGS_SRC = path.join(__dirname, 'listings.html');

// ---------------------------------------------------------------
// Fetch XML
// ---------------------------------------------------------------
function fetchXML() {
  return new Promise((resolve, reject) => {
    const url = new URL(FEED_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: { 'X-ACCESS-TOKEN': ACCESS_TOKEN }
    };
    let body = '';
    https.get(options, res => {
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

// ---------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------
function extractTag(xml, tag) {
  // Handles both plain and CDATA content
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))<\\/${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return (m[1] !== undefined ? m[1] : m[2] || '').trim();
}

function extractAllTags(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))<\\/${tag}>`, 'gi');
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    const val = (m[1] !== undefined ? m[1] : m[2] || '').trim();
    if (val) results.push(val);
  }
  return results;
}

function getBlock(xml, tag) {
  const re = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[0] : '';
}

function formatPrice(price) {
  const n = parseInt(price);
  if (!n) return 'Contact for Price';
  return '$' + n.toLocaleString('en-US');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------
// Parse all listings
// ---------------------------------------------------------------
function parseListings(xml) {
  // Split on <item  (note the space — it's <item > in the feed)
  const parts = xml.split(/<item\s/);
  parts.shift(); // drop everything before first item

  const listings = [];

  for (const part of parts) {
    const block = '<item ' + part.split('</item>')[0] + '</item>';

    const status = extractTag(getBlock(block, 'status'), 'name');
    if (status.toLowerCase() !== 'available') continue;

    const id         = extractTag(block, 'realstack_id');
    const title      = extractTag(block, 'title');
    const price      = extractTag(block, 'price');
    const acreage    = extractTag(block, 'acreage');

    // Location
    const locBlock   = getBlock(block, 'location');
    const city       = extractTag(locBlock, 'city');
    const stateAbbr  = extractTag(getBlock(locBlock, 'state'), 'abbreviation');
    const county     = extractTag(getBlock(locBlock, 'county'), 'name');

    // Types
    const typesBlock = getBlock(block, 'types');
    const types      = extractAllTags(typesBlock, 'name');

    // Agent
    const repBlock   = getBlock(block, 'listing_rep');
    const agentFirst = extractTag(repBlock, 'first_name');
    const agentLast  = extractTag(repBlock, 'last_name');

    // Sale type
    const saleTypeBlock = getBlock(block, 'sale_type');
    const saleType   = extractTag(saleTypeBlock, 'name');

    // First gallery image
    const gallery    = getBlock(block, 'gallery');
    const imgs       = extractAllTags(gallery, 'url');
    const image      = imgs[0] || '';

    // Link
    const link       = extractTag(block, 'website_url') || extractTag(block, 'external_listing_url');

    // Featured
    const featured   = extractTag(block, 'featured') === 'true';

    listings.push({ id, title, price, acreage, city, stateAbbr, county, types, agentFirst, agentLast, saleType, image, link, featured });
  }

  // Sort: featured first, then by price descending
  listings.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return parseInt(b.price || 0) - parseInt(a.price || 0);
  });

  return listings;
}

// ---------------------------------------------------------------
// Render a single listing card
// ---------------------------------------------------------------
function renderCard(l) {
  const title   = escapeHtml(l.title || 'Property Listing');
  const location = [l.city, l.county ? l.county + ' Co.' : '', l.stateAbbr].filter(Boolean).join(', ');
  const price   = formatPrice(l.price);
  const acres   = l.acreage ? l.acreage + '+/- Acres' : '';
  const agent   = [l.agentFirst, l.agentLast].filter(Boolean).join(' ');
  const types   = (l.types || []).slice(0, 3);
  const link    = l.link || '#';

  const imgHtml = l.image
    ? `<img src="${escapeHtml(l.image)}" alt="${title}" style="width:100%;height:220px;object-fit:cover;display:block;">`
    : `<div style="width:100%;height:220px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;"><i class="fas fa-map-marked-alt" style="font-size:48px;color:#c9a227;"></i></div>`;

  const typeTags = types.map(t =>
    `<span style="display:inline-block;background:#f0e8d0;color:#8b6914;font-size:11px;font-weight:600;padding:2px 8px;border-radius:3px;margin:0 4px 4px 0;">${escapeHtml(t)}</span>`
  ).join('');

  const featuredBadge = l.featured
    ? `<span style="position:absolute;top:12px;left:12px;background:#c9a227;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:3px;text-transform:uppercase;letter-spacing:0.05em;">Featured</span>`
    : '';

  return `
                <div class="col-lg-4 col-md-6 mb-30">
                    <div class="s-single-services h-100" style="overflow:hidden;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
                        <div style="position:relative;">
                            ${imgHtml}
                            ${featuredBadge}
                            <div style="position:absolute;bottom:10px;right:10px;background:rgba(13,27,62,0.85);color:#c9a227;font-size:13px;font-weight:700;padding:4px 12px;border-radius:4px;">${escapeHtml(price)}</div>
                        </div>
                        <div class="p-25">
                            ${typeTags ? `<div style="margin-bottom:8px;">${typeTags}</div>` : ''}
                            <h6 style="font-size:14px;line-height:1.4;margin-bottom:8px;color:#0d1b3e;">${title}</h6>
                            <p style="color:#666;font-size:13px;margin-bottom:6px;">
                                ${location ? `<i class="fas fa-map-marker-alt" style="color:#c9a227;margin-right:5px;"></i>${escapeHtml(location)}<br>` : ''}
                                ${acres ? `<i class="fas fa-ruler-combined" style="color:#c9a227;margin-right:5px;"></i>${escapeHtml(acres)}` : ''}
                            </p>
                            ${agent ? `<p style="font-size:12px;color:#999;margin-bottom:12px;"><i class="fas fa-user" style="color:#c9a227;margin-right:5px;"></i>${escapeHtml(agent)}</p>` : ''}
                            <a href="${escapeHtml(link)}" target="_blank" rel="noopener" class="btn ss-btn btn-sm" style="font-size:12px;">View Listing</a>
                        </div>
                    </div>
                </div>`;
}

// ---------------------------------------------------------------
// Build the full listings section HTML
// ---------------------------------------------------------------
function buildListingsSection(listings) {
  const count = listings.length;
  const cards = listings.map(renderCard).join('\n');

  return `<!-- BEGIN:LISTINGS_CONTENT (auto-generated ${new Date().toISOString().split('T')[0]}, ${count} active listings) -->
    <!-- Listings Grid -->
    <section class="services-area services-two pt-20 pb-80">
        <div class="container">
            <div style="text-align:center;margin-bottom:30px;">
                <span style="color:#999;font-size:14px;">${count} active listing${count !== 1 ? 's' : ''} from <strong>L2 Realty, Inc.</strong> &mdash; Click any listing to view full details on their website.</span>
            </div>
            <div class="row">
${cards}
            </div>
        </div>
    </section>
<!-- END:LISTINGS_CONTENT -->`;
}

// ---------------------------------------------------------------
// Inject into listings.html
// ---------------------------------------------------------------
function injectIntoPage(html, listingsHtml) {
  // Replace between markers if they exist
  const markerRe = /<!-- BEGIN:LISTINGS_CONTENT[\s\S]*?<!-- END:LISTINGS_CONTENT -->/;
  if (markerRe.test(html)) {
    return html.replace(markerRe, listingsHtml);
  }

  // Otherwise, replace the entire <!-- Listings Grid --> section
  const gridRe = /<!--\s*Listings Grid\s*-->[\s\S]*?(?=<!--\s*Upcoming Auctions CTA|<!--\s*CTA\s*-->)/;
  if (gridRe.test(html)) {
    return html.replace(gridRe, listingsHtml + '\n\n    ');
  }

  // Fallback — insert before the CTA section
  return html.replace('<!-- CTA -->', listingsHtml + '\n\n    <!-- CTA -->');
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function main() {
  console.log('Fetching REALSTACK listings feed...');
  const xml = await fetchXML();
  console.log(`Feed fetched (${Math.round(xml.length / 1024)}KB)`);

  const listings = parseListings(xml);
  console.log(`Parsed ${listings.length} available listings`);

  const listingsHtml = buildListingsSection(listings);

  const srcBuf = fs.readFileSync(LISTINGS_SRC);
  const bom = (srcBuf[0] === 0xEF && srcBuf[1] === 0xBB && srcBuf[2] === 0xBF) ? 3 : 0;
  const src = srcBuf.slice(bom).toString('utf8');

  const updated = injectIntoPage(src, listingsHtml);
  fs.writeFileSync(LISTINGS_SRC, updated, 'utf8');
  console.log(`listings.html updated with ${listings.length} cards`);
  console.log('Now run: node build.js');
}

main().catch(e => { console.error(e); process.exit(1); });
