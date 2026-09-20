import { Resend } from 'resend';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const log = logger.child({ service: 'EmailService' });

export interface IEmailService {
  sendVerificationEmail(to: string, name: string | null | undefined, code: string): Promise<void>;
}

export class EmailService implements IEmailService {
  private resend: Resend | null = null;

  constructor() {
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
      log.info('Resend email service initialized');
    } else {
      log.info('No RESEND_API_KEY detected; using development console email logger');
    }
  }

  async sendVerificationEmail(to: string, name: string | null | undefined, code: string): Promise<void> {
    const displayName = name ? name : 'there';

    // If Resend API key is configured, send via Resend
    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: env.EMAIL_FROM,
          to,
          subject: `${code} is your Career OS verification code`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
              <div style="margin-bottom: 24px;">
                <h1 style="font-size: 20px; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 8px 0; color: #111;">Career OS</h1>
                <p style="font-size: 14px; color: #666; margin: 0;">Personal Career Operating System</p>
              </div>
              <div style="background: #fafafa; border: 1px solid #eaeaea; border-radius: 8px; padding: 28px; margin-bottom: 24px;">
                <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">Hello ${displayName},</p>
                <p style="font-size: 14px; line-height: 1.5; color: #444; margin: 0 0 24px 0;">
                  Use the following verification code to confirm your email and complete your registration.
                </p>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 24px;">
                  <span style="font-family: 'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f172a;">${code}</span>
                </div>
                <p style="font-size: 13px; color: #718096; margin: 0; line-height: 1.4;">
                  This code expires in 15 minutes. If you did not request this email, you can safely ignore it.
                </p>
              </div>
              <p style="font-size: 12px; color: #a0aec0; margin: 0;">&copy; ${new Date().getFullYear()} Career OS. All rights reserved.</p>
            </div>
          `,
          text: `Hello ${displayName},\n\nYour Career OS verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you did not request this email, please ignore it.`,
        });

        if (error) {
          log.error({ error, to }, 'Failed to deliver email via Resend');
          throw new Error(`Email delivery failed: ${error.message}`);
        }

        log.info({ messageId: data?.id, to }, 'Verification email sent successfully via Resend');
        return;
      } catch (err) {
        log.error({ err, to }, 'Exception during Resend email delivery');
        throw err;
      }
    }

    // Local / Dev Fallback: Log clearly to console
    log.info(
      {
        to,
        code,
        expiresIn: '15m',
      },
      `\n══════════════════════════════════════════════════\n[DEV EMAIL] Verification Code for ${to}: ${code}\n══════════════════════════════════════════════════`
    );
  }
}

export const emailService = new EmailService();

