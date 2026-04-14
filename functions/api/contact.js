export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();

    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const propertyType = String(formData.get('property_type') || '').trim();
    const location = String(formData.get('location') || '').trim();
    const message = String(formData.get('message') || '').trim();
    const botField = String(formData.get('website') || '').trim();

    if (botField) {
      return Response.redirect(new URL('/contact.html?success=1', context.request.url).toString(), 302);
    }

    if (!name || !email) {
      return Response.redirect(new URL('/contact.html?error=1', context.request.url).toString(), 302);
    }

    const destination = 'corrie@killergrowth.com';
    const subject = `New Inquiry from ${name} — Alex Miller Auctions`;

    // Plain text fallback
    const lines = [
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
      `Submitted from: ${context.request.headers.get('origin') || new URL(context.request.url).origin}`,
      `IP: ${context.request.headers.get('CF-Connecting-IP') || 'Unavailable'}`,
      `User-Agent: ${context.request.headers.get('User-Agent') || 'Unavailable'}`
    ];

    // Branded HTML email
    const propertyTypeDisplay = propertyType
      ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1).replace(/_/g, ' ')
      : 'Not provided';

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f9f7f4; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f7f4;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr>
          <td style="background-color:#0d1b3e; padding:32px 40px; text-align:center;">
            <h1 style="margin:0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; color:#c9a227; letter-spacing:1px;">Alex Miller Auctions</h1>
            <p style="margin:8px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#f9f7f4; opacity:0.8; letter-spacing:2px; text-transform:uppercase;">New Inquiry</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff; padding:36px 40px;">
            <h2 style="margin:0 0 6px; font-family:Georgia, 'Times New Roman', serif; font-size:20px; color:#0d1b3e;">New inquiry from ${name}</h2>
            <p style="margin:0 0 28px; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#888;">Submitted via alexmillerauctions.com</p>

            <!-- Fields card -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f7f4; border-radius:6px; border:1px solid #e8e4dd; margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding:10px 0; border-bottom:1px solid #e8e4dd; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#666; width:36%; vertical-align:top; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Name</td>
                      <td style="padding:10px 0; border-bottom:1px solid #e8e4dd; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#1a1a1a; vertical-align:top;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0; border-bottom:1px solid #e8e4dd; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#666; width:36%; vertical-align:top; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Email</td>
                      <td style="padding:10px 0; border-bottom:1px solid #e8e4dd; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#1a1a1a; vertical-align:top;"><a href="mailto:${email}" style="color:#0d1b3e;">${email}</a></td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0; border-bottom:1px solid #e8e4dd; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#666; width:36%; vertical-align:top; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Phone</td>
                      <td style="padding:10px 0; border-bottom:1px solid #e8e4dd; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#1a1a1a; vertical-align:top;">${phone || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0; border-bottom:1px solid #e8e4dd; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#666; width:36%; vertical-align:top; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Property Type</td>
                      <td style="padding:10px 0; border-bottom:1px solid #e8e4dd; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#1a1a1a; vertical-align:top;">${propertyTypeDisplay}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#666; width:36%; vertical-align:top; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Location</td>
                      <td style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#1a1a1a; vertical-align:top;">${location || 'Not provided'}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Message block -->
            <h3 style="margin:0 0 12px; font-family:Georgia, 'Times New Roman', serif; font-size:16px; color:#0d1b3e;">Message</h3>
            <div style="background-color:#f9f7f4; border-left:4px solid #c9a227; border-radius:0 4px 4px 0; padding:16px 20px; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#333; line-height:1.6; white-space:pre-wrap;">${message || 'No message provided'}</div>
          </td>
        </tr>

        <!-- Reply CTA -->
        <tr>
          <td style="background-color:#ffffff; padding:0 40px 28px; text-align:center;">
            <a href="mailto:${email}" style="display:inline-block; background-color:#c9a227; color:#0d1b3e; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:700; text-decoration:none; padding:12px 28px; border-radius:4px; letter-spacing:0.5px;">Reply to ${name}</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#0d1b3e; padding:20px 40px; text-align:center;">
            <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#f9f7f4; opacity:0.6;">Alex Miller Auctions &bull; Central Kansas &bull; alexmillerauctions.com</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

    const mailChannels = context.env.MAILCHANNELS;
    if (!mailChannels) {
      return Response.redirect(new URL('/contact.html?error=mail', context.request.url).toString(), 302);
    }

    await mailChannels.send({
      personalizations: [{ to: [{ email: destination }] }],
      from: {
        email: 'notifications@killergrowth.com',
        name: 'Alex Miller Website'
      },
      reply_to: {
        email,
        name
      },
      subject,
      content: [
        {
          type: 'text/plain',
          value: lines.join('\n')
        },
        {
          type: 'text/html',
          value: htmlBody
        }
      ]
    });

    return Response.redirect(new URL('/contact.html?success=1', context.request.url).toString(), 302);
  } catch (error) {
    return Response.redirect(new URL('/contact.html?error=1', context.request.url).toString(), 302);
  }
}
