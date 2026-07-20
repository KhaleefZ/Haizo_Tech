import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { Reveal } from '@/components/Reveal';
import { StaggerHeadline } from '@/components/StaggerHeadline';
import { CONTACT, SOCIALS } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Tell us about your project. HaizoTech is a product studio in ${CONTACT.city}, ${CONTACT.region}. Email ${CONTACT.email} or call ${CONTACT.phoneDisplay}.`,
  alternates: { canonical: '/contact' },
};

/** The response-time claim, marked in the mockup and still unconfirmed. */

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

/**
 * One contact method: icon, heading, the detail itself, and a line of context.
 *
 * The mockup deliberately removed WhatsApp from this list — it is a social
 * channel, not a contact method, and it appears once in the social row below.
 */
function Method({
  icon,
  title,
  children,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  note: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-11 w-11 flex-none place-items-center rounded-token bg-bg-tint-2 text-brand-blue">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-h4">{title}</h3>
        <div className="mt-1 text-text-muted">{children}</div>
        <p className="mt-1 text-sm text-text-muted">{note}</p>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    // overflow-x:clip contains the Reveal entry offset at 375px without
    // creating a scroll container.
    <main id="main" className="[overflow-x:clip]">
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-hero-wash" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-overline uppercase text-brand-blue">Contact</p>
          <StaggerHeadline words={['Tell', 'us', 'what']} tail="you’re trying to build." />
          <p className="mt-6 max-w-[62ch] text-body-lg text-text-muted">
            The more concretely you describe the problem, the more useful our first reply will
            be. If we&rsquo;re not the right team for it, we&rsquo;ll say so and point you
            somewhere better.
          </p>

          <div className="mt-12 grid items-start gap-8 lg:grid-cols-2">
            {/* ============================================================ form */}
            <Reveal className="min-w-0">
              <div className="rounded-token border border-border bg-card p-6 shadow-card md:p-8">
                <h2 className="text-h3">Project enquiry</h2>
                <p className="mt-2 text-sm text-text-muted">
                  Fields marked with an asterisk are required.
                </p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </Reveal>

            {/* ========================================================= details */}
            <div className="flex min-w-0 flex-col gap-5">
              <Reveal delay={60} className="min-w-0">
                <div className="rounded-token border border-border bg-card p-6 shadow-card md:p-8">
                  <h2 className="text-h3">Reach us directly</h2>

                  <div className="mt-6 flex flex-col gap-6">
                    <Method
                      icon={<MailIcon />}
                      title="Email"
                      note="Goes to the team, not a shared inbox nobody reads."
                    >
                      <a href={`mailto:${CONTACT.email}`} className="text-brand-blue hover:underline">
                        {CONTACT.email}
                      </a>
                    </Method>

                    <Method
                      icon={<PhoneIcon />}
                      title="Phone"
                      note="Working hours IST. If we can’t pick up, leave a message and we’ll call back."
                    >
                      <a href={`tel:${CONTACT.phoneE164}`} className="text-brand-blue hover:underline">
                        {CONTACT.phoneDisplay}
                      </a>
                    </Method>

                    <Method
                      icon={<PinIcon />}
                      title="Where we are"
                      note="We work with clients across India and abroad, remotely by default and on-site when the problem needs it."
                    >
                      <address className="not-italic">
                        {CONTACT.street},
                        <br />
                        {CONTACT.city}, {CONTACT.region} &ndash; {CONTACT.postalCode}
                        <br />
                        India
                      </address>
                    </Method>

                    <Method
                      icon={<ClockIcon />}
                      title="Response time"
                      note="A person reads every enquiry and replies with a real answer — including when that answer is no."
                    >
                      Within 24 hours
                    </Method>
                  </div>

                  {/* Social. Icon plus visible label, so the accessible name is
                      the text itself and the svg stays decorative. WhatsApp
                      lives here and only here. */}
                  <div className="mt-8 border-t border-border pt-6">
                    <h3 className="text-h4">Find us elsewhere</h3>
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                      {SOCIALS.map((s) => (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-text transition-colors hover:text-brand-blue"
                        >
                          <span className="text-brand-blue">
                            <s.Icon />
                          </span>
                          {s.label}
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={120} className="min-w-0">
                <div className="rounded-token border border-border bg-bg-tint p-6 shadow-card md:p-8">
                  <h3 className="text-h3">What happens next</h3>
                  <ol className="mt-4 flex list-decimal flex-col gap-3 pl-5 text-text-muted marker:font-semibold marker:text-brand-blue">
                    <li>
                      We read your enquiry and reply within 24 hours.
                    </li>
                    <li>A 30-minute call to understand the problem properly — no pitch deck.</li>
                    <li>
                      A written scope with a fixed price per phase, or an honest referral
                      elsewhere.
                    </li>
                  </ol>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
