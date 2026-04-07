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

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PARTIALS = path.join(ROOT, '_partials');

// Core pages (root level)
const ROOT_PAGES = [
  'index.html',
  'about.html',
  'services.html',
  'contact.html',
  'service-areas.html',
];

// Service sub-pages
const SERVICE_PAGES = [
  'services/real-estate-auctions.html',
  'services/land-auctions.html',
  'services/agent-services.html',
  'services/auction-101.html',
];

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

const ALL_PAGES = [
  ...ROOT_PAGES,
  ...SERVICE_PAGES,
  ...discoverLocationPages(),
];

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

  fs.writeFileSync(destPath, html, 'utf8');
  console.log(`Built ${page} -> dist/${page}`);
  built++;
}

console.log(`\nDone. ${built} pages built, ${skipped} skipped.`);
