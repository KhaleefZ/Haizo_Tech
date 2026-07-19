/**
 * Transactional email transport (nodemailer over SMTP).
 *
 * Deliberately fail-soft: if SMTP isn't fully configured (no password yet), the
 * mailer logs and reports `sent: false` instead of throwing, so notifications and
 * the digest degrade to in-app only until real credentials are supplied. The
 * transport is created lazily and reused.
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from './logger.js';

let transporter: Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(config.smtpHost && config.smtpUser && config.smtpPass && config.mailFrom);
}

function getTransport(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: config.smtpUser, pass: config.smtpPass },
    });
  }
  return transporter;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(mail: MailInput): Promise<{ sent: boolean }> {
  if (!isMailConfigured()) {
    logger.warn({ to: mail.to, subject: mail.subject }, 'email skipped — SMTP not configured');
    return { sent: false };
  }
  try {
    await getTransport().sendMail({
      from: config.mailFrom,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    logger.info({ to: mail.to, subject: mail.subject }, 'email sent');
    return { sent: true };
  } catch (err) {
    logger.error({ err, to: mail.to }, 'email send failed');
    return { sent: false };
  }
}
