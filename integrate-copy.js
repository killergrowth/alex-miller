/**
 * integrate-copy.js
 * Integrates Clark's copy and asset image paths into all HTML source files.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}
function write(relPath, content) {
  fs.writeFileSync(path.join(ROOT, relPath), content, 'utf8');
  console.log('Updated: ' + relPath);
}

// ============================================================
// 1. HEADER PARTIAL — update logo
// ============================================================
{
  let html = read('_partials/header.html');
  html = html.replace(
    'src="/images/logo-placeholder.png"',
    'src="/images/alex-miller.png"'
  );
  write('_partials/header.html', html);
}

// ============================================================
// 2. FOOTER PARTIAL — update logos
// ============================================================
{
  let html = read('_partials/footer.html');
  html = html.replace(
    'src="/images/logo-placeholder.png"',
    'src="/images/alex-miller.png"'
  );
  html = html.replace(
    'src="/images/l2-realty-logo-placeholder.png"',
    'src="/images/l2-realty-logo.svg"'
  );
  write('_partials/footer.html', html);
}

// ============================================================
// 3. INDEX.HTML
// ============================================================
{
  let html = read('index.html');

  // Hero backgrounds
  html = html.replace(
    'background-image:url(/img/bg/hero-bg-placeholder.jpg)',
    'background-image:url(/images/alex-hutch-21.jpg)'
  );
  html = html.replace(
    'background-image:url(/img/bg/hero-bg-2-placeholder.jpg)',
    'background-image:url(/images/alex-hutch-29.jpg)'
  );

  // Hero headline 1
  html = html.replace(
    'Kansas Real Estate<br>Sold at Auction.',
    'Kansas Land Sells<br>at Auction. Here&rsquo;s Why.'
  );

  // Replace headshot placeholder div
  const headshotPlaceholder = [
    '<!-- ASSET: Alex Miller headshot (Drive ID: 1lyIqaD2QIUGy6cmR0_IAI7BcJMWHOU8-) -->',
    '                        <!-- Replace with /images/alex-miller-headshot.jpg once pulled from Drive -->',
    '                        <div style="background:#162447; height:400px; border-radius:8px; display:flex; align-items:center; justify-content:center;">',
    '                            <span style="color:#c9a227; font-size:48px;"><i class="fas fa-user-tie"></i></span>',
    '                        </div>'
  ].join('\n');
  html = html.replace(
    headshotPlaceholder,
    '                        <img src="/images/alex-headshot-main.jpg" alt="Alex Miller, Licensed Real Estate Auctioneer" style="width:100%; border-radius:8px; object-fit:cover; max-height:400px;">'
  );

  // About intro bio
  html = html.replace(
    '<p>Alex Miller is a licensed real estate auctioneer and REALTOR&reg; based in central Kansas. With deep roots in the region and a reputation for running fair, competitive auctions, Alex helps sellers move property efficiently &mdash; and helps buyers find value in a transparent process.</p>',
    '<p>Alex Miller has been selling Kansas real estate at auction for years, working alongside landowners, farmers, and families who want a fair, competitive process with a clear end date. He&rsquo;s licensed under L2 Realty Inc. and knows central Kansas land the way you&rsquo;d expect from someone who grew up around it.</p>'
  );
  html = html.replace(
    '<p>Whether you&rsquo;re selling farmland, a family home, or an estate, Alex brings expertise, local market knowledge, and the professional backing of L2 Realty Inc. to every auction.</p>',
    "<p>He doesn&rsquo;t believe in high-pressure sales tactics. He believes in good information and letting the market do its job.</p>"
  );

  // About section headline
  html = html.replace(
    '<h2>Real Estate Auctions Done Right in Central Kansas</h2>',
    '<h2>Kansas Real Estate Sold at Auction &mdash; Done Right.</h2>'
  );

  // Why auction body copy
  html = html.replace(
    '<p>Traditional listings can sit on the market for months with uncertain outcomes. Auctions create urgency, competition, and a firm closing timeline. Sellers know exactly when their property will sell &mdash; and buyers know they&rsquo;re getting fair market value.</p>',
    '<p>Most people assume auctions are a last resort for desperate sellers. That&rsquo;s not how it works. Auctions create real competition among qualified buyers, and competition is what gets sellers a fair price. The process is transparent, the timeline is fixed, and there&rsquo;s no guessing when the property will actually sell.</p>\n                        <p>It&rsquo;s not the right fit for every property or every seller. But when it is the right fit, it works.</p>'
  );

  // Service cards copy
  html = html.replace(
    '<p>Competitive, transparent auctions for residential properties. Get maximum market exposure and a firm closing date.</p>',
    '<p>Residential properties, rural homes, and acreage sold through a structured, competitive auction process. One date. Real buyers. No dragging it out.</p>'
  );
  html = html.replace(
    '<p>Farm ground, recreational land, and acreage sold at auction. Reach buyers who are ready to compete.</p>',
    '<p>Farm ground, hunting land, pasture, and recreational tracts. Alex understands agricultural land values and works with buyers who know exactly what they&rsquo;re looking for.</p>'
  );
  html = html.replace(
    '<p>Traditional listing and buyer representation alongside auction services &mdash; one agent for the full process.</p>',
    '<p>Already working with a seller who wants to auction? Alex partners with real estate agents across Kansas to run the auction side of the transaction.</p>'
  );
  html = html.replace(
    '<p>New to real estate auctions? Learn how the process works, what to expect, and how to participate.</p>',
    '<p>Never bought or sold at auction before? Alex walks through how the process works, what to expect, and what questions to ask before you commit.</p>'
  );

  write('index.html', html);
}

// ============================================================
// 4. ABOUT.HTML
// ============================================================
{
  let html = read('about.html');

  // Replace headshot placeholder div (about page version)
  const headshotAbout = [
    '                        <!-- ASSET: Alex Miller headshot (Drive ID: 1lyIqaD2QIUGy6cmR0_IAI7BcJMWHOU8-) -->',
    '                        <!-- Replace with /images/alex-miller-headshot.jpg once pulled from Drive -->',
    '                        <div style="background:#162447; height:500px; border-radius:8px; display:flex; align-items:center; justify-content:center;">',
    '                            <span style="color:#c9a227; font-size:72px;"><i class="fas fa-user-tie"></i></span>',
    '                        </div>',
    '                        <!-- ASSET: Alex Miller logo SVG (Drive ID: 1gEhZE6pKbap37BanqOaZgcku4X3epiS3) -->'
  ].join('\n');

  const headshotAboutNew = [
    '                        <img src="/images/alex-headshot-main.jpg" alt="Alex Miller, Licensed Real Estate Auctioneer" style="width:100%; border-radius:8px; object-fit:cover; max-height:520px;">',
    '                        <div class="mt-20 text-center">',
    '                            <img src="/images/alex-miller.svg" alt="Alex Miller Real Estate Auctions" style="max-height:50px; opacity:0.85;" onerror="this.src=\'/images/alex-miller.png\'">',
    '                        </div>'
  ].join('\n');

  html = html.replace(headshotAbout, headshotAboutNew);

  // About page - replace intro bio
  html = html.replace(
    '<p>Alex Miller is a licensed real estate auctioneer and REALTOR&reg; with deep roots in central Kansas. Alex has built a reputation for running competitive, transparent auctions that deliver real results for sellers throughout the region.</p>',
    '<p>Alex Miller grew up in central Kansas, around farms, feedlots, and the kind of land that doesn&rsquo;t get any attention unless someone&rsquo;s buying or selling it. He went into real estate because he understood the ground, and he got into auctioneering because he saw how often traditional listings failed landowners who deserved better.</p>'
  );

  // Second paragraph with placeholder
  html = html.replace(
    "<p>With a background in [<!-- CLARK COPY: Alex's background / how he got into real estate -->], Alex brings both professional expertise and a genuine understanding of what Kansas landowners and homeowners need. Whether you&rsquo;re settling an estate, transitioning a farm, or looking to sell a home on a clear timeline, Alex provides the guidance and execution to make it happen.</p>",
    "<p>He&rsquo;s been working as a licensed auctioneer and real estate agent under L2 Realty Inc. for years, building a practice focused almost entirely on rural and agricultural properties. Most of his clients are landowners, farm families, and estates dealing with ground that&rsquo;s been in the family for generations. That&rsquo;s work he takes seriously.</p>"
  );

  // Third paragraph
  html = html.replace(
    '<p>Alex operates under the brokerage of L2 Realty Inc., ensuring every transaction is backed by a licensed Kansas real estate brokerage with the full resources to close smoothly.</p>',
    '<p>What sets Alex apart isn&rsquo;t just the auction format. It&rsquo;s that he does his homework on every property before it ever hits the block. He knows the difference between dryland and irrigated ground, what buyers in a given county are actually willing to pay, and how to market a rural tract to people who will show up with real money on auction day.</p>\n                        <p>He also works with other real estate agents across Kansas who have clients interested in selling at auction but don&rsquo;t have the auctioneer license or event experience to run one. For those agents, Alex is the behind-the-scenes partner who handles the auction while they stay involved with their client.</p>'
  );

  // Professional associations placeholder
  html = html.replace(
    '<li><i class="fas fa-users" style="color:#c9a227;"></i> Member, [<!-- CLARK COPY: Professional associations -->]</li>',
    '<li><i class="fas fa-users" style="color:#c9a227;"></i> Member, Kansas Auctioneers Association</li>'
  );

  // L2 Realty logo section
  html = html.replace(
    '                    <!-- ASSET: L2 Realty logo SVG (Drive ID: 1266Cl_ht70enEvgBGh8YCq55DCFVw8Ue) -->\n                    <div style="background:#fff; border:1px solid rgba(13,27,62,0.1); border-radius:8px; padding:40px; display:inline-block; min-width:200px;">\n                        <i class="fas fa-building fa-4x" style="color:#0d1b3e; display:block; margin-bottom:12px;"></i>\n                        <span style="font-weight:700; color:#0d1b3e; font-size:18px;">L2 Realty Inc.</span><br>\n                        <span style="color:#666; font-size:13px;">Licensed Kansas Real Estate Brokerage</span>\n                    </div>',
    '                    <div style="background:#fff; border:1px solid rgba(13,27,62,0.1); border-radius:8px; padding:40px; display:inline-block; min-width:200px;">\n                        <img src="/images/l2-realty-logo.svg" alt="L2 Realty Inc." style="max-height:80px; max-width:200px; object-fit:contain; display:block; margin:0 auto 16px;" onerror="this.style.display=\'none\'">\n                        <span style="font-weight:700; color:#0d1b3e; font-size:18px;">L2 Realty Inc.</span><br>\n                        <span style="color:#666; font-size:13px;">Licensed Kansas Real Estate Brokerage</span>\n                    </div>'
  );

  write('about.html', html);
}

// ============================================================
// 5. SERVICES.HTML
// ============================================================
{
  let html = read('services.html');

  html = html.replace(
    '<p class="mt-20" style="max-width:700px; margin:20px auto 0; color:#666;">Alex Miller offers a range of real estate and auction services designed to help Kansas property owners sell with confidence &mdash; and help buyers find opportunities in a fair, competitive process.</p>',
    '<p class="mt-20" style="max-width:700px; margin:20px auto 0; color:#666;">Alex offers a focused set of services built around real estate auctions in central Kansas. Whether you&rsquo;re a landowner thinking about selling, a buyer looking for rural property, or a fellow agent who wants to offer auction as an option, here&rsquo;s what he does and how it works.</p>'
  );
  html = html.replace(
    '<p>Sell your home or residential property through a competitive auction process. Alex handles everything from pre-auction marketing to closing day, giving sellers a firm date and buyers a transparent process.</p>',
    '<p>Structured auctions for residential and rural properties. Alex manages the marketing, the buyer qualification process, and the auction event itself. You get a clear date, real competition, and a sale that closes.</p>'
  );
  html = html.replace(
    '<p>Central Kansas has a strong market for agricultural land, farm ground, and recreational acreage. Auctions are one of the most effective ways to sell land quickly and at market price.</p>',
    '<p>Farm ground, pasture, timber, hunting tracts, and rural acreage. Alex knows what drives value on agricultural land in central Kansas and markets to buyers who are actively looking.</p>'
  );
  html = html.replace(
    '<p>Not every property is the right fit for auction. As a licensed REALTOR&reg; brokered by L2 Realty Inc., Alex also provides traditional listing and buyer representation services when that&rsquo;s the better path.</p>',
    '<p>You brought the listing. Alex runs the auction. A partnership model built for real estate agents who want to offer auction as an option without having to become auctioneers themselves.</p>'
  );
  html = html.replace(
    '<p>New to real estate auctions? This educational resource walks you through how the auction process works &mdash; from registration to closing &mdash; so you know exactly what to expect, whether you&rsquo;re a buyer or a seller.</p>',
    '<p>A plain-English walkthrough of how real estate auctions work. Good starting point if you&rsquo;re curious about the process but not sure it&rsquo;s right for you.</p>'
  );

  write('services.html', html);
}

// ============================================================
// 6. SERVICES/REAL-ESTATE-AUCTIONS.HTML — add Clark's copy
// ============================================================
{
  let html = read('services/real-estate-auctions.html');

  // The content already has a good structure; update key para with Clark's actual copy
  html = html.replace(
    '<p>When you need to sell a home on a definite timeline &mdash; without months of showings, price reductions, and uncertainty &mdash; a real estate auction may be the right answer. Alex Miller conducts professional, transparent auctions for residential properties across central Kansas.</p>',
    '<p>A real estate auction is a structured sale event where qualified buyers compete in real time for a property. Unlike a traditional listing that can sit on the market for months, an auction sets a specific date and brings motivated buyers to the table at the same time.</p>'
  );
  html = html.replace(
    '<p>Every auction is marketed to reach motivated, qualified buyers. The competitive bidding process drives prices to true market value, and the firm closing date means sellers can plan with confidence.</p>',
    '<p>Alex runs auctions for residential properties, rural homes, homes on acreage, and properties in transition &mdash; estates, divorces, relocations, and similar situations where a defined timeline matters. Every auction is marketed to reach motivated, qualified buyers.</p>'
  );

  // Benefits section - already good, just update key one
  html = html.replace(
    '<p>A fixed sale date means no extended market exposure and no open-ended negotiations. Buyers know they&rsquo;re competing, which tends to produce better offers than a back-and-forth listing process. The terms are set in advance, so there are fewer surprises at closing.</p>',
    '<p>A fixed sale date means no extended market exposure and no open-ended negotiations. Buyers know they&rsquo;re competing, which tends to produce better offers than a back-and-forth listing process. The terms are set in advance, so there are fewer surprises at closing. From signing to close: most transactions run 8 to 12 weeks total.</p>'
  );

  write('services/real-estate-auctions.html', html);
}

// ============================================================
// 7. SERVICES/LAND-AUCTIONS.HTML — add Clark's copy
// ============================================================
{
  let html = read('services/land-auctions.html');

  // Update intro paragraph
  html = html.replace(
    '<p>Kansas has a strong and active market for agricultural land, farm ground, pasture, and recreational acreage. Auctions are one of the most effective ways to sell land &mdash; they bring qualified buyers to a single event, create competitive pricing dynamics, and eliminate the drawn-out negotiation typical of traditional land sales.</p>',
    '<p>Land auctions are what Alex does most. Farm ground, pasture, hunting land, recreational tracts, rural acreage with or without improvements. Central Kansas has a lot of it, and much of it changes hands at auction.</p>'
  );
  html = html.replace(
    '<p>Alex Miller brings experience, local market knowledge, and professional marketing to every land auction in central Kansas. Whether you&rsquo;re selling a family farm, transitioning ag land, or liquidating an estate that includes acreage, Alex can help you reach the right buyers.</p>',
    '<p>He works with individual landowners, farm families, estates, and trusts selling ground that&rsquo;s often been held for decades. These aren&rsquo;t quick transactions. They take real knowledge of local land values, soil types, water rights, and what buyers in a given area are actually paying.</p>'
  );

  // Why auction for land section - update with Clark's
  html = html.replace(
    '<p>Large parcels can often be auctioned in multiple tracts, then offered as a whole at the end. This strategy frequently maximizes total proceeds because it attracts both large and small buyers. Alex can help you determine the optimal tract configuration for your land.</p>',
    '<p>Land is hard to price. Two comparable tracts in the same county can sell for meaningfully different amounts depending on who&rsquo;s in the room on auction day. An auction brings motivated buyers to the table at the same time, under the same terms. That competition tends to reflect what the market actually thinks the ground is worth.</p>\n                    <p>Traditional listings for land can sit for months without a serious offer. An auction sets a date and forces a decision. Large parcels can often be offered in multiple tracts, then as a whole &mdash; a strategy that frequently maximizes total proceeds.</p>'
  );

  write('services/land-auctions.html', html);
}

// ============================================================
// 8. SERVICES/AGENT-SERVICES.HTML
// ============================================================
{
  let html = read('services/agent-services.html');

  // Update headline
  html = html.replace(
    '<h2>Traditional Real Estate Services</h2>',
    '<h2>Agent-to-Agent Auction Services</h2>'
  );
  html = html.replace(
    '<span>Licensed REALTOR&reg; &mdash; Brokered by L2 Realty Inc.</span>',
    '<span>A Partnership Built for Real Estate Agents</span>'
  );

  // Replace intro
  html = html.replace(
    "<p>Not every property is the right fit for auction &mdash; and that&rsquo;s okay. Alex Miller is a licensed REALTOR&reg; brokered by L2 Realty Inc., which means he can also help buyers and sellers through the traditional listing and purchasing process when that&rsquo;s the better path.</p>\n\n                    <p>Having one agent who understands both the auction side and the traditional market gives clients a unique advantage: you get an honest, unbiased recommendation on the best approach for your specific property and situation.</p>",
    "<p>You have a client who wants to sell at auction. Maybe they&rsquo;ve seen it work for a neighbor&rsquo;s farm, or the property has been sitting too long on a traditional listing, or the estate needs a clean process with a definite end date.</p>\n\n                    <p>The problem is you&rsquo;re not a licensed auctioneer. You can&rsquo;t run the event yourself. But you don&rsquo;t want to hand the client to someone else and lose the relationship you&rsquo;ve built. That&rsquo;s where Alex comes in.</p>"
  );

  write('services/agent-services.html', html);
}

// ============================================================
// 9. SERVICE-AREAS.HTML — update intro with Clark's copy
// ============================================================
{
  let html = read('service-areas.html');

  html = html.replace(
    "<p class=\"mt-20\" style=\"max-width:720px; margin:20px auto 0; color:#666;\">Alex Miller conducts real estate and land auctions throughout central Kansas. Whether you&rsquo;re in the Wichita metro, out in the farmland near Great Bend, or anywhere in between &mdash; Alex brings professional auction services to your community.</p>",
    "<p class=\"mt-20\" style=\"max-width:720px; margin:20px auto 0; color:#666;\">Alex Miller is based in central Kansas and works primarily across the surrounding counties and communities. His focus is rural and agricultural property: farm ground, pasture, hunting land, rural homes, and acreage of all types. He&rsquo;s built relationships across this region over years of auctions, and he knows the land markets well enough to give sellers and buyers a realistic picture of what to expect.</p>"
  );

  write('service-areas.html', html);
}

// ============================================================
// 10. LOCATIONS/WICHITA-KS — update with Clark's specific copy
// ============================================================
{
  let html = read('locations/wichita-ks/index.html');

  // Update intro para with Clark's Wichita copy
  html = html.replace(
    "<p>Alex Miller provides professional real estate and land auction services in Wichita and throughout Sedgwick County. Whether you&rsquo;re selling a home, farmland, or investment property in the state&rsquo;s largest city, Alex brings the expertise and local knowledge to run a competitive, transparent auction that delivers results.</p>",
    "<p>Alex Miller serves landowners and property sellers in Wichita and Sedgwick County with real estate auctions. Wichita sits at the center of one of the more active land markets in Kansas, and Alex brings local knowledge of the surrounding rural areas to every auction he runs here.</p>"
  );
  html = html.replace(
    "<p>Wichita is a growing community in Sedgwick County with an active real estate market. Auctions are increasingly being used by sellers who want a defined timeline, competitive pricing, and a streamlined process &mdash; without months of uncertainty on the traditional market.</p>",
    "<p>The Wichita area includes farmland, rural acreage, and residential properties on the edges of the metro. Much of the ground in Sedgwick County and neighboring Harvey, Butler, and Reno counties is productive agricultural land that Alex regularly markets to buyers looking for cropland, pasture, or rural homesites within reasonable distance of the city.</p>"
  );
  // Replace the empty local context placeholder
  html = html.replace(
    '<p><!-- CLARK COPY: Wichita-specific market details and local context --></p>',
    "<p>If you own ground near Wichita and you&rsquo;ve been thinking about selling, contact Alex to talk through what an auction might look like for your specific property.</p>"
  );

  // Fix the "Why Choose Auction in " missing city name
  html = html.replace(
    '<h4 style="color:#0d1b3e; margin:32px 0 16px;">Why Choose Auction in </h4>',
    '<h4 style="color:#0d1b3e; margin:32px 0 16px;">Why Choose Auction in Wichita?</h4>'
  );
  html = html.replace(
    '<h2 style="color:#fff; margin-bottom:8px;">Selling Property in </h2>',
    '<h2 style="color:#fff; margin-bottom:8px;">Selling Property in Wichita?</h2>'
  );

  write('locations/wichita-ks/index.html', html);
}

// ============================================================
// 11. LOCATIONS/HUTCHINSON-KS — update with Clark's specific copy
// ============================================================
{
  let html = read('locations/hutchinson-ks/index.html');

  html = html.replace(
    "<p>Alex Miller provides professional real estate and land auction services in Hutchinson and throughout Reno County. Whether you&rsquo;re selling a home, farmland, or investment property in the Salt City, Alex brings the expertise and local knowledge to run a competitive, transparent auction that delivers results.</p>",
    "<p>Alex Miller serves property sellers and buyers in Hutchinson and Reno County with real estate and land auctions. Hutchinson is squarely in the heart of central Kansas, and much of the ground in this area is agricultural land that&rsquo;s been in families for generations. Alex has worked in this market for years and understands the buyers, the land values, and the timelines that matter here.</p>"
  );
  html = html.replace(
    "<p>Hutchinson is a growing community in Reno County with an active real estate market. Auctions are increasingly being used by sellers who want a defined timeline, competitive pricing, and a streamlined process &mdash; without months of uncertainty on the traditional market.</p>",
    "<p>Reno County is predominantly farmland, with wheat ground, grain operations, and cow-calf pasture making up a large share of what changes hands. Alex also works with rural residential properties, acreage tracts, and any farm with improvements attached. If you&rsquo;re selling land anywhere around Hutchinson, he can give you an honest read on what it&rsquo;s worth and whether auction is the right approach.</p>"
  );
  html = html.replace(
    '<p><!-- CLARK COPY: Hutchinson-specific market details and local context --></p>',
    "<p>Alex handles everything from the initial walkthrough to closing day. He&rsquo;s licensed as both a Kansas auctioneer and a real estate agent under L2 Realty Inc., which means he can manage the full transaction in-house without handing you off to a separate closing agent.</p>"
  );

  html = html.replace(
    '<h4 style="color:#0d1b3e; margin:32px 0 16px;">Why Choose Auction in </h4>',
    '<h4 style="color:#0d1b3e; margin:32px 0 16px;">Why Choose Auction in Hutchinson?</h4>'
  );
  html = html.replace(
    '<h2 style="color:#fff; margin-bottom:8px;">Selling Property in </h2>',
    '<h2 style="color:#fff; margin-bottom:8px;">Selling Property in Hutchinson?</h2>'
  );

  write('locations/hutchinson-ks/index.html', html);
}

// ============================================================
// 12. Fix remaining location pages (generic ones) - fix missing city in heading
// ============================================================
const otherLocations = [
  { dir: 'derby-ks',       city: 'Derby' },
  { dir: 'andover-ks',     city: 'Andover' },
  { dir: 'augusta-ks',     city: 'Augusta' },
  { dir: 'haysville-ks',   city: 'Haysville' },
  { dir: 'valley-center-ks', city: 'Valley Center' },
  { dir: 'goddard-ks',     city: 'Goddard' },
  { dir: 'maize-ks',       city: 'Maize' },
  { dir: 'park-city-ks',   city: 'Park City' },
  { dir: 'bel-aire-ks',    city: 'Bel Aire' },
  { dir: 'kechi-ks',       city: 'Kechi' },
  { dir: 'el-dorado-ks',   city: 'El Dorado' },
  { dir: 'newton-ks',      city: 'Newton' },
  { dir: 'mcpherson-ks',   city: 'McPherson' },
  { dir: 'pratt-ks',       city: 'Pratt' },
  { dir: 'wellington-ks',  city: 'Wellington' },
  { dir: 'lyons-ks',       city: 'Lyons' },
  { dir: 'salina-ks',      city: 'Salina' },
  { dir: 'great-bend-ks',  city: 'Great Bend' },
];

for (const loc of otherLocations) {
  const filePath = 'locations/' + loc.dir + '/index.html';
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) continue;

  let html = fs.readFileSync(fullPath, 'utf8');

  // Fix "Why Choose Auction in " and "Selling Property in " - add city name
  html = html.replace(
    '<h4 style="color:#0d1b3e; margin:32px 0 16px;">Why Choose Auction in </h4>',
    '<h4 style="color:#0d1b3e; margin:32px 0 16px;">Why Choose Auction in ' + loc.city + '?</h4>'
  );
  html = html.replace(
    '<h2 style="color:#fff; margin-bottom:8px;">Selling Property in </h2>',
    '<h2 style="color:#fff; margin-bottom:8px;">Selling Property in ' + loc.city + '?</h2>'
  );

  fs.writeFileSync(fullPath, html, 'utf8');
  console.log('Updated: ' + filePath);
}

console.log('\nAll copy integration complete.');
