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

    const destination = 'brickley@killergrowth.com';
    const subject = `New website inquiry from ${name}`;

    const lines = [
      'New Alex Miller website inquiry',
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
        }
      ]
    });

    return Response.redirect(new URL('/contact.html?success=1', context.request.url).toString(), 302);
  } catch (error) {
    return Response.redirect(new URL('/contact.html?error=1', context.request.url).toString(), 302);
  }
}
