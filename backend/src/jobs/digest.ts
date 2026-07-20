/**
 * Daily notification digest. For each user whose master switch is on, gather
 * their unread notifications that haven't been emailed yet (respecting per-type
 * preferences), email a summary, and stamp `emailedAt` so they aren't repeated.
 *
 * The digest is the email channel for ordinary notification types — they persist
 * and socket-notify immediately, then roll up here once a day rather than
 * emailing per event. No-ops cleanly when SMTP isn't configured.
 */
import { notificationRepository } from '../repositories/notification.repository.js';
import { isNotificationType } from '../lib/notifications/catalogue.js';
import { sendMail, isMailConfigured } from '../lib/mailer.js';
import { config } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { renderEmail, escapeHtml, adminLink } from '../lib/email/template.js';

function prefAllows(prefs: unknown, type: string): boolean {
  const p = (prefs ?? null) as Record<string, boolean> | null;
  return p?.[type] !== false;
}

interface DigestRow {
  title: string;
  message: string;
  url: string | null;
}

function render(name: string, rows: DigestRow[]): { html: string; text: string } {
  const items = rows
    .map((n) => {
      const url = adminLink(n.url);
      return `<tr><td style="padding:12px 0;border-bottom:1px solid #E2E8F0">
        <a href="${url}" style="color:#1D4ED8;text-decoration:none;font-weight:600;font-size:15px">${escapeHtml(n.title)}</a>
        <div style="color:#64748B;font-size:14px;margin-top:3px;line-height:1.5">${escapeHtml(n.message)}</div>
      </td></tr>`;
    })
    .join('');

  const html = renderEmail({
    preheader: `${rows.length} new notification${rows.length > 1 ? 's' : ''} on HaizoTech`,
    heading: `Hi ${escapeHtml(name)}, you have ${rows.length} new notification${rows.length > 1 ? 's' : ''}`,
    bodyHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${items}</table>`,
    ctaText: 'Open the dashboard',
    ctaUrl: config.adminUrl,
    footerNote: 'Change what you’re notified about anytime in Settings.',
  });

  const text = `Hi ${name}, you have ${rows.length} new notification${rows.length > 1 ? 's' : ''}:\n\n${rows
    .map((n) => `• ${n.title} — ${n.message}`)
    .join('\n')}\n\n${config.adminUrl}`;
  return { html, text };
}

export async function runDigest(): Promise<{ usersEmailed: number; notifications: number }> {
  if (!isMailConfigured()) {
    logger.warn('digest skipped — SMTP not configured');
    return { usersEmailed: 0, notifications: 0 };
  }

  const recipients = await notificationRepository.digestRecipients();
  let usersEmailed = 0;
  let notifications = 0;

  for (const user of recipients) {
    const all = await notificationRepository.unemailedUnread(user.id);
    const eligible = all.filter(
      (n) => !isNotificationType(n.type) || prefAllows(user.notificationPrefs, n.type),
    );
    if (eligible.length === 0) continue;

    const { html, text } = render(user.name, eligible);
    const { sent } = await sendMail({
      to: user.email,
      subject: `You have ${eligible.length} new notification${eligible.length > 1 ? 's' : ''}`,
      html,
      text,
    });

    if (sent) {
      await notificationRepository.markEmailed(eligible.map((n) => n.id));
      usersEmailed += 1;
      notifications += eligible.length;
    }
  }

  logger.info({ usersEmailed, notifications }, 'digest complete');
  return { usersEmailed, notifications };
}
