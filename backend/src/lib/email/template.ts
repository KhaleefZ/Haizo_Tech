/**
 * One branded, email-client-safe HTML shell for every transactional email.
 *
 * Uses tables + inline styles (the only thing that renders consistently across
 * Gmail/Outlook/Apple Mail), a light canvas with a white card, the HaizoTech
 * wordmark, an optional CTA button, and a plain footer. Callers pass already-safe
 * body HTML (escape any user text with `escapeHtml` first) plus a plain-text
 * alternative for deliverability.
 */
import { config } from '../../config/env.js';

const BRAND = '#1D4ED8';
const INK = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const CANVAS = '#F1F5F9';

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

export interface EmailOptions {
  /** Hidden preheader (inbox preview text). */
  preheader?: string;
  heading: string;
  /** Safe HTML for the message body. */
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  /** Small note under the CTA (e.g. how to change preferences). */
  footerNote?: string;
}

export function renderEmail(o: EmailOptions): string {
  const cta =
    o.ctaText && o.ctaUrl
      ? `<tr><td style="padding:8px 0 4px">
          <a href="${o.ctaUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;padding:12px 22px;border-radius:10px">${escapeHtml(o.ctaText)}</a>
        </td></tr>`
      : '';

  const note = o.footerNote
    ? `<p style="margin:16px 0 0;color:${MUTED};font-size:13px;line-height:1.5">${o.footerNote}</p>`
    : '';

  const preheader = o.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(o.preheader)}</div>`
    : '';

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${CANVAS}">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:32px 12px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;font-family:'Inter',Arial,Helvetica,sans-serif">
      <tr><td style="background:${BRAND};padding:18px 28px">
        <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em">HaizoTech</span>
      </td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 12px;color:${INK};font-size:20px;line-height:1.3;font-weight:700">${escapeHtml(o.heading)}</h1>
        <div style="color:#334155;font-size:15px;line-height:1.6">${o.bodyHtml}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px">${cta}</table>
        ${note}
      </td></tr>
      <tr><td style="border-top:1px solid ${BORDER};padding:18px 28px">
        <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.5">
          HaizoTech · Coimbatore, India<br>
          You’re receiving this because you have an account on the HaizoTech dashboard.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/** Absolute admin URL for a stored relative deep link. */
export function adminLink(path: string | null | undefined): string {
  return path ? `${config.adminUrl}${path}` : config.adminUrl;
}
