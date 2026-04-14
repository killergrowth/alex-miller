/**
 * Alex Miller Auctions — Contact Form Handler
 * Cloudflare Pages Function
 *
 * Sends branded HTML email via Gmail API using Google Service Account JWT auth.
 * Matches the KillerGrowth standard pattern (same as Goff Heating, etc.)
 *
 * Environment variables (set in Cloudflare Pages dashboard → Settings → Environment Variables):
 *   GOOGLE_CLIENT_EMAIL  — openclaw-agent@killergrowth.iam.gserviceaccount.com
 *   GOOGLE_PRIVATE_KEY   — the PEM private key (-----BEGIN PRIVATE KEY-----\n...)
 *   FROM_EMAIL           — notifications@killergrowth.com
 *   TO_EMAIL             — corrie@killergrowth.com
 */

// ── Brand Colors ─────────────────────────────────────────────────────────────
const NAVY  = '#0d1b3e';
const GOLD  = '#c9a227';
const LIGHT = '#f9f7f4';

// ── Gmail JWT Auth ────────────────────────────────────────────────────────────

function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getGmailAccessToken(clientEmail, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   clientEmail,
    sub:   clientEmail,
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

async function sendGmail(accessToken, from, to, subject, htmlBody, plainText, replyTo) {
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

  const res  = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
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

// ── Email Template ────────────────────────────────────────────────────────────

function buildHtmlEmail({ name, email, phone, propertyType, location, message }) {
  const propDisplay = propertyType
    ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1).replace(/_/g, ' ')
    : 'Not provided';

  const timestamp = new Date().toLocaleString('en-US', {
    timeZone:  'America/Chicago',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:${LIGHT};font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT};padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">

      <!-- Header -->
      <tr>
        <td style="background:${NAVY};padding:32px 40px;text-align:center;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:${GOLD};letter-spacing:1px;">Alex Miller Auctions</h1>
          <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${LIGHT};opacity:0.8;letter-spacing:2px;text-transform:uppercase;">New Website Inquiry</p>
        </td>
      </tr>

      <!-- Alert row -->
      <tr>
        <td style="background:#fff8ee;border-left:4px solid ${GOLD};padding:16px 40px;">
          <p style="margin:0;font-size:17px;font-weight:700;color:${NAVY};">New inquiry from ${name}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#888;">${timestamp} (Central)</p>
        </td>
      </tr>

      <!-- Fields -->
      <tr>
        <td style="background:#ffffff;padding:28px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT};border-radius:6px;border:1px solid #e8e4dd;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:12px;color:#666;width:36%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">Name</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:14px;color:#1a1a1a;vertical-align:top;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:12px;color:#666;width:36%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">Email</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:14px;color:#1a1a1a;vertical-align:top;"><a href="mailto:${email}" style="color:${NAVY};">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:12px;color:#666;width:36%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">Phone</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:14px;color:#1a1a1a;vertical-align:top;">${phone || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:12px;color:#666;width:36%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">Property Type</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dd;font-size:14px;color:#1a1a1a;vertical-align:top;">${propDisplay}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-size:12px;color:#666;width:36%;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">Location</td>
                  <td style="padding:10px 0;font-size:14px;color:#1a1a1a;vertical-align:top;">${location || 'Not provided'}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- Message -->
          <p style="margin:24px 0 10px;font-family:Georgia,serif;font-size:15px;color:${NAVY};font-weight:700;">Message</p>
          <div style="background:${LIGHT};border-left:4px solid ${GOLD};border-radius:0 4px 4px 0;padding:16px 20px;font-size:14px;color:#333;line-height:1.6;white-space:pre-wrap;">${message || 'No message provided'}</div>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="background:#ffffff;padding:0 40px 28px;text-align:center;">
          <a href="mailto:${email}" style="display:inline-block;background:${GOLD};color:${NAVY};font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:4px;letter-spacing:0.5px;">Reply to ${name}</a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:${NAVY};padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:${LIGHT};opacity:0.6;">Alex Miller Auctions &bull; Central Kansas &bull; alexmillerauctions.com</p>
          <p style="margin:4px 0 0;font-size:11px;color:${LIGHT};opacity:0.4;">Managed by KillerGrowth</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  try {
    const formData     = await context.request.formData();
    const name         = String(formData.get('name')          || '').trim();
    const email        = String(formData.get('email')         || '').trim();
    const phone        = String(formData.get('phone')         || '').trim();
    const propertyType = String(formData.get('property_type') || '').trim();
    const location     = String(formData.get('location')      || '').trim();
    const message      = String(formData.get('message')       || '').trim();
    const botField     = String(formData.get('website')       || '').trim();

    // Honeypot
    if (botField) {
      return Response.redirect(new URL('/contact.html?success=1', context.request.url).toString(), 302);
    }

    // Basic validation
    if (!name || !email) {
      return Response.redirect(new URL('/contact.html?error=1', context.request.url).toString(), 302);
    }

    const to      = context.env.TO_EMAIL      || 'corrie@killergrowth.com';
    const from    = `Alex Miller Auctions <${context.env.FROM_EMAIL || 'notifications@killergrowth.com'}>`;
    const subject = `New Inquiry from ${name} — Alex Miller Auctions`;

    const plainText = [
      'New Alex Miller Auctions Inquiry',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || 'Not provided'}`,
      `Property Type: ${propertyType || 'Not provided'}`,
      `Property Location: ${location || 'Not provided'}`,
      '',
      'Message:',
      message || 'No message provided',
      '',
      `Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}`,
      `IP: ${context.request.headers.get('CF-Connecting-IP') || 'Unavailable'}`,
    ].join('\n');

    const htmlBody = buildHtmlEmail({ name, email, phone, propertyType, location, message });

    // Get Gmail token and send
    const accessToken = await getGmailAccessToken(
      context.env.GOOGLE_CLIENT_EMAIL,
      context.env.GOOGLE_PRIVATE_KEY
    );

    await sendGmail(accessToken, from, to, subject, htmlBody, plainText, email);

    return Response.redirect(new URL('/contact.html?success=1', context.request.url).toString(), 302);
  } catch (error) {
    console.error('Contact form error:', error.message);
    return Response.redirect(new URL('/contact.html?error=1', context.request.url).toString(), 302);
  }
}
