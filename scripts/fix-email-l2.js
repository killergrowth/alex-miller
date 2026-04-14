/**
 * fix-email-l2.js
 * 1. Replace old email with new email sitewide
 * 2. Wrap all bare "L2 Realty" / "L2 Realty Inc." text with a link
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const OLD_EMAIL = 'alex@alexmillerauctions.com';
const NEW_EMAIL = 'alex@amauctionandrealestate.com';
const L2_LINK = 'https://l2realtyinc.com/alex-miller/';

const sourceFiles = [
  'index.html','about.html','services.html','contact.html',
  'service-areas.html','upcoming-auctions.html','resources.html','privacy-policy.html',
  'services/real-estate-auctions.html','services/land-auctions.html',
  'services/agent-services.html','services/auction-101.html',
  '_partials/header.html','_partials/footer.html'
];

// Discover location pages
const locDir = path.join(root, 'locations');
const locs = fs.readdirSync(locDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => path.join('locations', d.name, 'index.html'))
  .filter(p => fs.existsSync(path.join(root, p)));

const allFiles = [...sourceFiles, ...locs];

let totalEmail = 0;
let totalL2 = 0;

for (const file of allFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) { console.log('SKIP (not found): ' + file); continue; }
  let html = fs.readFileSync(p, 'utf8');
  let changed = false;

  // --- 1. Email replacement ---
  const emailCount = (html.match(new RegExp(OLD_EMAIL.replace(/\./g, '\\.'), 'g')) || []).length;
  if (emailCount > 0) {
    html = html.split(OLD_EMAIL).join(NEW_EMAIL);
    totalEmail += emailCount;
    changed = true;
  }

  // --- 2. Wrap bare L2 Realty mentions ---
  // Replace L2 Realty (Inc.) text that is NOT already inside an <a> tag
  // Strategy: replace the entire content, but skip segments inside <a>...</a>
  const L2_RE = /L2 Realty(?:\s+Inc\.?)?/g;
  const L2_WRAPPED = '<a href="' + L2_LINK + '" target="_blank" rel="noopener">L2 Realty Inc.</a>';

  // Process: split into anchor and non-anchor regions
  let result = '';
  let lastIndex = 0;
  // Match all <a ...> ... </a> blocks
  const anchorRe = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
  let aMatch;
  while ((aMatch = anchorRe.exec(html)) !== null) {
    // Process text before this anchor
    const before = html.slice(lastIndex, aMatch.index);
    const beforeFixed = before.replace(L2_RE, L2_WRAPPED);
    const beforeDiff = (before.match(L2_RE) || []).length;
    totalL2 += beforeDiff;
    if (beforeDiff > 0) changed = true;
    result += beforeFixed;
    // Append the anchor block unchanged
    result += aMatch[0];
    lastIndex = aMatch.index + aMatch[0].length;
  }
  // Process remaining text after last anchor
  const remaining = html.slice(lastIndex);
  const remainingFixed = remaining.replace(L2_RE, L2_WRAPPED);
  const remainingDiff = (remaining.match(L2_RE) || []).length;
  totalL2 += remainingDiff;
  if (remainingDiff > 0) changed = true;
  result += remainingFixed;
  html = result;

  if (changed) {
    fs.writeFileSync(p, html, 'utf8');
    console.log('Updated: ' + file + ' (email:' + emailCount + ' l2:' + (remainingDiff + /* counted above */ 0) + ')');
  } else {
    console.log('No change: ' + file);
  }
}

console.log('\nEmail replacements: ' + totalEmail);
console.log('L2 link wraps: ' + totalL2);
