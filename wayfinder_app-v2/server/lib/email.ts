import { Resend } from 'resend';

async function getUncachableResendClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  
  return {
    client: new Resend(connectionSettings.settings.api_key),
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function sendVerificationEmail(to: string, token: string, baseUrl: string) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;
    
    await client.emails.send({
      from: fromEmail || 'WayfinderOS <noreply@resend.dev>',
      to: [to],
      subject: 'Verify your WayfinderOS account',
      html: `
        <div style="font-family: 'JetBrains Mono', monospace; background: #0a0a0a; color: #fff; padding: 40px; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 50px; height: 50px; background: #c3f53c; border-radius: 8px; line-height: 50px; font-weight: bold; font-size: 24px; color: #000;">W</div>
          </div>
          <h1 style="color: #c3f53c; text-align: center; margin-bottom: 20px;">Verify Your Email</h1>
          <p style="text-align: center; color: #999; margin-bottom: 30px;">
            Click the button below to verify your email address and activate your WayfinderOS account.
          </p>
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${verifyUrl}" style="display: inline-block; background: #c3f53c; color: #000; font-weight: bold; padding: 15px 40px; text-decoration: none; border-radius: 8px;">
              Verify Email
            </a>
          </div>
          <p style="text-align: center; color: #666; font-size: 12px;">
            This link expires in 24 hours. If you didn't create an account, you can ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
          <p style="text-align: center; color: #444; font-size: 11px;">
            &copy; 2026 WayfinderOS. REVERIE | RVR Creative Development
          </p>
        </div>
      `
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}
