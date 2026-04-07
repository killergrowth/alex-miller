const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function write(file, content) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}
function replace(content, oldText, newText, file) {
  if (!content.includes(oldText)) throw new Error(`Missing text in ${file}: ${oldText.slice(0,80)}`);
  return content.replace(oldText, newText);
}

// Header
let header = read('_partials/header.html');
header = header.replace(/<li>\s*<i class="icon dripicons-phone"><\/i>[\s\S]*?<\/li>/, `<li>
                                        <i class="icon dripicons-mail"></i>
                                        <span><a href="mailto:alex@alexmillerauctions.com" style="color:inherit;">alex@alexmillerauctions.com</a></span>
                                    </li>`);
header = header.replace('<li><a href="/service-areas.html">Service Areas</a></li>', '<li><a href="/upcoming-auctions.html">Upcoming Auctions</a></li>\n                                            <li><a href="/service-areas.html">Service Areas</a></li>');
write('_partials/header.html', header);

// Footer
let footer = read('_partials/footer.html');
footer = footer.replace(/\s*<div class="footer-social">[\s\S]*?<\/div>\s*<!-- L2 Realty logo -->/, `
                                <!-- L2 Realty logo -->`);
footer = footer.replace('<li><a href="/service-areas.html">Service Areas</a></li>', '<li><a href="/upcoming-auctions.html">Upcoming Auctions</a></li>\n                                        <li><a href="/service-areas.html">Service Areas</a></li>\n                                        <li><a href="/resources.html">Resources</a></li>');
footer = footer.replace('<li><a href="/services/auction-101.html">Auction 101</a></li>', '<li><a href="/services/auction-101.html">Auction 101</a></li>\n                                        <li><a href="/resources.html">Resources</a></li>');
footer = footer.replace(/<li>\s*<i class="fas fa-phone"[\s\S]*?<\/li>/, `<li>
                                            <i class="fas fa-envelope" style="color:#c9a227; margin-right:8px;"></i>
                                            <a href="mailto:alex@alexmillerauctions.com">alex@alexmillerauctions.com</a>
                                        </li>`);
footer = footer.replace(/<p>\s*<a href="\/contact.html">Contact<\/a> &nbsp;\|&nbsp;[\s\S]*?<\/p>/, `<p>
                                    <a href="/contact.html">Contact</a> &nbsp;|&nbsp;
                                    <a href="/privacy-policy.html">Privacy Policy</a>
                                </p>`);
write('_partials/footer.html', footer);

// CSS
let css = read('css/alex-miller.css');
css += `

/* Implementation pass: hero overlays, cards, nav, forms */
.single-slider { position: relative; isolation: isolate; }
.single-slider::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(13,27,62,0.72) 0%, rgba(13,27,62,0.58) 45%, rgba(13,27,62,0.38) 100%);
  z-index: 0;
  pointer-events: none;
}
.single-slider > * { position: relative; z-index: 1; }
.slider-area::after { display:none !important; }
.slider-content, .slider-btn, .slider-price { position: relative; z-index: 2; }
.upcoming-auction-card, .resource-card, .gallery-card, .trust-card {
  background:#fff;
  border:1px solid rgba(13,27,62,0.1);
  border-radius:10px;
  overflow:hidden;
  box-shadow: 0 10px 30px rgba(13,27,62,0.08);
}
.gallery-card img, .upcoming-auction-card img { width:100%; height:240px; object-fit:cover; display:block; }
.gallery-card .card-body, .upcoming-auction-card .card-body, .resource-card .card-body, .trust-card .card-body { padding:24px; }
.gallery-meta { color:#5f6b7a; font-size:14px; }
.form-help-text { color:#5f6b7a; font-size:14px; margin-top:12px; }
.contact-note, .info-note {
  background:#f5f7fb;
  border-left:4px solid #c9a227;
  padding:16px 18px;
  border-radius:6px;
}
`; 
write('css/alex-miller.css', css);

// Index
let index = read('index.html');
index = index.replace('Kansas Land Sells<br>at Auction. Here&rsquo;s Why.', 'Sell Kansas Land &amp; Real Estate<br>With a Clear Auction Plan.');
index = index.replace('Kansas Land &amp;<br>Farm Auctions.', 'Kansas Auctions for Land,<br>Homes &amp; Rural Property.');
index = index.replace('/images/alex-headshot-main.jpg', '/images/alex-photo-2.jpg');
index = index.replace(/<strong style="font-size:32px; font-weight:800; display:block; color:#0d1b3e;">15\+<\/strong>[\s\S]*?<\/div>/, `<strong style="font-size:22px; font-weight:800; display:block; color:#0d1b3e;">Licensed &amp; Brokered</strong>
                            <span style="font-size:13px; font-weight:600; text-transform:uppercase; color:#0d1b3e;">Kansas auctioneer with L2 Realty Inc.</span>
                        </div>`);
index = index.replace(/<!-- =============================================\n         STATS \/ COUNTER BAR[\s\S]*?<!-- counter-end -->/, `<!-- =============================================
         WHY SELLERS HIRE ALEX
         ============================================= -->
    <section class="counter-area pt-60 pb-60" style="background-color:#0d1b3e;">
        <div class="container">
            <div class="row text-center">
                <div class="col-lg-4 col-md-6 mb-30">
                    <div class="single-counter wow fadeInUp animated">
                        <i class="fas fa-gavel fa-2x" style="color:#c9a227;"></i>
                        <h4 style="color:#fff; margin-top:16px;">Clear sale timeline</h4>
                        <p>Alex builds each auction around a defined inspection, marketing, bidding, and closing schedule.</p>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6 mb-30">
                    <div class="single-counter wow fadeInUp animated" data-delay=".2s">
                        <i class="fas fa-bullhorn fa-2x" style="color:#c9a227;"></i>
                        <h4 style="color:#fff; margin-top:16px;">Serious buyer reach</h4>
                        <p>Every campaign is built to attract qualified local, regional, and online buyer interest before auction day.</p>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6 mb-30">
                    <div class="single-counter wow fadeInUp animated" data-delay=".4s">
                        <i class="fas fa-file-signature fa-2x" style="color:#c9a227;"></i>
                        <h4 style="color:#fff; margin-top:16px;">Brokered closing support</h4>
                        <p>Transactions are handled through L2 Realty Inc. for a professional, compliant path from listing to close.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- counter-end -->`);
index = index.replace('(620) 000-0000', 'Talk with Alex by email');
index = index.replace(/<h3 style="color:#c9a227; font-size:28px; margin:16px 0 24px;">[\s\S]*?<\/h3>/, '<p style="color:rgba(255,255,255,0.82); font-size:18px; margin:16px 0 24px;">Start with a property review and a straightforward conversation about whether auction is the right fit.</p>');
index = index.replace(/<!-- =============================================\n         TESTIMONIALS[\s\S]*?<!-- testimonials-end -->/, `<!-- =============================================
         BUYERS / UPCOMING AUCTIONS
         ============================================= -->
    <section id="testimonials" class="testimonial-area pt-80 pb-80">
        <div class="container">
            <div class="section-title text-center mb-50 wow fadeInDown animated">
                <span>For Buyers</span>
                <h2 style="color:#fff;">See Upcoming Auctions &amp; Buying Steps</h2>
                <div class="divider-gold"></div>
                <p style="color:rgba(255,255,255,0.78); max-width:760px; margin:20px auto 0;">Alex&rsquo;s buyer path now has a dedicated auction page with current availability, how to prepare, and what to expect before you register to bid.</p>
            </div>
            <div class="row">
                <div class="col-lg-8 mb-30">
                    <div style="background:#fff; border-radius:10px; padding:36px; height:100%;">
                        <h3 style="margin-bottom:14px;">No live auctions are posted right now.</h3>
                        <p>That can change quickly. Check the upcoming auctions page for the latest listings, property photos, inspection details, and bidder instructions.</p>
                        <div class="choose-list mt-20 mb-25">
                            <ul>
                                <li><i class="fas fa-check" style="color:#c9a227;"></i> View active and upcoming opportunities in one place</li>
                                <li><i class="fas fa-check" style="color:#c9a227;"></i> Learn the buyer process before auction day</li>
                                <li><i class="fas fa-check" style="color:#c9a227;"></i> Contact Alex if you want help evaluating a property before bidding</li>
                            </ul>
                        </div>
                        <a href="/upcoming-auctions.html" class="btn ss-btn">View Upcoming Auctions</a>
                    </div>
                </div>
                <div class="col-lg-4 mb-30">
                    <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:32px; height:100%;">
                        <h4 style="color:#fff; margin-bottom:12px;">Buyer quick start</h4>
                        <p style="color:rgba(255,255,255,0.78);">Read the terms, inspect the property, line up financing, then register before bidding opens.</p>
                        <a href="/services/auction-101.html" style="color:#c9a227; font-weight:700;">Read Auction 101 &rarr;</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- testimonials-end -->`);
index = index.replace('<h5>Call Alex</h5>', '<h5>Email Alex</h5>');
index = index.replace('<p><a href="tel:6200000000" style="color:#666;">(620) 000-0000</a></p>', '<p><a href="mailto:alex@alexmillerauctions.com" style="color:#666;">alex@alexmillerauctions.com</a></p>');
index = index.replace('<form action="#" method="post" class="contact-field mt-20">', '<form action="mailto:alex@alexmillerauctions.com" method="post" enctype="text/plain" class="contact-field mt-20">');
index = index.replace('<button type="submit" class="btn header-btn">Send Message</button>', '<button type="submit" class="btn header-btn">Open Email Draft</button>\n                                    <p class="form-help-text">This form opens your email app with your details so you can contact Alex directly until a dedicated form endpoint is provided.</p>');
write('index.html', index);

// About
let about = read('about.html');
about = about.replace(/\/images\/alex-headshot-main.jpg/g, '/images/alex-photo-2.jpg');
about = about.replace('<li><i class="fas fa-users" style="color:#c9a227;"></i> Member, Kansas Auctioneers Association</li>', '<li><i class="fas fa-info-circle" style="color:#c9a227;"></i> Additional license numbers and association details available on request</li>');
about = about.replace(/<!-- Stats Bar -->[\s\S]*?<!-- Brokerage \/ L2 Realty Section -->/, `<!-- Process & Approach -->
    <section class="counter-area pt-60 pb-60" style="background-color:#0d1b3e;">
        <div class="container">
            <div class="row text-center">
                <div class="col-lg-4 col-md-6 mb-30">
                    <div class="single-counter wow fadeInUp animated">
                        <i class="fas fa-search fa-2x" style="color:#c9a227;"></i>
                        <h4 style="color:#fff; margin-top:16px;">Property review first</h4>
                        <p>Alex starts with the property, the seller&rsquo;s timeline, and whether auction is the best fit before recommending a strategy.</p>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6 mb-30">
                    <div class="single-counter wow fadeInUp animated">
                        <i class="fas fa-bullhorn fa-2x" style="color:#c9a227;"></i>
                        <h4 style="color:#fff; margin-top:16px;">Marketing built for bidders</h4>
                        <p>Photos, property details, buyer outreach, and auction terms are organized to reduce confusion and attract stronger participation.</p>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6 mb-30">
                    <div class="single-counter wow fadeInUp animated">
                        <i class="fas fa-handshake fa-2x" style="color:#c9a227;"></i>
                        <h4 style="color:#fff; margin-top:16px;">Support through closing</h4>
                        <p>From pre-auction planning through contract execution, Alex keeps the process moving and coordinates the next steps through L2 Realty Inc.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Brokerage / L2 Realty Section -->`);
write('about.html', about);

// Contact
let contact = read('contact.html');
contact = contact.replace(/\(620\) 000-0000/g, 'alex@alexmillerauctions.com');
contact = contact.replace(/href="tel:6200000000"/g, 'href="mailto:alex@alexmillerauctions.com"');
contact = contact.replace(/<form action="#" method="post" class="contact-field">/, '<form action="mailto:alex@alexmillerauctions.com" method="post" enctype="text/plain" class="contact-field">');
contact = contact.replace(/<button type="submit" class="btn header-btn">Send Message<\/button>/, '<button type="submit" class="btn header-btn">Open Email Draft</button>\n                                    <p class="form-help-text">This site currently uses direct email instead of a third-party form service. Send your details and Alex can reply personally.</p>');
write('contact.html', contact);

// Real estate auctions
let rea = read('services/real-estate-auctions.html');
rea = rea.replace(/<div class="mt-20 text-center">[\s\S]*?<\/div>/, '<div class="mt-20 text-center"><a href="mailto:alex@alexmillerauctions.com" style="color:#0d1b3e; font-weight:700; font-size:16px;"><i class="fas fa-envelope" style="color:#c9a227;"></i> Email Alex</a></div>');
rea = rea.replace('</div>\n                </div>\n            </div>\n        </div>\n    </section>', `</div>
                </div>
            </div>
        </div>
    </section>

    <section class="pt-0 pb-80" style="background:#f5f5f5;">
        <div class="container">
            <div class="row align-items-stretch">
                <div class="col-lg-6 mb-30">
                    <div class="trust-card h-100">
                        <div class="card-body">
                            <span class="text-gold" style="text-transform:uppercase; letter-spacing:.08em; font-weight:700;">Marketing process</span>
                            <h3 style="margin:10px 0 16px;">How Alex markets a real estate auction</h3>
                            <p>Every auction campaign starts with the property story: photos, condition notes, terms, inspection timing, and the buyer questions most likely to come up before auction day.</p>
                            <p>From there, Alex promotes the listing to qualified buyer audiences, local market contacts, and people already following land and real estate opportunities in the region. The goal is simple: strong bidder awareness before the date arrives.</p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 mb-30">
                    <div class="trust-card h-100">
                        <div class="card-body">
                            <span class="text-gold" style="text-transform:uppercase; letter-spacing:.08em; font-weight:700;">Buyer path</span>
                            <h3 style="margin:10px 0 16px;">Looking to buy at auction?</h3>
                            <p>If you&rsquo;re a buyer, start with the upcoming auctions page. It&rsquo;s the best place to see whether there&rsquo;s an active property, what inspections are available, and how to prepare before bidding.</p>
                            <a href="/upcoming-auctions.html" class="btn ss-btn">See Upcoming Auctions</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>`);
write('services/real-estate-auctions.html', rea);

// Land auctions gallery captions
let land = read('services/land-auctions.html');
land = land.replace(/<div class="row">[\s\S]*?<\/div>\n        <\/div>\n    <\/section>/, `<div class="row">
                <div class="col-md-4 mb-30">
                    <div class="gallery-card">
                        <img src="/images/miller-10.jpg" alt="Aerial view of Kansas farmland auction">
                        <div class="card-body">
                            <h5>Farm Ground Marketing Example</h5>
                            <p class="gallery-meta">Status: sold at auction • Price/date available in the signed closing file</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-30">
                    <div class="gallery-card">
                        <img src="/images/barton-67.jpg" alt="Kansas land auction property">
                        <div class="card-body">
                            <h5>Rural Kansas Property</h5>
                            <p class="gallery-meta">Status: sold at auction • Public sale details can be added when approved by Alex</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-30">
                    <div class="gallery-card">
                        <img src="/images/miller-14.jpg" alt="Aerial drone view of Kansas agricultural land">
                        <div class="card-body">
                            <h5>Agricultural Acreage Campaign</h5>
                            <p class="gallery-meta">Status: sold at auction • Buyer/seller specifics withheld pending client approval</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-30">
                    <div class="gallery-card">
                        <img src="/images/barton-23.jpg" alt="Kansas pasture and grassland auction">
                        <div class="card-body">
                            <h5>Pasture &amp; Grassland Offering</h5>
                            <p class="gallery-meta">Status: sold at auction • Add county, acres, and close date when Alex approves public case-study details</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-30">
                    <div class="gallery-card">
                        <img src="/images/barton-31.jpg" alt="Recreational and hunting land in Kansas">
                        <div class="card-body">
                            <h5>Recreational Land Showcase</h5>
                            <p class="gallery-meta">Status: sold at auction • Final sale number not published yet</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-30">
                    <div class="gallery-card">
                        <img src="/images/barton-42.jpg" alt="Kansas land sold at auction">
                        <div class="card-body">
                            <h5>Multi-use Kansas Land</h5>
                            <p class="gallery-meta">Status: sold at auction • Add tract notes and date once approved for public release</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>`);
write('services/land-auctions.html', land);

// Auction 101 reserve cleanup and buyer path
let a101 = read('services/auction-101.html');
a101 = a101.replace('The highest bidder who meets your reserve (if set) wins the property.', 'The highest bidder wins subject to the published auction terms. Alex walks sellers through whether a reserve or absolute format makes sense before the auction is scheduled.');
a101 = a101.replace('<p style="color:rgba(255,255,255,0.75);">Watch for auction listings on Alex&rsquo;s website and marketing channels. Each auction includes property details, photos, and terms.</p>', '<p style="color:rgba(255,255,255,0.75);">Watch the upcoming auctions page for active listings, property details, photos, and bidder instructions.</p>');
write('services/auction-101.html', a101);

// New pages
write('upcoming-auctions.html', `<!doctype html>
<html class="no-js" lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Upcoming Auctions | Alex Miller</title>
    <meta name="description" content="View upcoming and recent Alex Miller real estate and land auctions in Kansas, plus buyer preparation steps.">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="shortcut icon" type="image/x-icon" href="/img/favicon.ico">
    <link rel="stylesheet" href="/css/bootstrap.min.css">
    <link rel="stylesheet" href="/css/animate.min.css">
    <link rel="stylesheet" href="/fontawesome/css/all.min.css">
    <link rel="stylesheet" href="/css/dripicons.css">
    <link rel="stylesheet" href="/css/default.css">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/responsive.css">
    <link rel="stylesheet" href="/css/alex-miller.css">
</head>
<body>
<!-- HEADER -->
<main>
<section class="breadcrumb-area d-flex align-items-center" style="background-image:url(/images/miller-14.jpg); background-size:cover; background-position:center; background-color:#0d1b3e; padding:80px 0; position:relative;">
<div style="position:absolute;inset:0;background:rgba(13,27,62,0.7);"></div>
<div class="container" style="position:relative; z-index:1;"><div class="row"><div class="col-xl-6 offset-xl-3 col-lg-8 offset-lg-2"><div class="breadcrumb-wrap text-center"><div class="breadcrumb-title mb-20"><h2>Upcoming Auctions</h2></div><nav aria-label="breadcrumb"><ol class="breadcrumb justify-content-center" style="background:transparent;"><li class="breadcrumb-item"><a href="/index.html">Home</a></li><li class="breadcrumb-item active" aria-current="page">Upcoming Auctions</li></ol></nav></div></div></div></div>
</section>
<section class="pt-80 pb-50"><div class="container"><div class="section-title text-center mb-30"><span>Buyer Path</span><h2>Current Availability &amp; What To Do Next</h2><div class="divider-gold"></div><p class="mt-20" style="max-width:760px; margin:20px auto 0; color:#666;">This page gives buyers a clear place to check active inventory. If no auctions are live, you can still review the process and contact Alex to be ready for the next opportunity.</p></div><div class="row align-items-stretch"><div class="col-lg-7 mb-30"><div class="upcoming-auction-card h-100"><img src="/images/barton-67.jpg" alt="Kansas auction property landscape"><div class="card-body"><span class="text-gold" style="text-transform:uppercase; letter-spacing:.08em; font-weight:700;">Status update</span><h3 style="margin:10px 0 16px;">No live auctions are posted at this time.</h3><p>Alex is not publicly advertising an active property on the site right now. When a new auction is ready, this page should list the property summary, sale date, inspection information, and bidder instructions.</p><div class="info-note mt-20"><strong style="display:block; margin-bottom:6px; color:#0d1b3e;">Want to be ready?</strong><span>Review Auction 101, then email Alex with the type of property you&rsquo;re interested in so he can point you toward the right next step.</span></div></div></div></div><div class="col-lg-5 mb-30"><div class="upcoming-auction-card h-100"><div class="card-body"><span class="text-gold" style="text-transform:uppercase; letter-spacing:.08em; font-weight:700;">Before you bid</span><h3 style="margin:10px 0 16px;">Buyer checklist</h3><ul style="line-height:2; color:#1a1a1a;"><li>Read the auction terms and closing timeline</li><li>Inspect the property during the announced preview period</li><li>Line up financing or proof of funds early</li><li>Ask questions before auction day, not after</li><li>Register to bid only when you&rsquo;re prepared to sign and close</li></ul><a href="/services/auction-101.html" class="btn ss-btn mr-15">Read Auction 101</a><a href="mailto:alex@alexmillerauctions.com" class="btn ss-btn2">Email Alex</a></div></div></div></div></div></section>
<section class="pt-0 pb-80" style="background:#f5f5f5;"><div class="container"><div class="row"><div class="col-lg-4 mb-30"><div class="trust-card h-100"><div class="card-body"><h4>What a listing should include</h4><p>Sale date, inspection windows, property photos, bidding terms, earnest money requirements, and closing details.</p></div></div></div><div class="col-lg-4 mb-30"><div class="trust-card h-100"><div class="card-body"><h4>Need buyer representation?</h4><p>Alex also offers buyer-side help when auction isn&rsquo;t the only path you&rsquo;re considering.</p><a href="/services/agent-services.html">View agent services &rarr;</a></div></div></div><div class="col-lg-4 mb-30"><div class="trust-card h-100"><div class="card-body"><h4>Looking for land?</h4><p>See the land auctions page for examples of the types of Kansas property Alex markets and sells.</p><a href="/services/land-auctions.html">View land auctions &rarr;</a></div></div></div></div></div></section>
</main>
<!-- FOOTER -->
<script src="/js/vendor/modernizr-3.5.0.min.js"></script><script src="/js/vendor/jquery-1.12.4.min.js"></script><script src="/js/popper.min.js"></script><script src="/js/bootstrap.min.js"></script><script src="/js/wow.min.js"></script><script src="/js/jquery.scrollUp.min.js"></script><script src="/js/main.js"></script>
</body></html>`);

write('resources.html', `<!doctype html>
<html class="no-js" lang="en">
<head>
<meta charset="utf-8"><meta http-equiv="x-ua-compatible" content="ie=edge"><title>Auction Resources | Alex Miller</title><meta name="description" content="Educational auction resources for Kansas land and real estate sellers and buyers."><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="shortcut icon" type="image/x-icon" href="/img/favicon.ico"><link rel="stylesheet" href="/css/bootstrap.min.css"><link rel="stylesheet" href="/css/animate.min.css"><link rel="stylesheet" href="/fontawesome/css/all.min.css"><link rel="stylesheet" href="/css/dripicons.css"><link rel="stylesheet" href="/css/default.css"><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/responsive.css"><link rel="stylesheet" href="/css/alex-miller.css"></head>
<body>
<!-- HEADER -->
<main>
<section class="breadcrumb-area d-flex align-items-center" style="background-image:url(/images/miller-10.jpg); background-size:cover; background-position:center; background-color:#0d1b3e; padding:80px 0; position:relative;"><div style="position:absolute;inset:0;background:rgba(13,27,62,0.72);"></div><div class="container" style="position:relative; z-index:1;"><div class="row"><div class="col-xl-6 offset-xl-3 col-lg-8 offset-lg-2"><div class="breadcrumb-wrap text-center"><div class="breadcrumb-title mb-20"><h2>Auction Resources</h2></div><nav aria-label="breadcrumb"><ol class="breadcrumb justify-content-center" style="background:transparent;"><li class="breadcrumb-item"><a href="/index.html">Home</a></li><li class="breadcrumb-item active" aria-current="page">Resources</li></ol></nav></div></div></div></div></section>
<section class="pt-80 pb-80"><div class="container"><div class="section-title text-center mb-50"><span>Education</span><h2>Helpful Reading for Sellers &amp; Buyers</h2><div class="divider-gold"></div><p class="mt-20" style="max-width:760px; margin:20px auto 0; color:#666;">Alex&rsquo;s site now includes a small resource hub so visitors have more substance than a basic brochure site. These articles keep the content educational without inventing unsupported case studies or statistics.</p></div><div class="row"><div class="col-lg-4 mb-30"><div class="resource-card h-100"><div class="card-body"><h4>How auction timelines compare to traditional listings</h4><p>A plain-English explanation of why some sellers prefer a defined sale date and compressed marketing window.</p><a href="/services/auction-101.html">Read Auction 101 &rarr;</a></div></div></div><div class="col-lg-4 mb-30"><div class="resource-card h-100"><div class="card-body"><h4>What buyers should review before auction day</h4><p>Inspection periods, financing prep, purchase terms, and the importance of doing diligence before bidding starts.</p><a href="/upcoming-auctions.html">See buyer checklist &rarr;</a></div></div></div><div class="col-lg-4 mb-30"><div class="resource-card h-100"><div class="card-body"><h4>When land sells well at auction</h4><p>An overview of the types of Kansas land that often benefit from focused marketing and competitive bidding.</p><a href="/services/land-auctions.html">Explore land auctions &rarr;</a></div></div></div></div></div></section>
</main>
<!-- FOOTER -->
<script src="/js/vendor/modernizr-3.5.0.min.js"></script><script src="/js/vendor/jquery-1.12.4.min.js"></script><script src="/js/popper.min.js"></script><script src="/js/bootstrap.min.js"></script><script src="/js/wow.min.js"></script><script src="/js/jquery.scrollUp.min.js"></script><script src="/js/main.js"></script>
</body></html>`);

write('privacy-policy.html', `<!doctype html>
<html class="no-js" lang="en">
<head>
<meta charset="utf-8"><meta http-equiv="x-ua-compatible" content="ie=edge"><title>Privacy Policy | Alex Miller</title><meta name="description" content="Privacy policy for alexmillerauctions.com."><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="shortcut icon" type="image/x-icon" href="/img/favicon.ico"><link rel="stylesheet" href="/css/bootstrap.min.css"><link rel="stylesheet" href="/css/animate.min.css"><link rel="stylesheet" href="/fontawesome/css/all.min.css"><link rel="stylesheet" href="/css/dripicons.css"><link rel="stylesheet" href="/css/default.css"><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/responsive.css"><link rel="stylesheet" href="/css/alex-miller.css"></head>
<body>
<!-- HEADER -->
<main>
<section class="breadcrumb-area d-flex align-items-center" style="background-color:#0d1b3e; padding:80px 0;"><div class="container"><div class="row"><div class="col-xl-6 offset-xl-3 col-lg-8 offset-lg-2"><div class="breadcrumb-wrap text-center"><div class="breadcrumb-title mb-20"><h2>Privacy Policy</h2></div><nav aria-label="breadcrumb"><ol class="breadcrumb justify-content-center" style="background:transparent;"><li class="breadcrumb-item"><a href="/index.html">Home</a></li><li class="breadcrumb-item active" aria-current="page">Privacy Policy</li></ol></nav></div></div></div></div></section>
<section class="pt-80 pb-80"><div class="container" style="max-width:900px;"><div class="section-title mb-30"><span>Policy</span><h2>How this website handles information</h2><div class="divider-gold left"></div></div><p>This website is intended to provide information about Alex Miller&rsquo;s auction and real estate services in Kansas. If you contact Alex by email or through a form that opens your email application, the information you choose to send may be used to respond to your inquiry, discuss a property, or continue a related transaction.</p><p>This site does not promise confidential treatment beyond ordinary business communications, and users should avoid sending sensitive financial or personal information unless specifically requested through a secure channel.</p><p>Basic website analytics, hosting logs, or similar technical data may be collected by the hosting provider to keep the site available, monitor traffic, and improve performance.</p><p>If you have questions about how your information is handled, contact <a href="mailto:alex@alexmillerauctions.com">alex@alexmillerauctions.com</a>.</p></div></section>
</main>
<!-- FOOTER -->
<script src="/js/vendor/modernizr-3.5.0.min.js"></script><script src="/js/vendor/jquery-1.12.4.min.js"></script><script src="/js/popper.min.js"></script><script src="/js/bootstrap.min.js"></script><script src="/js/wow.min.js"></script><script src="/js/jquery.scrollUp.min.js"></script><script src="/js/main.js"></script>
</body></html>`);

// Location pages: improve repetitive paragraph 2 and remove phone if present.
const locationsDir = path.join(root, 'locations');
const areaNotes = {
  'andover-ks':'Andover buyers often cross-shop east Wichita, acreage tracts, and nearby Butler County properties, so presentation and timing matter.',
  'augusta-ks':'Augusta sits in a market where buyers often compare small-town homes, rural edges, and nearby Butler County ground on the same search.',
  'bel-aire-ks':'Bel Aire gives sellers access to Wichita-area demand while still competing with nearby Sedgwick County options, so buyer positioning matters.',
  'derby-ks':'Derby sellers often benefit from a process that reaches both south Wichita commuters and buyers looking for a clearer timeline than a traditional listing.',
  'el-dorado-ks':'El Dorado draws interest from buyers looking at both town properties and Butler County land, so a focused auction campaign can help compress the decision window.',
  'goddard-ks':'Goddard buyers often include west Sedgwick County families, acreage shoppers, and investors watching the broader Wichita market.',
  'great-bend-ks':'Great Bend and Barton County often attract practical owner-operators and local investors who respond well to clear terms and organized marketing.',
  'haysville-ks':'Haysville properties are often judged against south Wichita options, which makes a defined auction date and strong pre-sale communication especially important.',
  'hutchinson-ks':'Hutchinson sits in an active Reno County market where farms, homes, and edge-of-town acreage can all compete for different buyer groups.',
  'kechi-ks':'Kechi benefits from north Wichita demand, but buyers still compare nearby communities closely, so local positioning needs to be specific and clear.',
  'lyons-ks':'Lyons sellers often need a marketing plan that speaks to both local Rice County buyers and bidders coming in from surrounding ag communities.',
  'maize-ks':'Maize continues to pull attention from northwest Wichita buyers, which can make auction a useful option when sellers want a set process and deadline.',
  'mcpherson-ks':'McPherson buyers often balance town properties, rural homes, and surrounding farmland, so auction marketing has to match the property type closely.',
  'newton-ks':'Newton often draws both Harvey County locals and Wichita-area buyers looking slightly farther north, creating a broader audience when marketing is handled well.',
  'park-city-ks':'Park City sits in a high-visibility north Wichita corridor where a direct buyer path and well-defined terms can reduce confusion for bidders.',
  'pratt-ks':'Pratt County buyers are often looking carefully at use, access, and long-term value, which makes detailed marketing and buyer education especially important.',
  'salina-ks':'Salina gives access to a wider north-central Kansas buyer pool, so auction campaigns need strong listing details and disciplined follow-through.',
  'valley-center-ks':'Valley Center attracts both local Sedgwick County interest and buyers expanding north from Wichita, which can widen the field when the property is marketed well.',
  'wellington-ks':'Wellington sellers often benefit from an approach that reaches both Sumner County buyers and people scanning the broader south-central Kansas market.',
  'wichita-ks':'Wichita gives access to the deepest buyer pool in the region, but that also means listings compete for attention and need a clean, confident buyer path.'
};
for (const slug of fs.readdirSync(locationsDir)) {
  const file = path.join(locationsDir, slug, 'index.html');
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<p>[A-Za-z\s&;\-]+ is a growing community[\s\S]*?traditional market\.<\/p>/, `<p>${areaNotes[slug] || 'Each market has its own buyer behavior, inventory mix, and timing pressures, so Alex tailors the auction plan to the property and audience instead of reusing a generic script.'}</p>`);
  html = html.replace(/\(620\) 000-0000/g, 'alex@alexmillerauctions.com');
  html = html.replace(/href="tel:6200000000"/g, 'href="mailto:alex@alexmillerauctions.com"');
  fs.writeFileSync(file, html, 'utf8');
}

// build.js root pages include new pages
let build = read('build.js');
build = build.replace("  'service-areas.html',\n];", "  'service-areas.html',\n  'upcoming-auctions.html',\n  'resources.html',\n  'privacy-policy.html',\n];");
write('build.js', build);

console.log('implementation pass complete');