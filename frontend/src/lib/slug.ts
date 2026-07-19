/**
 * URL-safe slug from a title. The Work and Blog tables predate slugs (they are
 * added later in the migration plan), so public URLs derive one from the title
 * and the route resolves by comparing derived slugs. Once the columns exist this
 * becomes a straight lookup.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
