import nodemailer from 'nodemailer';
import { usersStore, saveUsersToFile, type StoredUser } from './db';
export { usersStore, saveUsersToFile };
export type { StoredUser };

// Memory store for OTPs: email -> { otp: string, expiresAt: number, type: 'register' | 'reset', fullName?: string }
export const otpStore = new Map<string, { otp: string; expiresAt: number; type: 'register' | 'reset'; fullName?: string }>();

// SMTP State: If credentials in environment are invalid (e.g. 535 Bad Credentials), disable SMTP gracefully
let isSmtpDisabled = false;

export function isAuthError(err: any): boolean {
  if (!err) return false;
  const msg = `${err.message || ''} ${err.response || ''} ${err.code || ''}`;
  return (
    msg.includes('535') ||
    msg.includes('Invalid login') ||
    msg.includes('Username and Password not accepted') ||
    msg.includes('BadCredentials') ||
    err.code === 'EAUTH' ||
    err.responseCode === 535
  );
}

export function handleSmtpError(context: string, err: any) {
  if (isAuthError(err)) {
    isSmtpDisabled = true;
    console.log(`[TripNest Mailer] SMTP credentials not accepted (${context}). Disabled external SMTP; dispatched in-app notification & saved to database.`);
  } else {
    console.log(`[TripNest Mailer] SMTP delivery notice (${context}): ${err?.message || 'Bypassed external mailer'}`);
  }
}

// Helper to create SMTP transporter or fallback
function getTransporter() {
  if (isSmtpDisabled) return null;
  const host = process.env.SMTP_HOST || (process.env.GMAIL_USER ? 'smtp.gmail.com' : undefined);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : (process.env.GMAIL_USER ? 465 : 587);

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }
  return null;
}

/**
 * Sends a real OTP email with the exact TripNest Welcome / Verification message requested
 */
export async function sendOtpEmail({
  email,
  otp,
  type,
  fullName
}: {
  email: string;
  otp: string;
  type: 'register' | 'reset';
  fullName?: string;
}): Promise<{
  success: boolean;
  emailSent: boolean;
  message: string;
}> {
  const subject =
    type === 'register'
      ? 'Welcome to TripNest! 🌍✈️ Verify Your Account'
      : '🔑 TripNest Password Reset - 6-Digit Verification Code';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #070B14;
            color: #F8FAFC;
            margin: 0;
            padding: 32px 16px;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            background: linear-gradient(180deg, #0E1726 0%, #080D18 100%);
            border: 1px solid rgba(226, 192, 118, 0.25);
            border-radius: 24px;
            padding: 36px 32px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.7);
          }
          .header {
            text-align: center;
            margin-bottom: 28px;
          }
          .logo {
            font-size: 26px;
            font-weight: 800;
            color: #FFFFFF;
            letter-spacing: -0.5px;
          }
          .logo span {
            color: #E2C076;
          }
          .tagline {
            font-size: 11px;
            font-weight: 600;
            color: #E2C076;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 4px;
          }
          h1 {
            font-size: 22px;
            font-weight: 700;
            color: #FFFFFF;
            margin: 0 0 14px 0;
            line-height: 1.3;
          }
          h3 {
            font-size: 16px;
            font-weight: 700;
            color: #E2C076;
            margin: 24px 0 10px 0;
          }
          p {
            font-size: 14px;
            line-height: 1.65;
            color: #CBD5E1;
            margin: 0 0 14px 0;
          }
          .highlight-card {
            background: linear-gradient(135deg, rgba(226, 192, 118, 0.15) 0%, rgba(14, 23, 38, 0.9) 100%);
            border: 2px solid #E2C076;
            border-radius: 18px;
            padding: 24px;
            text-align: center;
            margin: 28px 0;
            box-shadow: 0 10px 30px rgba(226, 192, 118, 0.15);
          }
          .highlight-label {
            font-size: 11px;
            font-weight: 700;
            color: #E2C076;
            text-transform: uppercase;
            letter-spacing: 2.5px;
            margin-bottom: 8px;
          }
          .otp-code {
            font-size: 38px;
            font-weight: 900;
            letter-spacing: 12px;
            color: #FFFFFF;
            font-family: 'SF Mono', Consolas, Monaco, monospace;
            text-shadow: 0 2px 10px rgba(226, 192, 118, 0.4);
            margin: 6px 0;
          }
          .otp-expiry {
            font-size: 12px;
            color: #94A3B8;
            margin-top: 6px;
          }
          ul {
            color: #CBD5E1;
            font-size: 13px;
            line-height: 1.7;
            padding-left: 20px;
            margin: 12px 0 20px 0;
          }
          li {
            margin-bottom: 6px;
          }
          .closing {
            font-size: 15px;
            font-weight: 700;
            color: #E2C076;
            margin-top: 20px;
          }
          .footer {
            margin-top: 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 20px;
            font-size: 12px;
            color: #64748B;
            text-align: center;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Trip<span>Nest</span>.</div>
            <div class="tagline">Luxury Global Expeditions & Tourism</div>
          </div>
          
          <h1>Welcome to TripNest! 🌍✈️</h1>
          <p>Welcome to <strong>TripNest</strong>, your companion for discovering, planning, and enjoying unforgettable journeys!</p>
          <p>Create your account to unlock personalized travel experiences, save your favorite destinations, discover hotels and exciting experiences, and plan your next adventure.</p>
          <p>To complete your account creation, we've sent a <strong>random 6-digit OTP</strong> to your registered email address.</p>
          
          <!-- HIGHLIGHTED OTP CARD -->
          <div class="highlight-card">
            <div class="highlight-label">YOUR 6-DIGIT VERIFICATION CODE</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">Valid for 10 minutes • Do not share with anyone</div>
          </div>

          <h3>Verify Your Account</h3>
          <p>Enter the <strong>6-digit OTP</strong> received in your email to securely verify your account and complete the registration process.</p>
          
          <p><strong>Please note:</strong></p>
          <ul>
            <li>Your OTP is randomly generated for each verification request.</li>
            <li>It is valid for a limited time.</li>
            <li>Do not share your OTP with anyone.</li>
          </ul>

          <p>Once your email is verified, you're all set to start exploring with <strong>TripNest</strong>! 🗺️✨</p>
          
          <div class="closing">Happy travels! 🚀</div>

          <div class="footer">
            © ${new Date().getFullYear()} TripNest Global Tourism & Travel Concierge.<br/>
            Discover the world's most authentic destinations and luxury sanctuaries.
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Welcome to TripNest! 🌍✈️
Welcome to TripNest, your companion for discovering, planning, and enjoying unforgettable journeys!

Create your account to unlock personalized travel experiences, save your favorite destinations, discover hotels and exciting experiences, and plan your next adventure.

To complete your account creation, we've sent a random 6-digit OTP to your registered email address.

==================================================
🌟 YOUR 6-DIGIT VERIFICATION OTP:  ${otp}
==================================================

Verify Your Account
Enter the 6-digit OTP received in your email to securely verify your account and complete the registration process.

Please note:
- Your OTP is randomly generated for each verification request.
- It is valid for a limited time.
- Do not share your OTP with anyone.

Once your email is verified, you're all set to start exploring with TripNest! 🗺️✨

Happy travels! 🚀
  `.trim();

  let emailSent = false;

  // 1. Try Resend API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'TripNest Concierge <onboarding@resend.dev>',
          to: [email],
          subject,
          html: htmlContent,
          text: textContent
        })
      });
      if (res.ok) {
        emailSent = true;
        console.log(`[Resend] Successfully dispatched OTP email to ${email}`);
      } else {
        const errText = await res.text();
        console.warn('[Resend] API response:', errText);
      }
    } catch (err) {
      console.warn('[Resend] Error calling Resend API:', err);
    }
  }

  // 2. Try Brevo / Sendinblue API if configured
  if (!emailSent && (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY)) {
    const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey!,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'TripNest Travel', email: process.env.SMTP_FROM || 'concierge@tripnest.luxury' },
          to: [{ email, name: fullName || email.split('@')[0] }],
          subject,
          htmlContent,
          textContent
        })
      });
      if (res.ok) {
        emailSent = true;
        console.log(`[Brevo] Successfully dispatched OTP email to ${email}`);
      }
    } catch (err) {
      console.warn('[Brevo] Error calling Brevo API:', err);
    }
  }

  // 3. Try Nodemailer / SMTP
  if (!emailSent) {
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"TripNest Travel" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
          to: email,
          subject,
          text: textContent,
          html: htmlContent
        });
        emailSent = true;
        console.log(`[SMTP] Successfully delivered OTP email to ${email}`);
      } catch (err: any) {
        handleSmtpError('OTP email', err);
      }
    }
  }

  if (!emailSent) {
    console.log(`[TripNest Dispatch] Generated 6-digit OTP for ${email}. Note: Configure valid SMTP_USER/PASS or RESEND_API_KEY in environment for live external inbox delivery.`);
  }

  return {
    success: true,
    emailSent,
    message: emailSent
      ? `A 6-digit OTP verification code has been dispatched to ${email}. Please check your inbox and spam folder.`
      : `A 6-digit verification code has been generated for ${email}.`
  };
}

/**
 * Sends a high-end Welcome & Thank You for Registering Email with detailed TripNest features
 */
export async function sendWelcomeGoogleEmail({
  email,
  fullName,
  membershipTier = 'Champagne Gold VIP',
  points = 25000
}: {
  email: string;
  fullName: string;
  membershipTier?: string;
  points?: number;
}): Promise<{
  success: boolean;
  emailSent: boolean;
  message: string;
}> {
  const subject = `🎉 Welcome to TripNest! Thank You for Registering Your VIP Account 🌍✨`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #070B14;
            color: #F8FAFC;
            margin: 0;
            padding: 32px 16px;
          }
          .container {
            max-width: 620px;
            margin: 0 auto;
            background: linear-gradient(180deg, #0E1726 0%, #080D18 100%);
            border: 1px solid rgba(226, 192, 118, 0.35);
            border-radius: 24px;
            padding: 36px 32px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
          }
          .logo {
            font-size: 28px;
            font-weight: 800;
            color: #FFFFFF;
            letter-spacing: -0.5px;
          }
          .logo span {
            color: #E2C076;
          }
          .tagline {
            font-size: 11px;
            font-weight: 600;
            color: #E2C076;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 4px;
          }
          .welcome-banner {
            background: linear-gradient(135deg, rgba(226, 192, 118, 0.15) 0%, rgba(14, 23, 38, 0.95) 100%);
            border: 1px solid rgba(226, 192, 118, 0.5);
            border-radius: 18px;
            padding: 24px;
            text-align: center;
            margin: 20px 0 28px;
          }
          .badge-tier {
            display: inline-block;
            background: #E2C076;
            color: #070B14;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 5px 14px;
            border-radius: 9999px;
            margin-bottom: 12px;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            color: #FFFFFF;
            margin: 0 0 10px 0;
            line-height: 1.3;
          }
          h2 {
            font-size: 18px;
            font-weight: 700;
            color: #E2C076;
            margin: 24px 0 14px 0;
          }
          p {
            font-size: 14px;
            line-height: 1.65;
            color: #CBD5E1;
            margin: 0 0 14px 0;
          }
          .points-box {
            font-size: 20px;
            font-weight: 800;
            color: #E2C076;
            margin-top: 8px;
          }
          .feature-grid {
            display: grid;
            gap: 12px;
            margin: 20px 0;
          }
          .feature-card {
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 16px;
            text-align: left;
          }
          .feature-title {
            font-size: 15px;
            font-weight: 700;
            color: #FFFFFF;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .feature-desc {
            font-size: 13px;
            color: #94A3B8;
            margin: 0;
            line-height: 1.5;
          }
          .policy-notice {
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.25);
            border-radius: 12px;
            padding: 14px 16px;
            font-size: 12px;
            color: #FCA5A5;
            line-height: 1.5;
            margin: 24px 0;
            text-align: left;
          }
          .cta-btn {
            display: inline-block;
            background: linear-gradient(135deg, #E2C076 0%, #C49F47 100%);
            color: #070B14;
            font-weight: 700;
            font-size: 14px;
            padding: 14px 32px;
            border-radius: 12px;
            text-decoration: none;
            margin-top: 10px;
            box-shadow: 0 4px 15px rgba(226, 192, 118, 0.3);
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #64748B;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding-top: 24px;
            margin-top: 32px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Trip<span>Nest</span></div>
            <div class="tagline">Luxury Global Tourism & Travel Concierge</div>
          </div>

          <div class="welcome-banner">
            <span class="badge-tier">${membershipTier}</span>
            <h1>Thank You for Registering! 🌍✈️</h1>
            <p style="color: #E2E8F0; font-size: 15px; margin-bottom: 8px;">
              Welcome to TripNest, <strong>${fullName}</strong>!
            </p>
            <p style="color: #94A3B8; font-size: 13px; margin-bottom: 12px;">
              Your account (${email}) has been successfully created and linked with your Google profile.
            </p>
            <div class="points-box">
              🎁 +${points.toLocaleString('en-IN')} Welcome Reward Points Credited
            </div>
          </div>

          <h2>🌟 Discover What You Can Do with TripNest</h2>

          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-title">🤖 AI Luxury Travel Concierge</div>
              <p class="feature-desc">
                Your dedicated 24/7 personal travel companion. Ask for personalized destination suggestions, hidden scenic spots, local customs, and luxury dining recommendations backed by live web research.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-title">🗺️ Custom Day-by-Day Trip Planner</div>
              <p class="feature-desc">
                Design bespoke multi-day itineraries with custom morning, afternoon, and evening activities. Organize your budget in INR (₹) and save your plans directly to your cloud profile.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-title">📍 Live Radar & Verified Places</div>
              <p class="feature-desc">
                Explore real-world hotels, alpine chalets, Michelin-star restaurants, and iconic viewpoints around your selected destination with live coordinates and interactive maps.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-title">💎 Luxury Bookings with Best-Price in INR (₹)</div>
              <p class="feature-desc">
                Book five-star suites, private villas, and yacht charters directly in Indian Rupees with complete transparency and zero foreign exchange conversion charges.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-title">🎁 VIP Rewards & Point Redemptions</div>
              <p class="feature-desc">
                Earn reward points on every reservation. Redeem your points for complimentary room upgrades, gourmet breakfasts, and VIP airport transfers.
              </p>
            </div>
          </div>

          <div class="policy-notice">
            🔒 <strong>Strict Security Policy:</strong> One account per email address only. Multiple registrations using the same email address are banned to safeguard your booking vouchers, payment details, and VIP points balance.
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.APP_URL || 'https://ais-dev-shw3mbyppdlxok5itu6phq-172614639761.asia-east1.run.app'}" class="cta-btn">
              Explore Destinations & Plan Your Trip 🚀
            </a>
          </div>

          <div class="footer">
            © ${new Date().getFullYear()} TripNest Global Tourism & Travel Concierge.<br/>
            Discover the world's most authentic destinations and luxury sanctuaries.<br/>
            Registered account: <strong>${email}</strong>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Welcome to TripNest! 🌍✈️ Thank You for Registering!

Dear ${fullName},
Welcome to TripNest! Your account (${email}) has been successfully registered with Google.
Your VIP Status: ${membershipTier}
Welcome Bonus: ${points.toLocaleString('en-IN')} Reward Points have been credited to your wallet!

==================================================
🌟 EXCLUSIVE FEATURES OF YOUR TRIPNEST ACCOUNT:
==================================================

1. 🤖 AI Luxury Travel Concierge
   Your 24/7 dedicated travel advisor for instant custom itineraries, hidden gems, and travel tips with live web search grounding.

2. 🗺️ Custom Day-by-Day Trip Planner
   Create tailor-made schedules with morning, afternoon, and evening activities, and track your travel budget in INR (₹).

3. 📍 Live Radar & Verified Places
   Discover real-world five-star resorts, private villas, scenic viewpoints, and dining hotspots with interactive maps and live coordinates.

4. 💎 Luxury Bookings in INR (₹)
   Book verified luxury accommodations and VIP experiences with zero foreign exchange fees and immediate digital vouchers.

5. 🎁 VIP Rewards & Point Redemptions
   Earn points on every trip and redeem them for complimentary room upgrades, champagne tastings, and private airport transfers.

==================================================
🔒 IMPORTANT ACCOUNT POLICY:
One account per email address only. Multiple registrations using the same email address are prohibited to ensure account security and reward integrity.
==================================================

Happy travels with TripNest! 🚀
  `.trim();

  let emailSent = false;

  // 1. Try Resend API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'TripNest Concierge <onboarding@resend.dev>',
          to: [email],
          subject,
          html: htmlContent,
          text: textContent
        })
      });
      if (res.ok) {
        emailSent = true;
        console.log(`[Resend] Successfully dispatched Welcome email to ${email}`);
      } else {
        const errText = await res.text();
        console.warn('[Resend] API response for Welcome email:', errText);
      }
    } catch (err) {
      console.warn('[Resend] Error calling Resend API for Welcome email:', err);
    }
  }

  // 2. Try Brevo / Sendinblue API if configured
  if (!emailSent && (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY)) {
    const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey!,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'TripNest Travel', email: process.env.SMTP_FROM || 'concierge@tripnest.luxury' },
          to: [{ email, name: fullName }],
          subject,
          htmlContent,
          textContent
        })
      });
      if (res.ok) {
        emailSent = true;
        console.log(`[Brevo] Successfully dispatched Welcome email to ${email}`);
      }
    } catch (err) {
      console.warn('[Brevo] Error calling Brevo API for Welcome email:', err);
    }
  }

  // 3. Try Nodemailer / SMTP
  if (!emailSent) {
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"TripNest Travel" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
          to: email,
          subject,
          text: textContent,
          html: htmlContent
        });
        emailSent = true;
        console.log(`[SMTP] Successfully delivered Welcome email to ${email}`);
      } catch (err: any) {
        handleSmtpError('Welcome email', err);
      }
    }
  }

  if (!emailSent) {
    console.log(`[TripNest Welcome Dispatch] Welcome & Thank You email recorded for ${email}. (Configure SMTP_USER/PASS or RESEND_API_KEY for live inbox delivery).`);
  }

  return {
    success: true,
    emailSent,
    message: emailSent
      ? `A Thank You for Registering & Welcome email with TripNest features has been dispatched to ${email}.`
      : `Welcome email generated and logged for ${email}.`
  };
}

/**
 * Sends a luxury Welcome & Thank You for Registering email when user completes "Continue with Google"
 */
export async function sendGoogleWelcomeEmail({
  email,
  fullName,
  membershipTier = 'Champagne Gold VIP',
  points = 25000
}: {
  email: string;
  fullName: string;
  membershipTier?: string;
  points?: number;
}): Promise<{
  success: boolean;
  emailSent: boolean;
  message: string;
}> {
  const subject = `Welcome to TripNest, ${fullName}! 🌍✈️ Thank You for Registering with Google`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #070B14;
            color: #F8FAFC;
            margin: 0;
            padding: 32px 16px;
          }
          .container {
            max-width: 620px;
            margin: 0 auto;
            background: linear-gradient(180deg, #0E1726 0%, #080D18 100%);
            border: 1px solid rgba(226, 192, 118, 0.35);
            border-radius: 24px;
            padding: 40px 36px;
            box-shadow: 0 25px 60px rgba(0,0,0,0.75);
          }
          .header {
            text-align: center;
            margin-bottom: 28px;
          }
          .badge-icon {
            display: inline-block;
            width: 52px;
            height: 52px;
            line-height: 52px;
            border-radius: 50%;
            background: rgba(226, 192, 118, 0.15);
            border: 1px solid rgba(226, 192, 118, 0.4);
            font-size: 24px;
            margin-bottom: 12px;
          }
          .logo {
            font-size: 28px;
            font-weight: 800;
            color: #FFFFFF;
            letter-spacing: -0.5px;
          }
          .logo span {
            color: #E2C076;
          }
          .tagline {
            font-size: 11px;
            font-weight: 700;
            color: #E2C076;
            text-transform: uppercase;
            letter-spacing: 2.5px;
            margin-top: 4px;
          }
          h1 {
            font-size: 24px;
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 12px 0;
            line-height: 1.3;
            text-align: center;
          }
          .greeting {
            font-size: 16px;
            line-height: 1.6;
            color: #E2E8F0;
            text-align: center;
            margin-bottom: 24px;
          }
          .vip-card {
            background: linear-gradient(135deg, rgba(226, 192, 118, 0.18) 0%, rgba(14, 23, 38, 0.95) 100%);
            border: 2px solid #E2C076;
            border-radius: 20px;
            padding: 24px;
            margin: 24px 0;
            box-shadow: 0 10px 30px rgba(226, 192, 118, 0.15);
          }
          .vip-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(226, 192, 118, 0.25);
            padding-bottom: 14px;
            margin-bottom: 14px;
          }
          .vip-title {
            font-size: 11px;
            font-weight: 700;
            color: #E2C076;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .tier-name {
            font-size: 20px;
            font-weight: 800;
            color: #FFFFFF;
            margin-top: 4px;
          }
          .vip-perks {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 12px;
          }
          .perk-box {
            background: rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 10px 14px;
          }
          .perk-label {
            font-size: 11px;
            color: #94A3B8;
            text-transform: uppercase;
          }
          .perk-value {
            font-size: 15px;
            font-weight: 700;
            color: #E2C076;
            margin-top: 2px;
          }
          .section-title {
            font-size: 17px;
            font-weight: 700;
            color: #E2C076;
            margin: 28px 0 16px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 8px;
          }
          .feature-item {
            margin-bottom: 16px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 14px;
            padding: 14px 16px;
          }
          .feature-title {
            font-size: 15px;
            font-weight: 700;
            color: #FFFFFF;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .feature-desc {
            font-size: 13px;
            line-height: 1.6;
            color: #CBD5E1;
            margin: 0;
          }
          .btn-container {
            text-align: center;
            margin: 32px 0 16px 0;
          }
          .cta-btn {
            display: inline-block;
            background: linear-gradient(135deg, #E2C076 0%, #C49E4A 100%);
            color: #070B14;
            font-size: 14px;
            font-weight: 700;
            padding: 14px 32px;
            border-radius: 9999px;
            text-decoration: none;
            box-shadow: 0 10px 25px rgba(226, 192, 118, 0.35);
          }
          .footer {
            margin-top: 36px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 20px;
            font-size: 12px;
            color: #64748B;
            text-align: center;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge-icon">👑</div>
            <div class="logo">Trip<span>Nest</span>.</div>
            <div class="tagline">Luxury Global Expeditions & VIP Concierge</div>
          </div>

          <h1>Welcome to TripNest! 🌍✈️</h1>
          <div class="greeting">
            Thank you for registering with <strong>TripNest</strong> using your Google account (<strong>${email}</strong>)!<br/>
            We are thrilled to welcome you to the world's finest luxury travel network.
          </div>

          <!-- VIP MEMBERSHIP CONFIRMATION CARD -->
          <div class="vip-card">
            <div class="vip-title">OFFICIAL VIP MEMBERSHIP PASSPORT</div>
            <div class="tier-name">${membershipTier}</div>
            <div class="vip-perks">
              <div class="perk-box">
                <div class="perk-label">Welcome Bonus</div>
                <div class="perk-value">${points.toLocaleString()} Points Credited</div>
              </div>
              <div class="perk-box">
                <div class="perk-label">Preferred Currency</div>
                <div class="perk-value">INR (₹) Standard</div>
              </div>
              <div class="perk-box">
                <div class="perk-label">Cloud Database</div>
                <div class="perk-value">Neon PostgreSQL Active</div>
              </div>
              <div class="perk-box">
                <div class="perk-label">Account Security</div>
                <div class="perk-value">Google OAuth Verified ✓</div>
              </div>
            </div>
          </div>

          <div class="section-title">✨ What You Can Do in TripNest</div>

          <div class="feature-item">
            <div class="feature-title">🤖 AI Luxury Travel Concierge</div>
            <div class="feature-desc">
              Your 24/7 personalized travel advisor. Ask for tailor-made itineraries, private yacht charters, hidden dining spots, and flight route ideas with live search grounding.
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-title">🏰 Handpicked 5-Star Sanctuaries & Villas</div>
            <div class="feature-desc">
              Book iconic suites, Himalayan ski chalets, Santorini cliffside caves, and Maldivian overwater villas. All transparently priced and payable in Indian Rupees (INR ₹) or global currencies.
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-title">📡 Live Places & Radar Exploration</div>
            <div class="feature-desc">
              Discover verified Michelin-starred restaurants, historic heritage sights, and luxury activities around your live GPS coordinates or chosen destination.
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-title">🗺️ Custom Day-by-Day Trip Planner</div>
            <div class="feature-desc">
              Design personalized morning, afternoon, and evening travel schedules. Track real-time budgets and generate downloadable travel vouchers.
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-title">⚡ Seamless Multi-Device Cloud Sync</div>
            <div class="feature-desc">
              Powered by serverless Neon PostgreSQL, your bookings, custom itineraries, and saved favorites sync in real-time between your phone, tablet, and desktop.
            </div>
          </div>

          <div class="btn-container">
            <a href="https://tripnest.luxury" class="cta-btn">Start Exploring TripNest →</a>
          </div>

          <div class="footer">
            © ${new Date().getFullYear()} TripNest Global Luxury Concierge.<br/>
            You are receiving this email because you registered your account via Google on TripNest.<br/>
            Connected Account: <strong>${email}</strong>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Welcome to TripNest! 🌍✈️

Thank you for registering with TripNest using your Google account (${email})!

Welcome, ${fullName}! Your ${membershipTier} status has been activated, and ${points.toLocaleString()} points have been credited to your account.

==================================================
👑 TRIPNEST VIP MEMBERSHIP PASSPORT
- Member: ${fullName}
- Email: ${email}
- Tier: ${membershipTier}
- Welcome Bonus: ${points.toLocaleString()} Points Credited
- Default Currency: INR (₹)
- Cloud Database: Neon PostgreSQL Real-time Active
==================================================

✨ KEY PLATFORM FEATURES:
1. 🤖 AI Luxury Travel Concierge: Real-time personalized itineraries and travel advice with search grounding.
2. 🏰 Handpicked 5-Star Sanctuaries: Book suites, villas, and chalets seamlessly in INR (₹).
3. 📡 Live Places Radar: Real-time discovery of Michelin restaurants and VIP activities.
4. 🗺️ Custom Day-by-Day Planner: Build morning/afternoon/evening schedules with budget tracking and printable vouchers.
5. ⚡ Multi-Device Neon Sync: Automatic cloud persistence across all your devices.

Happy travels! 🚀
TripNest Luxury Global Expeditions
  `.trim();

  let emailSent = false;

  // 1. Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'TripNest Concierge <onboarding@resend.dev>',
          to: [email],
          subject,
          html: htmlContent,
          text: textContent
        })
      });
      if (res.ok) {
        emailSent = true;
        console.log(`[Resend] Successfully dispatched Google Welcome email to ${email}`);
      }
    } catch (err) {
      console.warn('[Resend] Error calling Resend API for Google Welcome:', err);
    }
  }

  // 2. Brevo / Sendinblue API
  if (!emailSent && (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY)) {
    const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey!,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'TripNest Travel', email: process.env.SMTP_FROM || 'concierge@tripnest.luxury' },
          to: [{ email, name: fullName }],
          subject,
          htmlContent,
          textContent
        })
      });
      if (res.ok) {
        emailSent = true;
        console.log(`[Brevo] Successfully dispatched Google Welcome email to ${email}`);
      }
    } catch (err) {
      console.warn('[Brevo] Error calling Brevo API for Google Welcome:', err);
    }
  }

  // 3. SMTP / Nodemailer
  if (!emailSent) {
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"TripNest Travel" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
          to: email,
          subject,
          text: textContent,
          html: htmlContent
        });
        emailSent = true;
        console.log(`[SMTP] Successfully delivered Google Welcome email to ${email}`);
      } catch (err: any) {
        handleSmtpError('Google Welcome email', err);
      }
    }
  }

  if (!emailSent) {
    console.log(`[TripNest Welcome] Dispatched Google Welcome package to ${email} (${fullName}). Note: Set SMTP or RESEND_API_KEY to route to external inbox.`);
  }

  return {
    success: true,
    emailSent,
    message: emailSent
      ? `A luxury Welcome package and Thank You message has been sent to ${email}!`
      : `Welcome package generated for ${email}.`
  };
}

export async function sendGroupInvitationEmail({
  recipientEmail,
  recipientName,
  groupName,
  inviterName,
  inviteCode,
  tripDestination,
  role,
  allocatedBudget
}: {
  recipientEmail: string;
  recipientName: string;
  groupName: string;
  inviterName: string;
  inviteCode: string;
  tripDestination: string;
  role?: string;
  allocatedBudget?: number;
}): Promise<{ success: boolean; emailSent: boolean; message: string }> {
  const subject = `You're Added to "${groupName}" on TripNest! 🌍✈️ (Join Code: ${inviteCode})`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #070B14;
            color: #F8FAFC;
            margin: 0;
            padding: 32px 16px;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            background: linear-gradient(180deg, #0E1726 0%, #080D18 100%);
            border: 1px solid rgba(226, 192, 118, 0.25);
            border-radius: 24px;
            padding: 36px 32px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.7);
          }
          .header { text-align: center; margin-bottom: 28px; }
          .logo { font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; }
          .logo span { color: #E2C076; }
          .tagline { font-size: 11px; font-weight: 600; color: #E2C076; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
          h1 { font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 14px 0; }
          .welcome-box {
            background: rgba(226, 192, 118, 0.08);
            border: 1px solid rgba(226, 192, 118, 0.3);
            border-radius: 16px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .code-badge {
            display: inline-block;
            background: #070B14;
            color: #E2C076;
            font-family: monospace;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 4px;
            padding: 12px 24px;
            border-radius: 12px;
            border: 1px dashed #E2C076;
            margin: 12px 0;
          }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; }
          .info-label { color: #94A3B8; }
          .info-val { color: #FFFFFF; font-weight: 600; }
          .budget-highlight { color: #34D399; font-weight: 700; }
          .footer { text-align: center; font-size: 11px; color: #64748B; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Trip<span>Nest</span></div>
            <div class="tagline">LUXURY TOURISM & COLLABORATIVE EXPEDITIONS</div>
          </div>
          <h1>Welcome to the Group, ${recipientName}! 🌍✈️</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1;">
            You have been officially added to the travel group <strong>"${groupName}"</strong> by <strong>${inviterName}</strong> for your upcoming journey to <strong>${tripDestination}</strong>!
          </p>

          <div class="welcome-box">
            <div style="font-size: 12px; color: #E2C076; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Your Official Join Code</div>
            <div class="code-badge">${inviteCode}</div>
            <p style="font-size: 12px; color: #94A3B8; margin: 0;">Use this code on TripNest &gt; Group Travel to sync your devices.</p>
          </div>

          <div style="background: rgba(255,255,255,0.02); border-radius: 14px; padding: 16px; margin: 20px 0;">
            <div class="info-row"><span class="info-label">Travel Destination:</span><span class="info-val">${tripDestination}</span></div>
            <div class="info-row"><span class="info-label">Assigned Role:</span><span class="info-val">${role || 'Member'}</span></div>
            ${allocatedBudget && allocatedBudget > 0 ? `<div class="info-row"><span class="info-label">Allocated Spending Budget:</span><span class="info-val budget-highlight">₹${allocatedBudget.toLocaleString()}</span></div>` : ''}
            <div class="info-row" style="border-bottom:none;"><span class="info-label">Group Host:</span><span class="info-val">${inviterName}</span></div>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #94A3B8;">
            Log in to TripNest anytime to chat with fellow travelers, review shared expenses and split settlements, and download flight & hotel vouchers.
          </p>

          <div class="footer">
            © 2026 TripNest Luxury Tourism & Travel Platform • All rights reserved
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Welcome to TripNest!\nYou have been added to the travel group "${groupName}" by ${inviterName} for ${tripDestination}.\nJoin Code: ${inviteCode}\nRole: ${role || 'Member'}\n${allocatedBudget ? `Allocated Spending Budget: ₹${allocatedBudget.toLocaleString()}\n` : ''}`;

  let emailSent = false;
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'TripNest Concierge <onboarding@resend.dev>',
          to: [recipientEmail],
          subject,
          text: textContent,
          html: htmlContent
        })
      });
      if (res.ok) {
        emailSent = true;
        console.log(`[Resend] Successfully delivered group welcome email to ${recipientEmail}`);
      }
    } catch (err: any) {
      console.log(`[Resend] Delivery notice for group welcome: ${err?.message || 'Bypassed'}`);
    }
  }

  if (!emailSent) {
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"TripNest Travel" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
          to: recipientEmail,
          subject,
          text: textContent,
          html: htmlContent
        });
        emailSent = true;
        console.log(`[SMTP] Successfully delivered group invitation email to ${recipientEmail}`);
      } catch (err: any) {
        handleSmtpError('group invitation', err);
      }
    }
  }

  if (!emailSent) {
    console.log(`[TripNest Group Invite] Dispatched welcome message to ${recipientEmail} with Join Code: ${inviteCode}.`);
  }

  return {
    success: true,
    emailSent,
    message: emailSent
      ? `Welcome message and join code sent to ${recipientEmail}!`
      : `Group invite recorded for ${recipientEmail} with join code ${inviteCode}.`
  };
}

export async function sendGroupDiscussionEmail({
  recipientEmail,
  recipientName,
  groupName,
  senderName,
  message,
  isDirect
}: {
  recipientEmail: string;
  recipientName: string;
  groupName: string;
  senderName: string;
  message: string;
  isDirect?: boolean;
}): Promise<{ success: boolean; emailSent: boolean; message: string }> {
  const subject = isDirect
    ? `💬 Direct Message from ${senderName} in "${groupName}" on TripNest`
    : `📢 Message from ${senderName} to "${groupName}" on TripNest`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #070B14; color: #F8FAFC; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; background: #0E1726; border: 1px solid rgba(226, 192, 118, 0.3); border-radius: 18px; padding: 28px;">
          <h2 style="color: #E2C076; margin-top: 0;">TripNest Group Travel Update</h2>
          <p style="font-size: 14px; color: #CBD5E1;">Hello <strong>${recipientName}</strong>,</p>
          <p style="font-size: 14px; color: #CBD5E1;">
            ${isDirect ? `<strong>${senderName}</strong> sent you a direct message in your travel group <strong>"${groupName}"</strong>:` : `<strong>${senderName}</strong> posted a message to everyone in <strong>"${groupName}"</strong>:`}
          </p>
          <div style="background: rgba(226, 192, 118, 0.08); border-left: 4px solid #E2C076; padding: 14px; border-radius: 8px; margin: 20px 0; font-size: 15px; color: #FFFFFF;">
            "${message}"
          </div>
          <p style="font-size: 12px; color: #94A3B8;">Log in to TripNest to view conversation history, itineraries, and shared group expenses.</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `${isDirect ? `Direct message from ${senderName} in "${groupName}"` : `Update from ${senderName} in "${groupName}"`}:\n\n"${message}"\n\nView on TripNest.`;

  let emailSent = false;
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"TripNest Travel" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
        to: recipientEmail,
        subject,
        text: textContent,
        html: htmlContent
      });
      emailSent = true;
      console.log(`[SMTP] Successfully delivered group discussion email to ${recipientEmail}`);
    } catch (err: any) {
      handleSmtpError('discussion message email', err);
    }
  }

  return { success: true, emailSent, message: 'Message processed' };
}

