import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { Store } from '../models/store.model';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const formatCurrency = (value: number | undefined) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP not configured. Transactional emails will be logged to console only.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    this.isConfigured = true;

    this.transporter.verify((error) => {
      if (error) {
        console.error('SMTP verification failed:', error.message);
        return;
      }

      console.log('SMTP connection verified for transactional emails.');
    });
  }

  private from(label: string, address?: string) {
    const fromAddress = address || process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const fromName = process.env.MAIL_FROM_NAME || label;
    return `"${fromName}" <${fromAddress}>`;
  }

  private async trackingUrl(orderData: any, email: string) {
    if (process.env.FRONTEND_ORDER_TRACKING_URL) {
      return process.env.FRONTEND_ORDER_TRACKING_URL
        .replace('{orderId}', encodeURIComponent(String(orderData._id)))
        .replace('{email}', encodeURIComponent(email));
    }

    const storefrontUrl = process.env.PUBLIC_STOREFRONT_URL?.replace(/\/$/, '');
    if (!storefrontUrl || !orderData.storeId) return '';

    const store = await Store.findById(orderData.storeId).select('slug').lean();
    if (!store?.slug) return '';

    return `${storefrontUrl}/${store.slug}/order-success?orderId=${encodeURIComponent(String(orderData._id))}&email=${encodeURIComponent(email)}`;
  }

  private async send(mailOptions: nodemailer.SendMailOptions, fallbackLabel: string) {
    if (!this.isConfigured || !this.transporter) {
      console.log(`[Email skipped - SMTP not configured] ${fallbackLabel}`);
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      return;
    }

    await this.transporter.sendMail(mailOptions);
  }

  async sendOtp(email: string, otp: string) {
    await this.send(
      {
        from: this.from('Crabtile Shop Security', process.env.MAIL_FROM_AUTH),
        replyTo: process.env.MAIL_REPLY_TO_SUPPORT,
        to: email,
        subject: 'Your commerce verification code',
        text: `Your verification code is ${otp}. It expires in 10 minutes.`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#111111;">
            <p style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#666666;margin:0 0 18px;">Secure checkout</p>
            <h1 style="font-size:28px;line-height:1.15;margin:0 0 12px;">Verify your email</h1>
            <p style="font-size:16px;line-height:1.6;color:#555555;margin:0 0 24px;">Use this 6-digit code to continue with your order. It expires in 10 minutes.</p>
            <div style="background:#111111;color:#ffffff;border-radius:16px;padding:24px;text-align:center;font-size:36px;font-weight:800;letter-spacing:.35em;">
              ${escapeHtml(otp)}
            </div>
            <p style="font-size:13px;line-height:1.6;color:#777777;margin:24px 0 0;">If you did not request this code, you can safely ignore this email.</p>
          </div>
        `,
      },
      `OTP ${otp}`
    );
  }

  async sendOrderConfirmation(email: string, order: any) {
    const orderData = typeof order?.toObject === 'function' ? order.toObject() : order;
    const items = Array.isArray(orderData.items) ? orderData.items : [];
    const shipping = orderData.shippingAddress || {};
    const orderNumber = orderData.orderNumber || orderData._id;
    const trackingUrl = await this.trackingUrl(orderData, email);

    await this.send(
      {
        from: this.from('Crabtile Shop Orders', process.env.MAIL_FROM_ORDERS),
        replyTo: process.env.MAIL_REPLY_TO_ORDERS || process.env.MAIL_REPLY_TO_SUPPORT,
        to: email,
        subject: `Order confirmation and invoice - #${orderNumber}`,
        text: `Your order #${orderNumber} is confirmed. Total: ${formatCurrency(orderData.total)}.`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;padding:28px;color:#111111;">
            <p style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#666666;margin:0 0 18px;">Order confirmation</p>
            <h1 style="font-size:30px;line-height:1.15;margin:0 0 10px;">Thanks for your purchase.</h1>
            <p style="font-size:16px;line-height:1.6;color:#555555;margin:0 0 26px;">We received your order and your invoice is included below.</p>

            <div style="border:1px solid #e5e5e5;border-radius:18px;padding:22px;margin-bottom:24px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:0 0 10px;color:#666666;">Order number</td>
                  <td style="padding:0 0 10px;text-align:right;font-weight:700;">#${escapeHtml(orderNumber)}</td>
                </tr>
                <tr>
                  <td style="padding:0 0 10px;color:#666666;">Order status</td>
                  <td style="padding:0 0 10px;text-align:right;text-transform:capitalize;">${escapeHtml(orderData.status)}</td>
                </tr>
                <tr>
                  <td style="padding:0;color:#666666;">Payment status</td>
                  <td style="padding:0;text-align:right;text-transform:capitalize;">${escapeHtml(orderData.paymentStatus)}</td>
                </tr>
              </table>
            </div>

            <h2 style="font-size:18px;margin:0 0 12px;">Items</h2>
            <div style="border-top:1px solid #eeeeee;">
              ${items.map((item: any) => `
                <div style="display:flex;gap:14px;border-bottom:1px solid #eeeeee;padding:16px 0;">
                  ${item.image ? `<img src="${escapeHtml(item.image)}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:10px;background:#f5f5f5;" />` : ''}
                  <div style="flex:1;">
                    <div style="font-weight:700;">${escapeHtml(item.name)}</div>
                    <div style="color:#666666;font-size:14px;margin-top:4px;">SKU: ${escapeHtml(item.sku || 'N/A')} · Qty ${escapeHtml(item.quantity)}</div>
                  </div>
                  <div style="font-weight:700;text-align:right;">${formatCurrency(item.total)}</div>
                </div>
              `).join('')}
            </div>

            <div style="margin:24px 0 28px;border:1px solid #e5e5e5;border-radius:18px;padding:20px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:6px 0;color:#666666;">Subtotal</td><td style="padding:6px 0;text-align:right;">${formatCurrency(orderData.subtotal)}</td></tr>
                <tr><td style="padding:6px 0;color:#666666;">Delivery</td><td style="padding:6px 0;text-align:right;">${Number(orderData.shipping || 0) === 0 ? 'Free' : formatCurrency(orderData.shipping)}</td></tr>
                <tr><td style="padding:6px 0;color:#666666;">Tax</td><td style="padding:6px 0;text-align:right;">${formatCurrency(orderData.tax)}</td></tr>
                <tr><td style="padding:14px 0 0;font-size:18px;font-weight:800;border-top:1px solid #eeeeee;">Total</td><td style="padding:14px 0 0;text-align:right;font-size:18px;font-weight:800;border-top:1px solid #eeeeee;">${formatCurrency(orderData.total)}</td></tr>
              </table>
            </div>

            <h2 style="font-size:18px;margin:0 0 8px;">Shipping address</h2>
            <p style="line-height:1.6;color:#555555;margin:0 0 24px;">
              ${escapeHtml(shipping.firstName)} ${escapeHtml(shipping.lastName)}<br />
              ${escapeHtml(shipping.address1)} ${shipping.address2 ? `<br />${escapeHtml(shipping.address2)}` : ''}<br />
              ${escapeHtml(shipping.city)}, ${escapeHtml(shipping.state)} ${escapeHtml(shipping.postalCode)}<br />
              ${escapeHtml(shipping.country || 'India')}
            </p>

            ${trackingUrl ? `<a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-weight:700;">Track your order</a>` : ''}
          </div>
        `,
      },
      `Order confirmation #${orderNumber}`
    );
  }

  async sendOrderStatusUpdate(email: string, order: any, previousStatus?: string) {
    const orderData = typeof order?.toObject === 'function' ? order.toObject() : order;
    const orderNumber = orderData.orderNumber || orderData._id;
    const fulfillment = orderData.fulfillment || {};
    const trackingUrl = fulfillment.trackingUrl || await this.trackingUrl(orderData, email);
    const trackingDetails = [fulfillment.carrier, fulfillment.trackingNumber].filter(Boolean).join(' - ');

    await this.send(
      {
        from: this.from('Crabtile Shop Orders', process.env.MAIL_FROM_ORDERS),
        replyTo: process.env.MAIL_REPLY_TO_ORDERS || process.env.MAIL_REPLY_TO_SUPPORT,
        to: email,
        subject: `Order #${orderNumber} is now ${orderData.status}`,
        text: `Your order #${orderNumber} status changed from ${previousStatus || 'pending'} to ${orderData.status}.${trackingDetails ? ` Tracking: ${trackingDetails}.` : ''}`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#111111;">
            <p style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#666666;margin:0 0 18px;">Order update</p>
            <h1 style="font-size:28px;line-height:1.15;margin:0 0 12px;">Your order status changed.</h1>
            <div style="border:1px solid #e5e5e5;border-radius:18px;padding:22px;margin:24px 0;">
              <p style="margin:0 0 10px;color:#666666;">Order number</p>
              <p style="margin:0 0 18px;font-size:20px;font-weight:800;">#${escapeHtml(orderNumber)}</p>
              <p style="margin:0;color:#666666;">Current status</p>
              <p style="margin:6px 0 0;text-transform:capitalize;font-size:24px;font-weight:800;">${escapeHtml(orderData.status)}</p>
            </div>
            ${trackingDetails ? `<p style="font-size:15px;line-height:1.6;color:#555555;margin:0 0 18px;"><strong>Shipment:</strong> ${escapeHtml(trackingDetails)}</p>` : ''}
            ${trackingUrl ? `<a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-weight:700;">Track your order</a>` : ''}
            <p style="font-size:14px;line-height:1.6;color:#666666;margin:0;">We will keep updating your order as it moves through fulfillment.</p>
          </div>
        `,
      },
      `Order status update #${orderNumber}`
    );
  }
}

export const mailService = new MailService();
