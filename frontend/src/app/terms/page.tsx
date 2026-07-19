import type { Metadata } from 'next';
import { CONTACT } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The terms under which HaizoTech provides software development services.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <main id="main" className="py-20">
      <div className="mx-auto mb-8 max-w-[760px] px-6">
        <p className="rounded-r-lg border-l-[3px] border-warning bg-warning/[0.09] p-4 text-sm">
          <strong>Draft.</strong> This page was written for the rebuild and has not been
          reviewed by a qualified lawyer. Have it checked before relying on it.
        </p>
      </div>
      <article className="mx-auto max-w-[760px] px-6">
        <h1 className="text-display">Terms of service</h1>
        <p className="mt-4 text-sm text-text-muted">Last reviewed: draft, pending legal review.</p>

        <div className="mt-10 flex flex-col gap-4 text-text">
          <h2 className="mt-6 text-h2">Scope</h2>
          <p>
            These terms cover the use of this website and the general basis on which HaizoTech
            provides software development services. Any actual engagement is governed by a
            signed statement of work, which takes precedence over this page wherever the two
            differ.
          </p>

          <h2 className="mt-6 text-h2">Quotes and engagement</h2>
          <p>
            Nothing on this site is a binding offer. Work begins when both parties sign a
            statement of work setting out scope, deliverables, timeline and fees.
          </p>

          <h2 className="mt-6 text-h2">Intellectual property</h2>
          <p>
            This is the part that matters most, and it is deliberate: <strong>on full payment,
            you own the code, the database schema and the intellectual property</strong> we
            create for you. There is no vendor lock-in and no licence you must keep paying to
            keep using your own system.
          </p>
          <p>
            Two carve-outs, so the promise is enforceable rather than merely bold. First,
            pre-existing HaizoTech components and general know-how remain ours, licensed to you
            perpetually for use within the delivered system. Second, third-party open-source
            components stay under their own licences.
          </p>

          <h2 className="mt-6 text-h2">Confidentiality</h2>
          <p>
            Each party keeps the other&rsquo;s non-public information confidential and uses it
            only for the engagement. This survives the end of the engagement.
          </p>

          <h2 className="mt-6 text-h2">Warranties and their limits</h2>
          <p>
            We warrant that work is performed with reasonable skill and care by competent
            engineers. We do not warrant that software will be uninterrupted or error-free —
            no honest engineering firm can. Defects reported within the period stated in the
            statement of work are corrected at no charge.
          </p>

          <h2 className="mt-6 text-h2">Liability</h2>
          <p>
            Neither party is liable for indirect or consequential loss. Our aggregate liability
            is capped at the fees paid under the relevant statement of work. Nothing here
            limits liability that cannot lawfully be limited.
          </p>

          <h2 className="mt-6 text-h2">Termination</h2>
          <p>
            Either party may terminate an engagement on written notice as set out in the
            statement of work. On termination you pay for work completed, and we hand over
            everything produced to that point.
          </p>

          <h2 className="mt-6 text-h2">Governing law</h2>
          <p>
            These terms are governed by the laws of India, and the courts of Tamil Nadu have
            exclusive jurisdiction.
          </p>

          <h2 className="mt-6 text-h2">Contact</h2>
          <p>{CONTACT.email} · {CONTACT.phoneDisplay}</p>
        </div>
      </article>
    </main>
  );
}
