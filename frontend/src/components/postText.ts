/**
 * Text derivations shared by the blog index and the article route.
 *
 * Body content arrives from the CMS as plain text, so everything the design
 * shows around a post — excerpt, reading time, formatted date — is derived
 * here rather than recomputed slightly differently on each page.
 */

/** Reading time from content length. ~200 words per minute, floor of 1. */
export function readingMinutes(content: string) {
  return Math.max(1, Math.round(content.split(/\s+/).length / 200));
}

/** Strip the light markdown authors sometimes type, for excerpt display. */
export function plainText(content: string) {
  return content.replace(/[#*`>_]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * A one-paragraph excerpt, cut on a word boundary so the ellipsis never lands
 * mid-word. Returns the text unchanged when it is already short enough.
 */
export function excerpt(content: string, max = 170) {
  const text = plainText(content);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/** Split plain-text body into paragraphs on blank lines. */
export function paragraphs(content: string) {
  return content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Initials for the byline avatar. */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || 'H';
}
