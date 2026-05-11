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
// Allow whitespace before/after CDATA — realstack formats <url>\n    <![CDATA[...]]>\n</url>
// ---------------------------------------------------------------
function extractTag(xml, tag) {
  const re = new RegExp('<' + tag + '[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))\\s*<\\/' + tag + '>', 'i');
  const m = xml.match(re);
  if (!m) return '';
  return (m[1] !== undefined ? m[1] : m[2] || '').trim();
}

function extractAllTags(xml, tag) {
  const re = new RegExp('<' + tag + '[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))\\s*<\\/' + tag + '>', 'gi');
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    const val = (m[1] !== undefined ? m[1] : m[2] || '').trim();
    if (val) results.push(val);
  }
  return results;
}

function getBlock(xml, tag) {
  const re = new RegExp('<' + tag + '[\\s\\S]*?<\\/' + tag + '>', 'i');
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
  const parts = xml.split(/<item\s/);
  parts.shift();

  const listings = [];

  for (const part of parts) {
    const block = '<item ' + part.split('</item>')[0] + '</item>';

    const status = extractTag(getBlock(block, 'status'), 'name');
    // Show active listings: 'available' + 'new listing'. Exclude 'sold' and 'under contract'.
    const statusLower = status.toLowerCase();
    if (statusLower !== 'available' && statusLower !== 'new listing') continue;

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

    listings.push({ id, title, price, acreage, city, stateAbbr, county, types, agentFirst, agentLast, image, link, featured });
  }

  listings.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return parseInt(b.price || 0) - parseInt(a.price || 0);
  });

  return listings;
}

// ---------------------------------------------------------------
// Render a single listing card (matches Worker output format)
// ---------------------------------------------------------------
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
    ? '<img src="' + esc(l.image) + '" alt="' + title + '" loading="lazy" width="400" height="200" decoding="async">'
    : '<div class="img-placeholder"><i class="fas fa-map-marked-alt" style="font-size:44px;color:#c9a227;opacity:0.6;"></i></div>';

  const featuredBadge = l.featured ? '<span class="featured-badge">Featured</span>' : '';

  const typeTags = types.map(t => '<span class="type-tag">' + esc(t) + '</span>').join('');

  return '\n            <div class="col-lg-4 col-md-6 mb-30 am-prop-card-wrap" data-types="' + typeData + '">' +
    '\n                <div class="am-prop-card">' +
    '\n                    <div class="card-img-wrap">' +
    '\n                        ' + imgHtml +
    '\n                        ' + featuredBadge +
    '\n                        <span class="price-badge">' + price + '</span>' +
    '\n                    </div>' +
    '\n                    <div class="card-body">' +
    (typeTags ? '\n                        <div class="type-tags">' + typeTags + '</div>' : '') +
    '\n                        <p class="prop-title">' + title + '</p>' +
    '\n                        <ul class="prop-meta">' +
    (location ? '\n                            <li><i class="fas fa-map-marker-alt"></i>' + location + '</li>' : '') +
    (acres ? '\n                            <li><i class="fas fa-ruler-combined"></i>' + acres + '</li>' : '') +
    '\n                        </ul>' +
    (agent ? '\n                        <p class="prop-agent"><i class="fas fa-user"></i>' + agent + '</p>' : '') +
    '\n                        <a href="' + link + '" target="_blank" rel="noopener" class="btn-view">View Listing &rarr;</a>' +
    '\n                    </div>' +
    '\n                </div>' +
    '\n            </div>';
}

// ---------------------------------------------------------------
// Build the listings section HTML
// ---------------------------------------------------------------
function buildListingsSection(listings) {
  const count   = listings.length;
  const updated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const cards   = listings.map(renderCard).join('\n');

  const grid = count > 0
    ? '<div class="row" id="am-listings-grid">\n' + cards + '\n            </div>'
    : '<div class="col-12 am-empty-state"><i class="fas fa-map-marked-alt"></i><p>No listings currently available. <a href="/contact.html">Contact Alex</a> directly.</p></div>';

  return '<!-- BEGIN:LISTINGS_CONTENT (auto-generated ' + new Date().toISOString().split('T')[0] + ', ' + count + ' active listings) -->\n' +
    '    <section class="pt-20 pb-60" id="am-listings-section">\n' +
    '        <div class="container">\n' +
    '            ' + grid + '\n' +
    '            <p class="am-updated-note">Listings updated ' + updated + ' &mdash; sourced from <a href="https://l2realtyinc.com/" target="_blank" rel="noopener" style="color:#b0b7c3;">L2 Realty Inc.</a></p>\n' +
    '        </div>\n' +
    '    </section>\n' +
    '<!-- END:LISTINGS_CONTENT -->';
}

// ---------------------------------------------------------------
// Inject into listings.html
// ---------------------------------------------------------------
function injectIntoPage(html, listingsHtml) {
  const markerRe = /<!-- BEGIN:LISTINGS_CONTENT[\s\S]*?<!-- END:LISTINGS_CONTENT -->/;
  if (markerRe.test(html)) {
    return html.replace(markerRe, listingsHtml);
  }
  return html.replace('<!-- CTA -->', listingsHtml + '\n\n    <!-- CTA -->');
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function main() {
  console.log('Fetching REALSTACK listings feed...');
  const xml = await fetchXML();
  console.log('Feed fetched (' + Math.round(xml.length / 1024) + 'KB)');

  const listings = parseListings(xml);
  console.log('Parsed ' + listings.length + ' available listings');

  // Quick sanity check
  const withImages = listings.filter(l => l.image).length;
  console.log('Listings with images: ' + withImages + '/' + listings.length);

  const listingsHtml = buildListingsSection(listings);

  const srcBuf = fs.readFileSync(LISTINGS_SRC);
  const bom = (srcBuf[0] === 0xEF && srcBuf[1] === 0xBB && srcBuf[2] === 0xBF) ? 3 : 0;
  const src = srcBuf.slice(bom).toString('utf8');

  const updated = injectIntoPage(src, listingsHtml);
  fs.writeFileSync(LISTINGS_SRC, updated, 'utf8');
  console.log('listings.html updated with ' + listings.length + ' cards');
  console.log('Now run: node build.js');
}

main().catch(e => { console.error(e); process.exit(1); });
