// KillerGrowth — Alex Miller Pages Worker
// Handles:
//   /robots.txt     → block pages.dev crawlers, pass-through for live domain
//   /listings       → serve listings page with live data injected from KV
//   /listings.html  → same
//   /api/contact    → contact form handler (Gmail API via Google Service Account)
//   everything else → serve static assets

const KV_KEY     = 'listings-content';
const KV_UPDATED = 'listings-updated';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── robots.txt ───────────────────────────────────────────────
    if (url.pathname === '/robots.txt') {
      if (url.hostname.endsWith('.pages.dev')) {
        return new Response('User-agent: *\nDisallow: /\n', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
      return env.ASSETS.fetch(request);
    }

    // ── Contact form ─────────────────────────────────────────────
    if (url.pathname === '/api/contact' && request.method === 'POST') {
      return handleContact(request, env);
    }

    // ── Listings page ────────────────────────────────────────────
    const path = url.pathname.replace(/\/$/, '');
    if (path === '/listings' || path === '/listings.html') {
      return serveListings(request, env, url);
    }

    // ── Redirects ─────────────────────────────────────────────────
    const cleanPath = url.pathname.replace(/\/+$/, '');
    const REDIRECTS = {
      '/upcoming-auctions':      '/auctions/',
      '/upcoming-auctions.html': '/auctions/',
    };
    const dest = REDIRECTS[cleanPath] || REDIRECTS[url.pathname];
    if (dest) {
      return Response.redirect(url.origin + dest, 301);
    }

    // ── Everything else ──────────────────────────────────────────
    return env.ASSETS.fetch(request);
  }
};

// ── Gmail JWT Auth ──────────────────────────────────────────────────────────

function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getGmailAccessToken(clientEmail, privateKeyPem, subject) {
  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   clientEmail,
    sub:   subject,
    scope: 'https://www.googleapis.com/auth/gmail.send',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  };

  const enc        = new TextEncoder();
  const headerB64  = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const sigInput   = `${headerB64}.${payloadB64}`;

  const pemBody   = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const keyBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, enc.encode(sigInput));
  const jwt       = `${sigInput}.${base64url(signature)}`;

  const tokenRes  = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

async function sendGmail(accessToken, from, to, subject, htmlBody, replyTo) {
  const rawEmail = [
    `From: ${from}`,
    `To: ${to}`,
    `Reply-To: ${replyTo || to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    htmlBody,
  ].join('\r\n');

  const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Gmail send error: ${JSON.stringify(data)}`);
  return data;
}

function buildContactEmail({ name, email, phone, propertyType, location, message }) {
  const NAVY  = '#0d1b3e';
  const GOLD  = '#c9a227';
  const LIGHT = '#f9f7f4';

  const propDisplay = propertyType
    ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1).replace(/_/g, ' ')
    : 'Not provided';

  const timestamp = new Date().toLocaleString('en-US', {
    timeZone:  'America/Chicago',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:${LIGHT};font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT};padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">
      <tr><td style="background:${NAVY};padding:32px 40px;text-align:center;">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;color:${GOLD};">Alex Miller Auctions</h1>
        <p style="margin:8px 0 0;font-size:12px;color:${LIGHT};opacity:0.8;letter-spacing:2px;text-transform:uppercase;">New Website Inquiry</p>
      </td></tr>
      <tr><td style="background:#fff8ee;border-left:4px solid ${GOLD};padding:16px 40px;">
        <p style="margin:0;font-size:17px;font-weight:700;color:${NAVY};">New inquiry from ${name}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#888;">${timestamp} (Central)</p>
      </td></tr>
      <tr><td style="background:#ffffff;padding:28px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT};border-radius:6px;border:1px solid #e8e4dd;">
          <tr><td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:12px;color:#666;width:36%;font-weight:700;text-transform:uppercase;">Name</td><td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:14px;color:#1a1a1a;">${name}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:12px;color:#666;font-weight:700;text-transform:uppercase;">Email</td><td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:14px;"><a href="mailto:${email}" style="color:${NAVY};">${email}</a></td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:12px;color:#666;font-weight:700;text-transform:uppercase;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:14px;color:#1a1a1a;">${phone || 'Not provided'}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:12px;color:#666;font-weight:700;text-transform:uppercase;">Property Type</td><td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:14px;color:#1a1a1a;">${propDisplay}</td></tr>
              <tr><td style="padding:10px 0;font-size:12px;color:#666;font-weight:700;text-transform:uppercase;">Location</td><td style="padding:10px 0;font-size:14px;color:#1a1a1a;">${location || 'Not provided'}</td></tr>
            </table>
          </td></tr>
        </table>
        <p style="margin:24px 0 10px;font-family:Georgia,serif;font-size:15px;color:${NAVY};font-weight:700;">Message</p>
        <div style="background:${LIGHT};border-left:4px solid ${GOLD};border-radius:0 4px 4px 0;padding:16px 20px;font-size:14px;color:#333;line-height:1.6;white-space:pre-wrap;">${message || 'No message provided'}</div>
      </td></tr>
      <tr><td style="background:#ffffff;padding:0 40px 28px;text-align:center;">
        <a href="mailto:${email}" style="display:inline-block;background:${GOLD};color:${NAVY};font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:4px;">Reply to ${name}</a>
      </td></tr>
      <tr><td style="background:${NAVY};padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:${LIGHT};opacity:0.6;">Alex Miller Auctions &bull; Central Kansas &bull; alexmillerauctions.com</p>
        <p style="margin:4px 0 0;font-size:11px;color:${LIGHT};opacity:0.4;">Managed by KillerGrowth</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}

async function handleContact(request, env) {
  try {
    const formData     = await request.formData();
    const name         = String(formData.get('name')          || '').trim();
    const email        = String(formData.get('email')         || '').trim();
    const phone        = String(formData.get('phone')         || '').trim();
    const propertyType = String(formData.get('property_type') || '').trim();
    const location     = String(formData.get('location')      || '').trim();
    const message      = String(formData.get('message')       || '').trim();
    const botField     = String(formData.get('website')       || '').trim();

    const baseUrl = new URL(request.url).origin;

    if (botField) {
      return Response.redirect(`${baseUrl}/contact.html?success=1`, 302);
    }
    if (!name || !email) {
      return Response.redirect(`${baseUrl}/contact.html?error=1`, 302);
    }

    const fromEmail = env.FROM_EMAIL || 'notifications@killergrowth.com';
    const to        = env.TO_EMAIL   || 'corrie@killergrowth.com';
    const from      = `Alex Miller Auctions <${fromEmail}>`;
    const subject   = `New Inquiry from ${name} - Alex Miller Auctions`;
    const htmlBody  = buildContactEmail({ name, email, phone, propertyType, location, message });

    const accessToken = await getGmailAccessToken(
      env.GOOGLE_CLIENT_EMAIL,
      env.GOOGLE_PRIVATE_KEY,
      fromEmail
    );
    await sendGmail(accessToken, from, to, subject, htmlBody, email);

    return Response.redirect(`${baseUrl}/contact.html?success=1`, 302);
  } catch (err) {
    console.error('Contact form error:', err.message);
    const baseUrl = new URL(request.url).origin;
    return Response.redirect(`${baseUrl}/contact.html?error=1`, 302);
  }
}

// ── Listings ──────────────────────────────────────────────────────────────────

async function serveListings(request, env, url) {
  // Fetch the static template from Pages assets
  const templateUrl = new URL('/listings.html', url.origin);
  const templateReq = new Request(templateUrl.toString());
  const templateRes = await env.ASSETS.fetch(templateReq);
  let html = await templateRes.text();

  // Try KV for live listings content
  let listingsHtml = null;
  try {
    if (env.LISTINGS_KV) {
      listingsHtml = await env.LISTINGS_KV.get(KV_KEY);
    }
  } catch (e) {
    console.error('KV read error:', e.message);
  }

  if (listingsHtml) {
    // Inject live listings, replacing the placeholder block
    html = html.replace(
      /<!-- BEGIN:LISTINGS_CONTENT[\s\S]*?<!-- END:LISTINGS_CONTENT -->/,
      listingsHtml
    );
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, stale-while-revalidate=86400'
    }
  });
}
