/**
 * Contact details, in ONE place.
 *
 * These are the real values from haizotech.com. They appear in the header,
 * footer, contact page, JSON-LD and sitemap — so a change of phone number must
 * be a one-line edit, not a hunt through templates.
 */
export const CONTACT = {
  email: 'info@haizotech.com',
  phoneDisplay: '+91 8807341655',
  phoneE164: '+918807341655',
  street: '3A, Udyam Nagar, Podanur',
  city: 'Coimbatore',
  region: 'Tamil Nadu',
  postalCode: '641023',
  country: 'IN',
} as const;

/** Single-line form, for footers and meta descriptions. */
export const ADDRESS_LINE = `${CONTACT.street}, ${CONTACT.city}, ${CONTACT.region} - ${CONTACT.postalCode}`;

function LinkedInIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.2 1.45-2.2 2.96V21H9z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.1c-.25.69-1.43 1.32-1.97 1.4-.53.08-1.19.11-1.92-.12a17.5 17.5 0 0 1-1.74-.64c-3.06-1.32-5.06-4.4-5.21-4.6-.15-.2-1.25-1.66-1.25-3.17s.79-2.25 1.07-2.56c.28-.31.61-.38.81-.38l.58.01c.19.01.44-.7.69.53.25.6.86 2.1.94 2.25.08.15.13.33.02.53-.1.2-.16.33-.31.5l-.46.54c-.15.15-.31.32-.13.63.18.31.79 1.3 1.69 2.11 1.16 1.03 2.14 1.35 2.45 1.5.31.15.49.13.67-.08.18-.2.77-.9.98-1.21.2-.31.41-.26.69-.15.28.1 1.78.84 2.08.99.31.15.51.23.59.36.08.13.08.74-.17 1.43z" />
    </svg>
  );
}

/** Verified live on haizotech.com. */
export const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/haizotech', Icon: LinkedInIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/haizotech', Icon: InstagramIcon },
  {
    label: 'WhatsApp',
    href: 'https://api.whatsapp.com/send/?phone=918807341655&text&type=phone_number&app_absent=0',
    Icon: WhatsAppIcon,
  },
] as const;
