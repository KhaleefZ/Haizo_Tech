import type { Metadata } from 'next';
import { CONTACT } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What HaizoTech collects, why, how long it is kept, and your rights under the DPDP Act and GDPR.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main id="main" className="py-20">
      <div className="mx-auto mb-8 max-w-[760px] px-6">
        <p className="rounded-r-lg border-l-[3px] border-warning bg-warning/[0.09] p-4 text-sm">
          <strong>Draft.</strong> This page was written for the rebuild and has not been
          reviewed by a qualified lawyer. Have it checked before relying on it.
        </p>
      </div>
      <article className="mx-auto max-w-[760px] px-6">
        <h1 className="text-display">Privacy policy</h1>
        <p className="mt-4 text-sm text-text-muted">Last reviewed: draft, pending legal review.</p>

        <div className="mt-10 flex flex-col gap-4 text-text">
          <h2 className="mt-6 text-h2">What we collect</h2>
          <p>
            When you submit the contact form we collect your name, email address, and the
            message you write. Phone number, company, project type and budget range are
            optional and collected only if you provide them.
          </p>
          <p>
            We also collect basic, aggregate usage data — which pages are visited and roughly
            how long for. This is measured in a way that does not identify you personally and
            is not sold or shared with advertising networks.
          </p>

          <h2 className="mt-6 text-h2">Why we collect it</h2>
          <p>
            Solely to respond to your enquiry and, if we work together, to deliver the
            engagement. We do not use enquiry details for unrelated marketing, and we do not
            sell personal data to anyone, ever.
          </p>

          <h2 className="mt-6 text-h2">Lawful basis</h2>
          <p>
            For enquiries, your explicit consent — given by ticking the consent box on the
            contact form. For an active engagement, performance of a contract. You can withdraw
            consent at any time by emailing us.
          </p>

          <h2 className="mt-6 text-h2">How long we keep it</h2>
          <p>
            Enquiries that do not become engagements are deleted once they are clearly no
            longer relevant. Records relating to actual engagements are kept as long as
            required for contractual and tax purposes, then deleted.
          </p>

          <h2 className="mt-6 text-h2">Who else sees it</h2>
          <p>
            Only the HaizoTech team, plus the infrastructure providers that host our systems.
            We do not share your data with third parties for their own purposes.
          </p>

          <h2 className="mt-6 text-h2">Your rights</h2>
          <p>
            Under India&rsquo;s Digital Personal Data Protection Act and, where it applies, the
            GDPR, you can ask us what we hold about you, ask for it to be corrected, ask for it
            to be deleted, and withdraw consent. Email <a className="text-brand-blue underline" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> and we will action it.
          </p>

          <h2 className="mt-6 text-h2">Cookies</h2>
          <p>
            The public site does not set advertising or tracking cookies. Our admin dashboard,
            on a separate subdomain, uses strictly necessary cookies for staff authentication.
          </p>

          <h2 className="mt-6 text-h2">Contact</h2>
          <p>
            {CONTACT.email} · {CONTACT.phoneDisplay} · {CONTACT.city}, {CONTACT.region}, India.
          </p>
        </div>
      </article>
    </main>
  );
}
