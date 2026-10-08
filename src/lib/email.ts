import nodemailer from "nodemailer";
import { formatPrice } from "@/lib/utils";

// ============================================================
// EMAIL TRANSPORT CONFIGURATION
// ============================================================

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@shopelite.com";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "ShopElite";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ============================================================
// BASE EMAIL TEMPLATE
// ============================================================

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f8fafc; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 16px; padding: 48px 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo a { font-size: 28px; font-weight: 800; color: #6366f1; text-decoration: none; letter-spacing: -0.5px; }
    .divider { height: 1px; background: #e2e8f0; margin: 32px 0; }
    .btn { display: inline-block; background: #6366f1; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 8px 0; }
    .btn-outline { background: transparent; color: #6366f1; border: 2px solid #6366f1; }
    .text-muted { color: #64748b; font-size: 14px; line-height: 1.6; }
    .text-small { font-size: 12px; color: #94a3b8; }
    h1 { font-size: 26px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    h2 { font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
    p { margin-bottom: 16px; line-height: 1.7; color: #475569; }
    .order-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .order-table th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 13px; color: #64748b; font-weight: 600; }
    .order-table td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .order-table tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .footer { text-align: center; margin-top: 32px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .summary-total { font-weight: 700; font-size: 18px; color: #0f172a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo"><a href="${APP_URL}">${APP_NAME}</a></div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p class="text-small">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      <p class="text-small">123 Commerce Street, New York, NY 10001</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================
// EMAIL SENDING FUNCTION
// ============================================================

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  // Real SMTP credentials = send for real (in development too).
  // Placeholder values copied from .env.example count as "not configured".
  const smtpUser = process.env.SMTP_USER || "";
  const smtpConfigured =
    !!smtpUser &&
    !!process.env.SMTP_PASS &&
    !smtpUser.startsWith("your-") &&
    !process.env.SMTP_PASS.startsWith("your-");

  if (!smtpConfigured) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[EMAIL] NOT SENT (SMTP is not configured) To: ${to} | Subject: ${subject}`
      );
    } else {
      console.log(`[EMAIL] Not sent (SMTP not configured) To: ${to} | Subject: ${subject}`);
      // Print action links (verify email, reset password) so they can be
      // opened straight from the terminal while developing
      const links = new Set(
        [...html.matchAll(/href="(https?:\/\/[^"]*token=[^"]+)"/g)].map((m) => m[1])
      );
      links.forEach((link) => console.log(`[EMAIL] Link: ${link}`));
    }
    return;
  }

  const transport = createTransport();
  await transport.sendMail({
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<void> {
  const html = baseTemplate(`
    <h1>Welcome to ${APP_NAME}! 🎉</h1>
    <p>Hi ${name || "there"},</p>
    <p>Thank you for creating your account with ${APP_NAME}. We're thrilled to have you as part of our community!</p>
    <p>Here's what you can do with your new account:</p>
    <ul style="margin: 16px 0; padding-left: 20px; color: #475569;">
      <li style="margin-bottom: 8px;">Browse thousands of premium products</li>
      <li style="margin-bottom: 8px;">Track your orders in real-time</li>
      <li style="margin-bottom: 8px;">Save your favorite products to your wishlist</li>
      <li style="margin-bottom: 8px;">Manage your addresses and payment methods</li>
    </ul>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/products" class="btn">Start Shopping</a>
    </div>
    <div class="divider"></div>
    <p class="text-muted">If you have any questions, reply to this email or contact our support team. We're always happy to help!</p>
  `);

  await sendEmail({
    to,
    subject: `Welcome to ${APP_NAME}!`,
    html,
  });
}

export async function sendEmailVerification(
  to: string,
  name: string,
  verificationUrl: string
): Promise<void> {
  const html = baseTemplate(`
    <h1>Verify Your Email Address</h1>
    <p>Hi ${name || "there"},</p>
    <p>Please verify your email address by clicking the button below. This link expires in 24 hours.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" class="btn">Verify Email Address</a>
    </div>
    <div class="divider"></div>
    <p class="text-muted">If you can't click the button, copy and paste this link into your browser:</p>
    <p class="text-small" style="word-break: break-all;">${verificationUrl}</p>
    <p class="text-muted">If you didn't create an account, you can safely ignore this email.</p>
  `);

  await sendEmail({
    to,
    subject: `Verify your ${APP_NAME} account`,
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<void> {
  const html = baseTemplate(`
    <h1>Reset Your Password</h1>
    <p>Hi ${name || "there"},</p>
    <p>We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <div class="divider"></div>
    <p class="text-muted">If you can't click the button, copy this link:</p>
    <p class="text-small" style="word-break: break-all;">${resetUrl}</p>
    <p class="text-muted">If you didn't request a password reset, please ignore this email. Your password won't change.</p>
  `);

  await sendEmail({
    to,
    subject: `Reset your ${APP_NAME} password`,
    html,
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  order: {
    orderNumber: string;
    items: Array<{
      name: string;
      quantity: number;
      price: string;
      image?: string;
    }>;
    subtotal: string;
    shipping: string;
    tax: string;
    discount: string;
    total: string;
    shippingAddress: {
      firstName: string;
      lastName: string;
      addressLine1: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  }
): Promise<void> {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">${formatPrice(item.price)}</td>
    </tr>
  `
    )
    .join("");

  const html = baseTemplate(`
    <h1>Commande reçue ! ✅</h1>
    <p>Merci pour votre commande ! Nous l'avons bien reçue et notre équipe va vous appeler prochainement pour la confirmer.</p>
    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; font-weight: 600;">Numéro de commande : <span style="color: #6366f1;">#${order.orderNumber}</span></p>
    </div>
    <h2>Résumé de la commande</h2>
    <table class="order-table">
      <thead>
        <tr>
          <th>Produit</th>
          <th style="text-align: center;">Qté</th>
          <th style="text-align: right;">Prix</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <div style="border-top: 2px solid #e2e8f0; padding-top: 16px;">
      <div class="summary-row"><span>Sous-total</span><span>${formatPrice(order.subtotal)}</span></div>
      <div class="summary-row"><span>Livraison</span><span>${formatPrice(order.shipping)}</span></div>
      ${parseFloat(order.discount) > 0 ? `<div class="summary-row"><span>Réduction</span><span style="color: #16a34a;">-${formatPrice(order.discount)}</span></div>` : ""}
      <div class="summary-row summary-total"><span>Total</span><span>${formatPrice(order.total)}</span></div>
    </div>
    <div class="divider"></div>
    <h2>Adresse de livraison</h2>
    <p style="color: #475569;">
      ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
      ${order.shippingAddress.addressLine1}<br>
      ${order.shippingAddress.city}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}<br>
      ${order.shippingAddress.country}
    </p>
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
      <p style="margin: 0; color: #1d4ed8; font-size: 14px;">📞 Paiement à la livraison — notre équipe vous appellera pour confirmer votre commande avant expédition.</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/account/orders" class="btn">Suivre ma commande</a>
    </div>
  `);

  await sendEmail({
    to,
    subject: `Commande reçue - #${order.orderNumber}`,
    html,
  });
}

export async function sendOrderConfirmedByPhoneEmail(
  to: string,
  order: {
    orderNumber: string;
    total: string;
    shippingMethodName?: string;
    estimatedDelivery?: string;
  }
): Promise<void> {
  const html = baseTemplate(`
    <h1>Commande confirmée par téléphone 📞✅</h1>
    <p>Bonne nouvelle ! Nous avons confirmé votre commande <strong>#${order.orderNumber}</strong> par téléphone. Elle est maintenant en cours de préparation.</p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; font-weight: 600; color: #16a34a;">Montant à payer à la livraison</p>
      <p style="margin: 8px 0 0; font-size: 22px; font-weight: 700; color: #0f172a;">${formatPrice(order.total)}</p>
    </div>
    ${order.shippingMethodName ? `<p>Compagnie de livraison : <strong>${order.shippingMethodName}</strong></p>` : ""}
    ${order.estimatedDelivery ? `<p>Livraison estimée : <strong>${order.estimatedDelivery}</strong></p>` : ""}
    <div class="divider"></div>
    <p class="text-muted">Vous recevrez un nouvel email dès que votre commande sera expédiée. Merci de votre confiance !</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/account/orders" class="btn">Voir ma commande</a>
    </div>
  `);

  await sendEmail({
    to,
    subject: `Commande confirmée - #${order.orderNumber}`,
    html,
  });
}

export async function sendShippingUpdateEmail(
  to: string,
  order: {
    orderNumber: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
    shippingMethodName?: string;
  }
): Promise<void> {
  const html = baseTemplate(`
    <h1>Votre commande est en route ! 🚚</h1>
    <p>Bonne nouvelle ! Votre commande <strong>#${order.orderNumber}</strong> vient d'être expédiée.</p>
    ${
      order.trackingNumber
        ? `
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; font-weight: 600; color: #16a34a;">Numéro de suivi</p>
      <p style="margin: 8px 0 0; font-size: 20px; font-weight: 700; color: #0f172a;">${order.trackingNumber}</p>
    </div>
    `
        : ""
    }
    ${order.shippingMethodName ? `<p>Compagnie de livraison : <strong>${order.shippingMethodName}</strong></p>` : ""}
    ${order.estimatedDelivery ? `<p>Livraison estimée : <strong>${order.estimatedDelivery}</strong></p>` : ""}
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
      <p style="margin: 0; color: #1d4ed8; font-size: 14px;">💵 Préparez le montant exact — le paiement se fait en espèces à la réception.</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      ${order.trackingUrl ? `<a href="${order.trackingUrl}" class="btn">Suivre le colis</a>` : ""}
      <a href="${APP_URL}/account/orders" class="btn btn-outline" style="margin-left: 12px;">Voir ma commande</a>
    </div>
  `);

  await sendEmail({
    to,
    subject: `Votre commande #${order.orderNumber} a été expédiée !`,
    html,
  });
}

export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const html = baseTemplate(`
    <h1>New Contact Message</h1>
    <p><strong>From:</strong> ${data.name} (${data.email})</p>
    <p><strong>Subject:</strong> ${data.subject}</p>
    <div class="divider"></div>
    <p style="white-space: pre-wrap;">${data.message}</p>
  `);

  await sendEmail({
    to: process.env.EMAIL_FROM || "support@shopelite.com",
    subject: `[Contact] ${data.subject}`,
    html,
  });
}

export async function sendNewsletterWelcomeEmail(
  to: string,
  name?: string
): Promise<void> {
  const html = baseTemplate(`
    <h1>You're Subscribed! 🎊</h1>
    <p>Hi ${name || "there"},</p>
    <p>Thank you for subscribing to the ${APP_NAME} newsletter. You'll be the first to know about:</p>
    <ul style="margin: 16px 0; padding-left: 20px; color: #475569;">
      <li style="margin-bottom: 8px;">🔥 Exclusive deals and flash sales</li>
      <li style="margin-bottom: 8px;">🆕 New product launches</li>
      <li style="margin-bottom: 8px;">💡 Tips and product guides</li>
      <li style="margin-bottom: 8px;">🎁 Member-only promotions</li>
    </ul>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/products" class="btn">Shop Now</a>
    </div>
    <div class="divider"></div>
    <p class="text-muted text-small">You can unsubscribe at any time by clicking the unsubscribe link at the bottom of our emails.</p>
  `);

  await sendEmail({
    to,
    subject: `Welcome to ${APP_NAME} Newsletter!`,
    html,
  });
}