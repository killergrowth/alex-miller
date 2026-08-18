/**
 * build.js - Alex Miller Real Estate Auctions
 * Assembles HTML pages by replacing <!-- HEADER --> and <!-- FOOTER --> placeholders
 * with content from _partials/header.html and _partials/footer.html.
 * Outputs assembled files to dist/, preserving subdirectory structure.
 *
 * Usage: node build.js
 */

const fs = require('fs');
const path = require('path');
const { generateSitemap } = require('C:\\Users\\KillerGrowth\\.openclaw\\workspace\\tools\\kg-site-builder\\lib\\gen-sitemap');
const { buildBlog } = require('C:\\Users\\KillerGrowth\\.openclaw\\workspace\\tools\\kg-site-builder\\lib\\blog-build');
const SITE_DOMAIN = 'amauctionsandrealestate.com';
const SITE_ID     = 'alex-miller';
const SITE_NAME   = 'AM Auctions & Real Estate';
const { injectScripts, loadSiteScripts } = require('C:\\Users\\KillerGrowth\\.openclaw\\workspace\\tools\\kg-site-builder\\lib\\inject-scripts');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PARTIALS = path.join(ROOT, '_partials');

// Default Open Graph image injected into every page
const OG_IMAGE_URL = 'https://amauctionsandrealestate.com/images/Preview_Image_May_18__2026__02_22_53_PM.png';

// Favicon image (PNG — modern browsers support PNG favicons)
const FAVICON_PATH = '/images/ChatGPT_Image_May_22__2026__09_18_34_AM.png';

// Core pages (root level)
const ROOT_PAGES = [
  'index.html',
  'about.html',
  'services.html',
  'listings.html',
  'contact.html',
  'service-areas.html',
  'resources.html',
  'privacy-policy.html'];

// Service sub-pages
const SERVICE_PAGES = [
  'services/real-estate-auctions.html',
  'services/land-auctions.html',
  'services/agent-services.html',
  'services/auction-101.html'];

// Location pages (auto-discovered)
function discoverLocationPages() {
  const locDir = path.join(ROOT, 'locations');
  if (!fs.existsSync(locDir)) return [];
  const pages = [];
  const dirs = fs.readdirSync(locDir, { withFileTypes: true });
  for (const d of dirs) {
    if (d.isDirectory()) {
      const idx = path.join('locations', d.name, 'index.html');
      if (fs.existsSync(path.join(ROOT, idx))) {
        pages.push(idx);
      }
    }
  }
  return pages;
}

// Auction pages (auto-discovered from auctions/ source dir)
function discoverAuctionPages() {
  const auctDir = path.join(ROOT, 'auctions');
  if (!fs.existsSync(auctDir)) return [];
  const pages = [];
  // Master index
  if (fs.existsSync(path.join(auctDir, 'index.html'))) {
    pages.push('auctions/index.html');
  }
  // Individual auction slugs
  const entries = fs.readdirSync(auctDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      const idx = path.join('auctions', entry.name, 'index.html');
      if (fs.existsSync(path.join(ROOT, idx))) {
        pages.push(idx);
      }
    }
  }
  return pages;
}

const ALL_PAGES = [
  ...ROOT_PAGES,
  ...SERVICE_PAGES,
  ...discoverLocationPages(),
  ...discoverAuctionPages()];

// Asset folders to copy into dist (paths relative to ROOT)
const ASSET_DIRS = ['css', 'js', 'img', 'images', 'fonts', 'fontawesome'];

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Replace any existing shortcut icon / favicon link with the new PNG favicon.
 * Also injects apple-touch-icon for iOS home screen.
 */
function updateFavicon(html) {
  const faviconTags = `<link rel="icon" type="image/png" href="${FAVICON_PATH}">
    <link rel="shortcut icon" type="image/png" href="${FAVICON_PATH}">
    <link rel="apple-touch-icon" href="${FAVICON_PATH}">`;
  // Replace existing shortcut icon line if present
  html = html.replace(/<link rel="shortcut icon"[^>]*>/g, '');
  html = html.replace(/<link rel="icon"[^>]*>/g, '');
  html = html.replace(/<link rel="apple-touch-icon"[^>]*>/g, '');
  // Inject after <head>
  return html.replace('<head>', '<head>\n    ' + faviconTags);
}

/**
 * Inject default OG/Twitter social meta tags before </head> if not already present.
 * Only injects og:image if the page doesn't already have one.
 */
function injectSocialMeta(html) {
  if (html.includes('og:image')) return html; // already has one, skip
  const socialTags = `
    <!-- Default social preview image -->
    <meta property="og:image" content="${OG_IMAGE_URL}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="800">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${OG_IMAGE_URL}">`;
  return html.replace('</head>', socialTags + '\n</head>');
}

// ------------------------------------------------------------------
// Load partials
// ------------------------------------------------------------------

const header = fs.readFileSync(path.join(PARTIALS, 'header.html'), 'utf8');
const footer = fs.readFileSync(path.join(PARTIALS, 'footer.html'), 'utf8');

// ------------------------------------------------------------------
// Prepare dist/
// ------------------------------------------------------------------

ensureDir(DIST);

// Copy asset directories
for (const dir of ASSET_DIRS) {
  const src = path.join(ROOT, dir);
  const dest = path.join(DIST, dir);
  copyDir(src, dest);
  if (fs.existsSync(src)) {
    console.log(`Copied ${dir}/ -> dist/${dir}/`);
  }
}

// Copy favicon
const favicon = path.join(ROOT, 'img', 'favicon.ico');
if (fs.existsSync(favicon)) {
  fs.copyFileSync(favicon, path.join(DIST, 'favicon.ico'));
}

// Copy _redirects (Cloudflare Pages routing rules)
const redirectsSrc = path.join(ROOT, '_redirects');
if (fs.existsSync(redirectsSrc)) {
  fs.copyFileSync(redirectsSrc, path.join(DIST, '_redirects'));
}

// Copy _worker.js (Cloudflare Pages Worker — handles robots, listings, contact, redirects)
const workerSrc = path.join(ROOT, '_worker.js');
if (fs.existsSync(workerSrc)) {
  fs.copyFileSync(workerSrc, path.join(DIST, '_worker.js'));
}

// Copy _routes.json (scopes which paths the Worker handles)
const routesSrc = path.join(ROOT, '_routes.json');
if (fs.existsSync(routesSrc)) {
  fs.copyFileSync(routesSrc, path.join(DIST, '_routes.json'));
}

// ------------------------------------------------------------------
// Assemble pages
// ------------------------------------------------------------------

let built = 0;
let skipped = 0;

for (const page of ALL_PAGES) {
  const srcPath = path.join(ROOT, page);
  if (!fs.existsSync(srcPath)) {
    console.warn(`SKIP  ${page} (not found)`);
    skipped++;
    continue;
  }

  // Ensure output directory exists
  const destPath = path.join(DIST, page);
  ensureDir(path.dirname(destPath));

  let html = fs.readFileSync(srcPath, 'utf8');

  if (html.includes('<!-- HEADER -->')) {
    html = html.replace('<!-- HEADER -->', header);
  } else {
    console.warn(`WARN  ${page}: no <!-- HEADER --> placeholder found`);
  }

  if (html.includes('<!-- FOOTER -->')) {
    html = html.replace('<!-- FOOTER -->', footer);
  } else {
    console.warn(`WARN  ${page}: no <!-- FOOTER --> placeholder found`);
  }

  // Update favicon on every page
  html = updateFavicon(html);

  // Inject social meta tags
  html = injectSocialMeta(html);

  html = injectScripts(html, loadSiteScripts(SITE_ID));
  fs.writeFileSync(destPath, html, 'utf8');
  console.log(`Built ${page} -> dist/${page}`);
  built++;
}

console.log(`\nDone. ${built} pages built, ${skipped} skipped.`);

// Build blog posts and index
buildBlog({
  srcDir: ROOT,
  distDir: DIST,
  siteId: SITE_ID,
  domain: SITE_DOMAIN,
  siteName: SITE_NAME,
  primaryColor: '#b8860b'
});

// Generate sitemap from actual dist/ contents
generateSitemap({ distDir: DIST, siteRoot: ROOT, domain: SITE_DOMAIN });
