# TEMPLATE-NOTES.md
# Real Estate 1 - Relxtower (Single Property Real Estate Template)
# Source: Envato Elements

---

## Overview

Relxtower is a Bootstrap 4-based HTML template designed for single-property real estate presentations. It is best suited for showcasing ONE property with multiple apartment types/floor plans - not a general multi-listing agency site. The color scheme is warm gold (#d29751) on white/light backgrounds with dark overlays on hero/CTA sections.

**Pages:** index.html, about.html, services.html, listings.html, listing-details.html, blog.html, blog-details.html, contact.html

**Partials system:** Header and footer are in `_partials/`. Run `node build.js` to assemble into `dist/`. Never edit files in `dist/` directly.

---

## CSS Files

| File | Purpose |
|------|---------|
| `css/bootstrap.min.css` | Bootstrap 4 grid + components. All layout uses Bootstrap rows/cols. |
| `css/animate.min.css` | CSS animation keyframes used by wow.js for scroll-triggered animations. |
| `css/magnific-popup.css` | Lightbox styles for image gallery popups and video modals. |
| `fontawesome/css/all.min.css` | Font Awesome 5 icons (solid, regular, light, brands, duotone). Used everywhere for icons. Note: blog.html and blog-details.html reference `css/fontawesome-all.min.css` instead - this is a different path and will 404. Fix this when adapting those pages. |
| `css/dripicons.css` | Dripicons icon set. Used in the header (phone, mail, clock, hamburger, arrows). |
| `css/slick.css` | Minimal styles for the Slick carousel library. |
| `css/default.css` | Template base resets and global defaults (margins, padding, typography base). |
| `css/style.css` | Main template stylesheet (85KB). All component styles: nav, hero/slider, sections, cards, forms, footer. This is the primary file to edit when adapting the template. |
| `css/responsive.css` | Media query overrides for mobile/tablet breakpoints. |

**Primary brand color in style.css:** `#d29751` (warm gold). Search and replace this when branding for a client.

---

## JS Plugins and What They Power

| Plugin | File | Powers |
|--------|------|--------|
| **jQuery 1.12.4** | `js/vendor/jquery-1.12.4.min.js` | Foundation for all other plugins. |
| **Modernizr** | `js/vendor/modernizr-3.5.0.min.js` | Feature detection. Loaded first in `<head>`. |
| **Popper.js** | `js/popper.min.js` | Bootstrap dropdown dependency. |
| **Bootstrap JS** | `js/bootstrap.min.js` | Tab panels (Apartment Plans section), collapse, dropdowns. |
| **Slick Slider** | `js/slick.min.js` | 4 sliders: hero slider (`.slider-active`), gallery/services carousel (`.services-active` - 3 up), testimonials (`.testimonial-active` - 1 up with arrows), brand logos (`.brand-active` - 6 up), blog image slideshow (`.blog-active` - 1 up with fade). |
| **One Page Nav** | `js/one-page-nav-min.js` | Smooth single-page navigation with active class highlighting. Only used on index.html since all nav items have `#` anchors there. |
| **WOW.js** | `js/wow.min.js` | Scroll-triggered entry animations. Elements with class `wow fadeInUp` or `wow fadeInDown` animate in as they enter the viewport. Requires `animate.min.css`. |
| **Magnific Popup** | `js/jquery.magnific-popup.min.js` | Image lightbox (`.popup-image`) and YouTube video modal (`.popup-video`). Gallery images and the hero play button both use this. |
| **CounterUp** | `js/jquery.counterup.min.js` | Animated number counter in the stats bar. Elements with class `.count` count up when scrolled into view. Requires jquery.waypoints. |
| **jQuery Waypoints** | `js/jquery.waypoints.min.js` | Dependency for CounterUp - detects when `.count` elements enter the viewport. |
| **Parallax.js** | `js/parallax.min.js` | Mouse-move parallax effect. Targets `#parallax` element (not currently present in the template pages - can be added). |
| **Paroller.js** | `js/paroller.js` | Scroll-based parallax on elements with class `.paroller` or `data-paroller-*` attributes. |
| **Isotope** | `js/js_isotope.pkgd.min.js` | Masonry/filter grid layout. Targets `.grid` with `.grid-item` children and `.button-group` filter buttons. Not heavily used in current pages but wired up in main.js. |
| **ImagesLoaded** | `js/imagesloaded.min.js` | Waits for images before initializing Isotope grid layout. |
| **jQuery ScrollUp** | `js/jquery.scrollUp.min.js` | Back-to-top button that appears after 300px scroll. Uses `fas fa-level-up-alt` icon. |
| **Ajax Form** | `js/ajax-form.js` | Contact form AJAX submission handler. |
| **Typed.js** | `js/typed.js` | Typewriter text effect. Targets `.element[data-elements="..."]` - not currently used in any page but wired in main.js. |
| **Element In View** | `js/element-in-view.js` | Utility for viewport detection. |
| **main.js** | `js/main.js` | Custom init: sticky header, responsive menu toggle, slick configs, WOW init, scrollUp, magnific popup setup, counterUp, isotope, service card hover active state. |

**Note:** `js/parallax-scroll.js` is referenced in the script tags of all pages but does NOT exist in the `js/` directory. This will cause a 404. It can be removed from the page `<script>` tags when adapting.

---

## Navigation Structure

All pages share the same nav:
- **Home** -> index.html
- **About** -> about.html
- **Services** -> services.html
- **Listings** -> listings.html
- **Blog** -> blog.html
- **Contact** -> contact.html (styled with class `top-btn` - renders as a button/pill)

Internal deep links:
- Blog post cards link to `blog-details.html`
- Listings cards link to `listing-details.html`
- Gallery/apartment `apartments-details.html` is referenced in index but does NOT exist as a file. Use `listing-details.html` instead.

**Mobile nav:** Controlled by `.responsive` button (dripicons hamburger icon) toggling `#mobile-menu` via slideToggle. Closes on menu item click when viewport < 1200px.

**Sticky header:** `#header-sticky` gets class `sticky-menu` added after 200px scroll.

---

## Sections By Page

### index.html (Home)

1. **Slider / Hero** (`section#home .slider-area`)
   - Class: `.slider-active` (Slick carousel, fade mode, 10s autoplay)
   - Two slides, each: full-bleed background image, left column with `h2` headline + property feature icons list + CTA buttons, right column with price display
   - Background images set via inline `style="background-image:url(...)"` on `.single-slider.slider-bg`
   - Animate.css classes on headline/list with `data-animation` and `data-delay` attributes
   - Video play button uses `.popup-video` (Magnific Popup iframe)

2. **About** (`section#about .about-area`)
   - Left: feature image with `.about-text.second-about` badge overlay (e.g., "35 years of experience")
   - Right: heading, subheading, body copy, CTA button
   - Classes: `.s-about-img`, `.about-content.s-about-content`, `.about-title.second-atitle`

3. **Stats / Counter Bar** (`.counter-area`)
   - Dark background image set via inline style
   - 4 stat boxes: icon + `.count` span + label
   - CounterUp animates `.count` values when scrolled into view
   - Classes: `.single-counter`, `.counter`, `.count`

4. **Interior Gallery / Services Carousel** (`section#services .services-area` - first instance)
   - `.services-active` - Slick slider, 3-up on desktop
   - Cards: `.single-services` with `.services-thumb` (image + `.popup-image` link for lightbox) and `.services-content` (label + title link)

5. **Why Choose Us / Feature Split** (`section.choose-area`)
   - Background: `#f5f5f5`
   - Left: feature image
   - Right: section heading, body copy, feature list (icon + text), price display, CTA button
   - Classes: `.chosse-img` (decorative bg element), `.choose-wrap`, `.choose-content`, `.choose-list`

6. **Services Cards (What We Do)** (`section#services .services-area.services-two` - second instance)
   - 6-card grid, 3 columns
   - Card: `.s-single-services` with `.services-ico2` (FontAwesome icon) + `.second-services-content2` (title + copy + link)
   - Hover triggers `active` class (JS in main.js)

7. **CTA Banner** (`section.cta-area.cta-bg`)
   - Full-width background image overlay
   - Centered: tagline `<p>`, large `<h2>` headline, phone `<h3>`, CTA button
   - Classes: `.cta-title`, `.cta-btn.s-cta-btn`

8. **Apartment Plans** (`section.apartments` - first instance)
   - Bootstrap nav-tabs panel: Penthouse, Studio, Duplex, Double Height tabs
   - Each tab: description + spec list (floor, rooms, sqft, parking, price) + floor plan image
   - Classes: `.nav.nav-tabs.nav-fill`, `.tab-content`, `.tab-pane`, `.apartments-img`

9. **Availability Table** (`section.apartments` - second instance, gray bg)
   - HTML `<table>` with columns: residence, bed/bath, sq.ft, sale price, rent price, floor plan link
   - Floor plan links use `.popup-image` to open lightbox
   - Classes: `.availability-section`, `.availability-table`, `.table`

10. **Neighborhoods** (`section#services .services-area.services-two` - third instance)
    - 6-card grid listing nearby amenities (hospital, supermarket, etc.) with distance
    - Different card layout: `.second-services-content` (title + description) + `.services-icon` (icon on right)
    - Active card style on one card by default

11. **Testimonials** (`section#testimonios .testimonial-area`)
    - Full-bleed background image
    - `.testimonial-active` - Slick slider, 1-up with left/right arrows (dripicons arrows)
    - Card: `.single-testimonial` with quote icon + text + avatar image + name/title
    - Classes: `.testi-author`, `.ta-info`

12. **Blog Preview** (`section#blog .blog-area`)
    - 3-column grid of post cards
    - Card: `.single-post` with `.blog-thumb` (image link) + `.blog-content` (meta: author/date/category + title)
    - Meta list: `.b-meta` with author, date, category tag (`.corpo`)
    - Middle card has `.active` class for highlight effect

13. **Contact Form with Info** (`section#contact .contact-area.contact-bg`)
    - Left col: 3 info blocks with icon (`.f-cta-icon`) + heading + text
    - Right col: contact form with name, email, subject, message fields + submit button
    - Classes: `.contact-info`, `.single-cta`, `.contact-form`, `.contact-field`, `.c-name`, `.c-email`, `.c-subject`, `.c-message`

14. **Brand/Partners Carousel** (`.brand-area`)
    - Gold background (`#d29751`)
    - `.brand-active` - Slick slider, 6-up logos
    - Classes: `.single-brand`

---

### about.html

1. **Breadcrumb Hero** (`section.breadcrumb-area`) - shared pattern on all inner pages
2. **About Split** (`section#about .about-area`) - same as index about section, columns swapped
3. **CTA Banner** - same as index CTA section
4. **Stats Counter Bar** - same as index counter, no background image on this page version

---

### services.html

1. **Breadcrumb Hero**
2. **Services Cards (What We Do)** - 6-card grid with icons, same as index
3. **CTA Banner** - same as index
4. **Amenities/Features Grid** - 9-card grid using the icon-right layout (`.second-services-content` + `.services-icon`)
   - Lists property amenities: AC, flooring, terrace, bedding, etc.

---

### listings.html

1. **Breadcrumb Hero**
2. **Listings Gallery** (`section#services .services-area`)
   - `.services-active2` - Note different class vs index's `.services-active` - this one does NOT initialize a Slick slider in main.js. Cards render as a static grid.
   - 6 property cards with image + label + title linking to listing-details.html

---

### listing-details.html

1. **Breadcrumb Hero**
2. **Property Detail Split** (`section.choose-area`) - same choose-area pattern: image left, specs right with price + CTA
3. **CTA Banner** - same as index

---

### blog.html

1. **Breadcrumb Hero**
2. **Blog Feed** (`section.inner-blog`)
   - Full-width single column post list (no sidebar in this template)
   - 6 post types demonstrated: standard image post, video post (`.popup-video`), image slideshow post (`.blog-active` Slick), embedded audio post (iframe), text-only post, blockquote/quote post (`.quote-post`)
   - Each: `.bsingle__post` with `.bsingle__post-thumb` + `.bsingle__content` containing `.meta-info` (author, comments) + h2 title + excerpt + Read More button
   - Pagination: `.pagination-wrap` with Bootstrap `.pagination` component
   - **Note:** This page uses `css/fontawesome-all.min.css` (wrong path) instead of `fontawesome/css/all.min.css`. Fix when adapting.

---

### blog-details.html

1. **Breadcrumb Hero**
2. **Blog Detail** (`section.inner-blog.b-details-p`)
   - Single article layout: hero image + meta + article body with blockquote + inline images
   - Classes: `.blog-details-wrap`, `.meta__info`, `.details__content`, `.details__content-img`
   - **Note:** Also uses `css/fontawesome-all.min.css` (wrong path). Fix when adapting.

---

### contact.html

1. **Breadcrumb Hero**
2. **Contact Form + Info** - same layout as index contact section
3. **Brand Carousel** - same as index

---

## Key HTML Patterns

### Section Title Pattern
All section headings use this structure:
```html
<div class="section-title text-center pl-40 pr-40 mb-80 wow fadeInDown animated">
  <span>Eyebrow label</span>
  <h2>Main Heading</h2>
</div>
```
Left-aligned variant uses `.left-align` and `.w-title` on the wrapper.

### Breadcrumb Hero (inner pages)
```html
<section class="breadcrumb-area d-flex align-items-center" style="background-image:url(img/testimonial/test-bg.jpg)">
  <div class="container">
    <div class="row">
      <div class="col-xl-6 offset-xl-3 col-lg-8 offset-lg-2">
        <div class="breadcrumb-wrap text-center">
          <div class="breadcrumb-title mb-30">
            <h2>Page Title</h2>
          </div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="index.html">Home</a></li>
              <li class="breadcrumb-item active">Current Page</li>
            </ol>
          </nav>
        </div>
      </div>
    </div>
  </div>
</section>
```
The background image is set inline. Swap `test-bg.jpg` for any full-width image.

### WOW Scroll Animation Pattern
Add these attributes to any block element to animate it on scroll:
```html
<div class="wow fadeInUp animated" data-animation="fadeInDown animated" data-delay=".2s">
```
The `data-animation` attribute is also used by the Slick hero slider's custom animation handler. Both `fadeInUp` and `fadeInDown` are common. Delay values: `.2s`, `.4s`, `.6s`, `.8s`.

### Slick Slider Elements
- **Hero:** wrap slides in `.slider-active` > `.single-slider.slider-bg`
- **Gallery carousel:** `.services-active` (3-up)
- **Testimonials:** `.testimonial-active` (1-up with arrows)
- **Brands:** `.brand-active` (6-up)
- **Blog images:** `.blog-active` (1-up fade)
- All Slick configs are in `js/main.js`

### Property Feature List
Used in hero slides and choose sections:
```html
<ul>
  <li><i class="fas fa-bed"></i><span>3 Bedrooms</span></li>
  <li><i class="fal fa-pencil-ruler"></i><span>2,543 Sq Ft</span></li>
  <li><i class="fas fa-bath"></i><span>4 Bathrooms</span></li>
  <li><i class="fas fa-car"></i><span>2 Car Parking</span></li>
</ul>
```

### Counter / Stat Box
```html
<div class="single-counter text-center mb-30 wow fadeInUp animated">
  <i class="fas fa-bed"></i>
  <div class="counter p-relative">
    <span class="count">6</span>
  </div>
  <p>Bedrooms</p>
</div>
```

### Service Card Variants
Two styles exist:

**Style 1** (icon top, content below - used in "What We Do" sections):
```html
<div class="s-single-services">
  <div class="services-ico2"><i class="far fa-building"></i></div>
  <div class="second-services-content2">
    <h5>Title</h5>
    <p>Description</p>
    <a href="#">Read More</a>
  </div>
</div>
```

**Style 2** (icon right, content left - used in Neighborhoods/Amenities sections):
```html
<div class="s-single-services">
  <div class="second-services-content"><h5>Title</h5><p>Detail</p></div>
  <div class="services-icon"><i class="far fa-star-half"></i></div>
</div>
```
Add class `active` to one card in the group for the default highlighted state.

---

## Known Issues / Gotchas

1. **Missing JS file:** `js/parallax-scroll.js` is referenced in `<script>` tags on all pages but does not exist. Will cause a 404. Remove or replace when adapting.

2. **FontAwesome path inconsistency:** `blog.html` and `blog-details.html` link to `css/fontawesome-all.min.css` instead of `fontawesome/css/all.min.css`. Both paths will fail unless you create a symlink or copy the file. Fix when adapting those pages.

3. **Duplicate section IDs:** `index.html` uses `id="services"` on THREE different sections. Not valid HTML. Remove/change IDs when adapting.

4. **`apartments-details.html` dead link:** Gallery and apartment cards on index.html link to `apartments-details.html` which does not exist. Point these to `listing-details.html`.

5. **`.services-active2` is not initialized:** `listings.html` uses class `.services-active2` but there is no corresponding Slick init in `main.js`. Cards render as a normal static grid, not a slider. This is fine for a listings page.

6. **Hero slider has unclosed `<h2>` tag:** In `index.html`, both slider slides have `<h2>$1,786.80<h2>` (closing tag missing the slash). Fix when adapting.

7. **`text-xl-right` malformed in original HTML:** Original pages had `class="main-menu text-right <text-xl-right></text-xl-right>"` in the nav - this is broken HTML. Fixed in the `_partials/header.html` to use `class="main-menu text-right text-xl-right"`.

---

## When to Use Which Sections

| Scenario | Sections to Use |
|----------|----------------|
| Single property hero | Slider (full-screen slides) or choose-area split (image + specs) |
| Property stats highlight | counter-area (sq ft, beds, baths, parking) |
| Interior photo gallery | services-area gallery carousel (`.services-active`) |
| Floor plans | apartments section with Bootstrap nav-tabs, one tab per floor type |
| Availability/pricing | availability-section table |
| Nearby amenities | Neighborhoods-style services grid (icon-right layout) |
| Testimonials | testimonial-area with Slick slider |
| Blog/news preview | blog-area 3-column card grid |
| Full contact | contact-area with info blocks + form |
| Certifications/partners | brand-area carousel |
| About the agent/company | about-area split (image + bio + badge overlay) |
| Services list | services-two cards (icon-top layout) |
| CTA/appointment | cta-area with phone number |

**For a typical KillerGrowth real estate client site (single property):**
- Keep: Slider/hero, counter-area, gallery carousel, choose-area (feature split), CTA, testimonials, contact, footer
- Usually remove: Blog sections, brand logos carousel, isotope grid (not used)
- Floor plan tabs: only include if client has actual floor plan assets

---

## Partials System

```
real-estate-1/
  _partials/
    header.html    <- Edit this to change nav/header across all pages
    footer.html    <- Edit this to change footer across all pages
  build.js         <- node build.js to assemble pages into dist/
  dist/            <- Output (auto-generated, do not edit manually)
  index.html       <- Source pages use <!-- HEADER --> and <!-- FOOTER --> placeholders
  about.html
  ... (all 8 pages)
```

**Workflow when adapting this template:**
1. Copy the entire `real-estate-1/` folder to the new site location
2. Edit `_partials/header.html` with client logo, real phone/email, correct nav links
3. Edit `_partials/footer.html` with client info, copyright year, social links
4. Edit each source HTML page (replace demo content, remove unused sections)
5. Run `node build.js` to generate `dist/`
6. Deploy `dist/` to Cloudflare Pages
