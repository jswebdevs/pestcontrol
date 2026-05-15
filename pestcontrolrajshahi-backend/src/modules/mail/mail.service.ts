import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export type MailTemplate =
  | 'account-created-from-order'
  | 'order-received'
  | 'order-status-changed'
  | 'new-order-notification'
  | 'contact-form-submission'
  | 'admin-invite'
  | 'password-reset-link'
  | 'email-verification';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private appName: string;
  private siteUrl: string;
  private adminEmail: string;

  constructor(private config: ConfigService) {
    this.appName = config.get<string>('appName') || 'App';
    this.siteUrl = config.get<string>('publicSiteUrl') || '';
    this.adminEmail = config.get<string>('mail.adminNotify') || '';
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.config.get<string>('mail.host');
    const port = this.config.get<number>('mail.port');
    const user = this.config.get<string>('mail.user');
    const pass = this.config.get<string>('mail.pass');
    if (!user || !pass || pass.startsWith('replace_')) {
      this.logger.warn('Mail credentials are placeholders. Emails will only be logged.');
      return;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  private renderTemplate(template: MailTemplate, data: Record<string, any>): { subject: string; html: string } {
    const brand = `<strong>${this.appName}</strong>`;
    const footer = `<p style="color:#888;font-size:12px;margin-top:24px">&copy; ${new Date().getFullYear()} ${this.appName}</p>`;
    switch (template) {
      case 'account-created-from-order':
        return {
          subject: `Your ${this.appName} account & order ${data.orderCode}`,
          html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2>Welcome to ${brand}!</h2>
            <p>Hi ${data.name},</p>
            <p>Your order <strong>${data.orderCode}</strong> has been received. We've created an account for you so you can track your order and book again easily.</p>
            <p><strong>Login details</strong></p>
            <p>Email: ${data.email}<br>Temporary password: <code style="background:#f4f4f5;padding:4px 8px;border-radius:4px">${data.tempPassword}</code></p>
            <p style="background:#fff3cd;padding:12px;border-left:4px solid #ffa500;border-radius:4px">⚠️ Please change your password after first login.</p>
            <p><a href="${this.siteUrl}/login" style="display:inline-block;background:hsl(192,80%,45%);color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px">Sign in</a></p>
            ${footer}
          </div>`,
        };
      case 'order-received':
        return {
          subject: `Order ${data.orderCode} received — ${this.appName}`,
          html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2>Order received 🎉</h2>
            <p>Hi ${data.name},</p>
            <p>We've received your order <strong>${data.orderCode}</strong>. Total: <strong>${data.total}</strong>.</p>
            <p>Scheduled: ${data.scheduled}</p>
            <p><a href="${this.siteUrl}/account/orders/${data.orderCode}">Track your order</a></p>
            ${footer}
          </div>`,
        };
      case 'order-status-changed':
        return {
          subject: `Order ${data.orderCode} is now ${data.status}`,
          html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2>Status update</h2>
            <p>Hi ${data.name},</p>
            <p>Your order <strong>${data.orderCode}</strong> is now <strong>${data.status}</strong>.</p>
            ${data.note ? `<p>Note: ${data.note}</p>` : ''}
            <p><a href="${this.siteUrl}/account/orders/${data.orderCode}">View order</a></p>
            ${footer}
          </div>`,
        };
      case 'new-order-notification':
        return {
          subject: `New order ${data.orderCode}`,
          html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2>New order received</h2>
            <p>Order code: <strong>${data.orderCode}</strong></p>
            <p>Customer: ${data.name} · ${data.phone}</p>
            <p>Total: ${data.total}</p>
            <p><a href="${this.siteUrl}/admin/orders/${data.orderId}">Open in admin</a></p>
          </div>`,
        };
      case 'contact-form-submission':
        return {
          subject: `Contact form: ${data.subject || 'New message'}`,
          html: `<div style="font-family:system-ui,sans-serif">
            <h3>${data.subject || 'New message'}</h3>
            <p>From: ${data.name} &lt;${data.email}&gt; ${data.phone || ''}</p>
            ${data.relatedOrderCode ? `<p>Related order: ${data.relatedOrderCode}</p>` : ''}
            <pre style="white-space:pre-wrap;background:#f4f4f5;padding:12px;border-radius:8px">${data.message}</pre>
          </div>`,
        };
      case 'admin-invite':
        return {
          subject: `You're invited to ${this.appName}`,
          html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2>You've been invited</h2>
            <p>You've been invited as <strong>${data.role}</strong> on ${brand}.</p>
            <p><a href="${data.link}" style="display:inline-block;background:hsl(192,80%,45%);color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px">Accept invite</a></p>
            <p style="color:#888;font-size:13px">Link expires in 7 days.</p>
            ${footer}
          </div>`,
        };
      case 'password-reset-link':
        return {
          subject: `Reset your ${this.appName} password`,
          html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2>Reset password</h2>
            <p><a href="${data.link}">Click here to set a new password</a>. Link expires in 1 hour.</p>
            <p>If you didn't request this, you can ignore this email.</p>
            ${footer}
          </div>`,
        };
      case 'email-verification':
        return {
          subject: `Verify your email on ${this.appName}`,
          html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2>Verify email</h2>
            <p><a href="${data.link}">Verify this email address</a>. Link expires in 1 hour.</p>
            ${footer}
          </div>`,
        };
      default:
        return { subject: 'Notification', html: '' };
    }
  }

  async send(template: MailTemplate, to: string, data: Record<string, any>) {
    const { subject, html } = this.renderTemplate(template, data);
    const from = this.config.get<string>('mail.from') || `${this.appName} <no-reply@example.com>`;
    if (!this.transporter) {
      this.logger.log(`[mail:dry-run] To=${to} subject="${subject}"`);
      return { id: 'dry-run' };
    }
    try {
      const info = await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Mail sent: ${info.messageId}`);
      return { id: info.messageId };
    } catch (err) {
      this.logger.error(`Mail send failed: ${(err as Error).message}`);
      return { id: 'error' };
    }
  }

  async notifyAdmin(template: MailTemplate, data: Record<string, any>) {
    if (!this.adminEmail) return;
    return this.send(template, this.adminEmail, data);
  }
}
