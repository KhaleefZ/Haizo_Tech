import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Work } from '@haizo/types';
import { api, SITE_URL } from '@/lib/api';
import { slugify } from '@/lib/slug';
import { Reveal } from '@/components/Reveal';
import { StaggerHeadline } from '@/components/StaggerHeadline';
import { PanelArt } from '@/components/PanelArt';
import { ProcessTimeline, type ProcessStep } from '@/components/ProcessTimeline';

type Props = { params: Promise<{ slug: string }> };

/**
 * Per-service narrative.
 *
 * The title, summary, deliverables and stack all come from the API. What lives
 * here is the material the database has no column for: the paragraph that
 * expands each deliverable, the process steps, the stack commentary and the
 * FAQ. Every word is taken from the approved mockups rather than written new.
 *
 * `deliverableCopy` is keyed by the exact deliverable string the API returns,
 * so a deliverable renamed in the database falls back to no expansion rather
 * than silently attaching the wrong paragraph to it.
 */
type ServiceNarrative = {
  /** Staggered hero headline: leading words, then the phrase that lands last. */
  heroWords: string[];
  heroTail: string;
  /** Indexes into the API's `deliverables`, matching the mockup's hero badges. */
  heroBadges: number[];
  includedLead: string;
  deliverableCopy: Record<string, string>;
  processOverline: string;
  processHeading: string;
  processLead: string;
  steps: ProcessStep[];
  stackOverline: string;
  stackHeading: string;
  stackLead: string;
  stackNotes: { label: string; body: string }[];
  art: string;
  artCaption: string;
  relatedHeading: string;
  /** Only the AI service sets this — see the note on that entry. */
  relatedLead?: string;
  /** Categories preferred when choosing the two related case studies. */
  relatedCategories: string[];
  faq: { q: string; a: string }[];
  ctaHeading: string;
  ctaBody: string;
};

const NARRATIVE: Record<string, ServiceNarrative> = {
  'custom-software-development': {
    heroWords: ['Custom', 'software'],
    heroTail: 'development.',
    heroBadges: [0, 1, 3],
    includedLead:
      'Every engagement ships with the same four things, because without them you don’t own the software — you only rent it.',
    deliverableCopy: {
      '100% IP Ownership':
        'The code, the schema and the deployment configuration are yours. We hand over the repository, not a licence to it.',
      'No Vendor Lock-in':
        'Standard languages, standard databases, standard hosting. Another team can pick this up without calling us first.',
      'Perfectly aligned with your workflows':
        'We map how the work is done today before we design anything, so the software fits the process rather than replacing it by force.',
      'Scalable microservices architecture':
        'Services split along real business boundaries, so the parts under load can grow without dragging the rest of the system with them.',
    },
    processOverline: 'How it works',
    processHeading: 'Four steps, in the open',
    processLead: 'The same shape every engagement follows.',
    steps: [
      {
        n: '01',
        title: 'Scope',
        body: 'We map the problem, the users and the constraints, then write down what v1 will and won’t include.',
      },
      {
        n: '02',
        title: 'Design',
        body: 'Data model, service boundaries and screens you can click before we build them, so changes stay cheap.',
      },
      {
        n: '03',
        title: 'Build',
        body: 'Working software on a staging URL every week. You see progress in the product, not in a status report.',
      },
      {
        n: '04',
        title: 'Ship & hand over',
        body: 'Deploy, monitor, transfer the repository and the pipeline, and stay on through the settling-in period.',
      },
    ],
    stackOverline: 'Tech stack',
    stackHeading: 'Boring tools, chosen deliberately',
    stackLead:
      'We pick technologies that a future team can hire for. Every choice below is widely used, well documented, and something we run in production ourselves — which is also what makes the no-lock-in promise possible.',
    stackNotes: [
      {
        label: 'Application',
        body: 'TypeScript across the stack, so the same types describe the API on both sides of the wire.',
      },
      {
        label: 'Data',
        body: 'PostgreSQL with versioned migrations. The schema is in the repository, never only on a server.',
      },
      {
        label: 'Services',
        body: 'Containerised services with an OpenAPI contract that the build validates on every merge.',
      },
      {
        label: 'Delivery',
        body: 'Typecheck, lint, build and test gate each merge, and the rollback path is known before we deploy.',
      },
    ],
    art: '/img/service-custom-software.svg',
    artCaption: 'One schema, one contract, one deployment path.',
    relatedHeading: 'Related work',
    relatedCategories: ['Custom Software Development'],
    faq: [
      {
        q: 'Who owns the code at the end?',
        a: 'You do, entirely. The repository, the database schema and the deployment configuration transfer to you, and there is no runtime licence or hosted component you have to keep paying us for.',
      },
      {
        q: 'What happens if we want to move to another team?',
        a: 'Nothing breaks. We use widely-known languages and standard infrastructure precisely so another team can take over, and the documentation and pipeline go with the code.',
      },
      {
        q: 'Do we have to know our full requirements up front?',
        a: 'No. Scoping is the first step, and its output is a written v1 boundary — what’s in, what’s out, and what we’ve deliberately deferred. Things you discover during the build get scoped the same way.',
      },
      {
        q: 'Can you work with the systems we already have?',
        a: 'Usually yes. We start by reading the existing data and integration points, then design the new services around them, rather than assuming a clean replacement is the right answer.',
      },
    ],
    ctaHeading: 'Have a system that needs building?',
    ctaBody:
      'Tell us the problem. We’ll tell you honestly whether custom software is the right answer for it.',
  },

  'web-mobile-application-development': {
    heroWords: ['Web', '& mobile'],
    heroTail: 'application development.',
    heroBadges: [0, 1, 3],
    includedLead:
      'Four things every app build ships with, because an interface that is slow, inconsistent or invisible to search is an interface nobody finishes using.',
    deliverableCopy: {
      'Sub-second page loads':
        'Performance is a build constraint, not a later clean-up. We budget the payload up front, render on the server where it helps, and keep the critical path small enough that the first screen arrives before attention does.',
      'Cross-platform consistency':
        'One design system and one set of components behind both the web app and the mobile app, so a change to a form or a state lands in every place it appears rather than in whichever codebase someone remembered.',
      'High conversion UI/UX':
        'We design the path a user is actually trying to take — fewer steps, clearer state, obvious next action — and handle the loading, empty and error cases explicitly, because most drop-off happens where nobody drew a screen.',
      'SEO-optimized architectures':
        'Real URLs, server-rendered content, correct heading structure and metadata that a crawler can read without executing your whole application first. Accessibility and search visibility come from the same discipline.',
    },
    processOverline: 'Process',
    processHeading: 'How an app gets built',
    processLead:
      'Four steps tuned to interface work, where the design and the build are the same conversation.',
    steps: [
      {
        n: '01',
        title: 'Flows & screens',
        lead: 'What the user is trying to finish.',
        body: 'We list the journeys that matter, the roles that take them, and the states each screen has to survive — signed out, empty, loading, failed.',
      },
      {
        n: '02',
        title: 'Design system',
        lead: 'Tokens and components before pages.',
        body: 'Colour, type, spacing and the shared components are settled once, so web and mobile stay consistent without anyone policing it.',
      },
      {
        n: '03',
        title: 'Build against the API contract',
        lead: 'Screens wired to real data.',
        body: 'Types come from the API contract rather than guesswork, so the frontend and the backend cannot quietly disagree about a payload.',
      },
      {
        n: '04',
        title: 'Performance & store release',
        lead: 'Measured, then shipped.',
        body: 'Load and accessibility checks on real devices, then release to the web and through the app stores with the rollback path already known.',
      },
    ],
    stackOverline: 'Tech stack',
    stackHeading: 'Three tools, shared between web and mobile',
    stackLead:
      'We keep the surface deliberately small. The same language, the same component thinking and the same team move between the browser build and the device build, which is what makes cross-platform consistency practical rather than aspirational.',
    stackNotes: [
      {
        label: 'React',
        body: 'The component model everything else sits on. State and UI live together, and a component is written once and reused.',
      },
      {
        label: 'Next.js',
        body: 'Server rendering, real routes and metadata — the part that makes pages both fast on first paint and legible to crawlers.',
      },
      {
        label: 'React Native',
        body: 'Native iOS and Android from the same component vocabulary, so the mobile app is not a separate product with a separate backlog.',
      },
    ],
    art: '/img/service-web-mobile.svg',
    artCaption: 'One design system, two runtimes, no divergence.',
    relatedHeading: 'Two interface-heavy builds',
    relatedCategories: ['Web & Mobile Apps'],
    faq: [
      {
        q: 'Do we need a separate mobile app, or is a web app enough?',
        a: 'It depends on what the app has to reach. If you need the camera, offline use, push notifications or a store presence, a native app earns its keep. If you don’t, a well-built web app reaches every device immediately and costs less to maintain. We’ll say which one your case is before you commit to either.',
      },
      {
        q: 'Can you work with our existing design or brand?',
        a: 'Yes. If you have a design system or brand guidelines we build the token set from those, so the app looks like your product rather than a framework’s defaults. If you don’t have one, we make it as part of the build and hand it over with the code.',
      },
      {
        q: 'How do you keep the app fast as it grows?',
        a: 'By treating load as something measured on every merge, not something checked at the end. We watch the payload size and the render path as features land, so a regression is a build failure rather than a support ticket six months later.',
      },
      {
        q: 'Who handles the app store submissions?',
        a: 'We do, on your developer accounts — the accounts stay in your name so you keep control of the listing, the signing keys and the release history. We take you through the first submission and leave you able to run the next one.',
      },
    ],
    ctaHeading: 'Have an app that needs building?',
    ctaBody:
      'Tell us who uses it and what they’re trying to finish. We’ll tell you honestly what it should be built as.',
  },

  'ai-systems-integrations': {
    heroWords: ['AI', 'systems'],
    heroTail: '& integrations.',
    heroBadges: [0, 1, 3],
    includedLead:
      'Four things every AI engagement ships with, because a model that can’t be inspected, contained or measured is a liability rather than a feature.',
    deliverableCopy: {
      'Automated complex reasoning':
        'Work that takes a person several judgement calls and several systems — reading a document, checking it against your data, deciding what happens next — handled as an orchestrated sequence of steps you can read back afterwards, not a single opaque answer.',
      'Secure on-premise AI deployments':
        'Where your data cannot leave your estate, the models run inside it. We deploy open-weight models on your own infrastructure so documents, prompts and outputs stay under your control and your existing access rules still apply.',
      'Drastic reduction in manual overhead':
        'We target the repetitive middle of a process — the triage, the copying between systems, the first-pass summary — and leave the decision with a person. The measurable win is the time nobody spends shuffling information any more.',
      'Data-driven predictive modeling':
        'Forecasting built on your own history rather than a generic model, with the assumptions written down and the accuracy tracked against what actually happened, so you can tell when a prediction has stopped being worth acting on.',
    },
    processOverline: 'Process',
    processHeading: 'How an AI system gets built',
    processLead:
      'Four steps tuned to AI work, where the hard part is proving the thing is right, not getting an answer out of it.',
    steps: [
      {
        n: '01',
        title: 'Use case & data audit',
        lead: 'Is this an AI problem at all?',
        body: 'We look at the task and the data behind it. Plenty of requests are better served by a query or a rule, and we will say so before anyone pays for a model.',
      },
      {
        n: '02',
        title: 'Retrieval & grounding',
        lead: 'Answers tied to your sources.',
        body: 'We build the ingestion and retrieval layer first, with permissions carried through it, so the system answers from your documents and can cite which one.',
      },
      {
        n: '03',
        title: 'Evaluation harness',
        lead: 'A test set before a launch.',
        body: 'Real questions with known good answers, scored on every change. Without this there is no way to tell an improvement from a regression.',
      },
      {
        n: '04',
        title: 'Guardrails & rollout',
        lead: 'Human in the loop where it matters.',
        body: 'Limits on what the system may do unattended, logging of every call, and a staged rollout that starts with review before it starts with autonomy.',
      },
    ],
    stackOverline: 'Approach',
    stackHeading: 'Model-agnostic on purpose',
    stackLead:
      'We don’t publish a fixed AI stack, because the sensible choice changes with the work and with the month. What stays fixed is the shape around the model: the retrieval layer, the evaluation set and the guardrails are ours, and the model behind them is replaceable.',
    stackNotes: [
      {
        label: 'Retrieval',
        body: 'Your documents, chunked and indexed with your access rules attached, so a user never retrieves something they couldn’t already open.',
      },
      {
        label: 'Orchestration',
        body: 'Multi-step work split into named steps with defined inputs and outputs, so a failure points at a step rather than at the whole system.',
      },
      {
        label: 'Model choice',
        body: 'Hosted or on-premise, decided by where your data is allowed to go — and behind an interface that lets us swap it without a rewrite.',
      },
      {
        label: 'Evaluation',
        body: 'A scored test set in the repository, run on every change, so quality is something the build reports rather than something a demo suggests.',
      },
    ],
    art: '/img/service-ai-systems.svg',
    artCaption: 'Retrieval, orchestration and model calls you can audit.',
    relatedHeading: 'The closest published builds',
    // Deliberate, and carried over from the mockup: there is no published AI
    // case study. Saying so plainly beats letting adjacent builds imply one.
    relatedLead:
      'We have no AI case study published yet, and we’re not going to invent one. These are the nearest in shape — data-heavy systems where permissions and correctness were the difficult part.',
    relatedCategories: [],
    faq: [
      {
        q: 'Will our data be used to train someone else’s model?',
        a: 'Not on our watch. Where a hosted model is appropriate we use the terms that exclude training on your inputs, and where that isn’t good enough for your data we run open-weight models on your own infrastructure instead. Which of the two applies is a decision we make with you at the start, not a default we pick quietly.',
      },
      {
        q: 'What stops it making things up?',
        a: 'Grounding and evaluation. Answers are retrieved from your own documents and cite which one they came from, so a claim can be checked rather than trusted. On top of that we keep a scored test set that runs on every change, and for anything consequential the system proposes and a person approves.',
      },
      {
        q: 'Do we need a lot of data before this is worth doing?',
        a: 'For retrieval work, no — it runs on the documents and records you already have. Predictive modelling is different: it needs enough history to learn from, and if you don’t have it we’ll tell you that up front rather than fitting a model to too little and calling it a forecast.',
      },
      {
        q: 'What happens when a better model comes out?',
        a: 'You swap it. The model sits behind an interface, and the retrieval layer, the prompts and the evaluation set are yours and stay put. We re-run the test set against the new model and you can see whether it’s actually better for your work before anything changes in production.',
      },
    ],
    ctaHeading: 'Have a process that AI might fix?',
    ctaBody:
      'Tell us the task and what the data behind it looks like. We’ll tell you honestly whether a model is the right tool for it.',
  },

  'network-services-it-solutions': {
    heroWords: ['Network', 'services'],
    heroTail: '& IT solutions.',
    // Indexes 1–3: the uptime figure is deliberately kept out of the hero so it
    // appears once, in the deliverable the API supplies, and is never restated.
    heroBadges: [1, 2, 3],
    includedLead:
      'Four things every infrastructure engagement ships with, because availability, access, delivery and recovery are the four ways a system stops being trustworthy.',
    deliverableCopy: {
      '99.99% Uptime guarantees':
        'An availability target is an engineering constraint, not a slogan. Reaching one means no single point of failure in the path a request takes, health checks that pull a bad instance out before users find it, and monitoring from outside your own network so the alert doesn’t depend on the thing that broke.',
      'Zero-Trust security posture':
        'Nothing is trusted because of where it sits on the network. Every service authenticates, every request is authorised, credentials are short-lived, and access is granted per role and per resource — so a compromised machine inside the perimeter doesn’t inherit the run of the estate.',
      'Automated CI/CD pipelines':
        'Every change reaches production the same way — built, tested and deployed by the pipeline rather than by hand on a Friday. Releases become boring and repeatable, and the rollback path is exercised often enough to be trusted when it’s needed.',
      'Disaster recovery & redundancy':
        'Backups you have restored from, not backups you own. We write down the recovery objectives with you, build the redundancy that meets them, and then rehearse the restore, because an untested backup is a hope rather than a plan.',
    },
    processOverline: 'Process',
    processHeading: 'How infrastructure gets built',
    processLead:
      'Four steps tuned to infrastructure work, where the change has to be reversible before it is allowed to happen.',
    steps: [
      {
        n: '01',
        title: 'Audit the estate',
        lead: 'What is actually running, and who can reach it.',
        body: 'We inventory the networks, services, accounts and access paths you have today — including the ones nobody has looked at in a while.',
      },
      {
        n: '02',
        title: 'Architecture & access design',
        lead: 'Segments, roles and failure domains.',
        body: 'We design the network boundaries, the identity model and where redundancy sits, and agree the recovery objectives before anything is provisioned.',
      },
      {
        n: '03',
        title: 'Provision as code',
        lead: 'The environment lives in the repository.',
        body: 'Infrastructure is declared, reviewed and versioned like application code, so environments match each other and a change is a pull request, not a console click.',
      },
      {
        n: '04',
        title: 'Monitor & rehearse recovery',
        lead: 'Alerts that page, restores that work.',
        body: 'Monitoring and alert routing go live with the system, and we run the failover and the restore with your team so the runbook has been used before it’s needed.',
      },
    ],
    stackOverline: 'Tech stack',
    stackHeading: 'Declared, versioned, reproducible',
    stackLead:
      'Two commitments underpin everything above. The estate is described in code rather than configured by memory, and the workloads are portable enough that a provider is a choice you can revisit rather than a position you’re stuck in.',
    stackNotes: [
      {
        label: 'Kubernetes',
        body: 'Workloads described by what they need rather than which machine they sit on, so failed instances are replaced automatically and capacity moves with demand.',
      },
      {
        label: 'Infrastructure-as-Code',
        body: 'Networks, roles and services defined in files under review, so staging and production are the same shape and rebuilding one is a known operation.',
      },
      {
        label: 'Identity',
        body: 'Short-lived credentials issued per service and per role, with the grants written down in the same repository as the infrastructure they apply to.',
      },
      {
        label: 'Observability',
        body: 'Metrics, logs and alert routing provisioned with the system rather than added after the first outage taught you what was missing.',
      },
    ],
    art: '/img/service-network-it.svg',
    artCaption: 'Every environment rebuildable from the repository.',
    relatedHeading: 'Infrastructure-led builds',
    relatedCategories: [],
    faq: [
      {
        q: 'Do we have to move everything to the cloud?',
        a: 'No. Some workloads are cheaper and simpler where they already are, and moving them earns nothing but a migration risk. We look at each one on its own terms and are happy to leave things on your own hardware if that’s the right answer — a hybrid estate is a legitimate outcome, not a failure to finish.',
      },
      {
        q: 'Can you work with our existing IT team?',
        a: 'That’s the usual arrangement. They know the estate and the constraints better than we will, and the point of describing everything in code is that the result is readable by whoever runs it next. We build alongside them and hand over documentation and access, not a dependency on us.',
      },
      {
        q: 'How disruptive is a migration to the people using the systems?',
        a: 'We plan for it to be dull. New environment stood up alongside the old one, traffic moved in stages, and the old path kept warm until the new one has proven itself. If something looks wrong we move back, which is a decision we make deliberately rather than an emergency.',
      },
      {
        q: 'What happens when something breaks at 2am?',
        a: 'The alert routing and the runbook are part of the delivery, so whoever is on call has a written first response rather than a guess. Where you want us on that rota we’ll agree the response arrangement in writing — scope, hours and escalation — before it applies, not after the first incident.',
      },
    ],
    ctaHeading: 'Have infrastructure that needs sorting out?',
    ctaBody:
      'Tell us what’s running and what keeps going wrong. We’ll tell you honestly what’s worth changing and what isn’t.',
  },
};

/** Four capability glyphs, reused across services in deliverable order. */
const CAPABILITY_ICONS = [
  'M20 6 9 17l-5-5',
  'M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1',
  'M3 12h4l3-8 4 16 3-8h4',
  'M4.5 4.5h5v5h-5zM14.5 4.5h5v5h-5zM4.5 14.5h5v5h-5zM14.5 14.5h5v5h-5z',
];

export async function generateStaticParams() {
  const services = await api.services();
  return (services?.data ?? []).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await api.service(slug);
  if (!service) return { title: 'Service not found' };
  return {
    title: service.seoTitle ?? service.title,
    description: service.seoDescription ?? service.summary,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

/**
 * Two case studies to show alongside a service. Preferred categories first,
 * then anything else published — so the section is never padded with repeats
 * and never invents a project that doesn't exist.
 */
function pickRelated(works: Work[], categories: string[]): Work[] {
  const preferred = works.filter((w) => categories.includes(w.category));
  const rest = works.filter((w) => !preferred.includes(w));
  return [...preferred, ...rest].slice(0, 2);
}

export default async function ServiceDetail({ params }: Props) {
  const { slug } = await params;
  const [service, works] = await Promise.all([api.service(slug), api.work('?pageSize=50')]);
  if (!service) notFound();

  const n = NARRATIVE[service.slug];
  const related = n ? pickRelated(works?.data ?? [], n.relatedCategories) : [];

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.summary,
    provider: { '@type': 'Organization', name: 'HaizoTech', url: SITE_URL },
    areaServed: 'Worldwide',
    url: `${SITE_URL}/services/${service.slug}`,
  };

  const faqLd = n
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: n.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  return (
    <main id="main" className="[overflow-x:clip]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}

      {/* ============================================================= hero */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-hero-wash" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-sm text-text-muted">
            <Link href="/services" className="text-brand-blue hover:underline">
              Services
            </Link>
            <span aria-hidden="true"> / </span>
            {service.title}
          </p>

          {n ? (
            <StaggerHeadline words={n.heroWords} tail={n.heroTail} />
          ) : (
            <h1 className="mt-4 text-display">{service.title}</h1>
          )}

          <p className="mt-6 max-w-[62ch] text-body-lg text-text">{service.summary}</p>

          {n && service.deliverables.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {n.heroBadges
                .map((i) => service.deliverables[i])
                .filter((d): d is string => Boolean(d))
                .map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-border bg-bg-tint px-2.5 py-1 text-overline font-semibold text-text-muted"
                  >
                    {d}
                  </span>
                ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-token bg-brand-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-blue-600"
            >
              Start a Project
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link
              href="/services"
              className="rounded-token border border-border px-5 py-3 font-semibold text-brand-blue transition-colors hover:border-brand-blue hover:bg-bg-tint"
            >
              All services
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================== what's included */}
      {service.deliverables.length > 0 && (
        <section className="bg-bg-tint py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <div className="max-w-[680px]">
                <p className="text-overline uppercase text-brand-blue">What&rsquo;s included</p>
                <h2 className="mt-3 text-h2">What you actually get</h2>
                {n && <p className="mt-3 text-body-lg text-text-muted">{n.includedLead}</p>}
              </div>
            </Reveal>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {service.deliverables.map((d, i) => (
                <Reveal key={d} delay={i * 60} className="min-w-0">
                  <div className="h-full rounded-token border border-border bg-card p-8 shadow-card">
                    <span className="mb-4 grid h-11 w-11 place-items-center rounded-[10px] bg-bg-tint-2 text-brand-blue">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={CAPABILITY_ICONS[i % CAPABILITY_ICONS.length]} />
                      </svg>
                    </span>
                    <h3 className="text-h3">{d}</h3>
                    {n?.deliverableCopy[d] && (
                      <p className="mt-2 text-sm text-text-muted">{n.deliverableCopy[d]}</p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================== process */}
      {n && (
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <div className="max-w-[680px]">
                <p className="text-overline uppercase text-brand-blue">{n.processOverline}</p>
                <h2 className="mt-3 text-h2">{n.processHeading}</h2>
                <p className="mt-3 text-body-lg text-text-muted">{n.processLead}</p>
              </div>
            </Reveal>
            <ProcessTimeline steps={n.steps} />
          </div>
        </section>
      )}

      {/* ======================================================= tech stack */}
      {n && (
        <section className="bg-bg-tint py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
            <Reveal className="min-w-0">
              <p className="text-overline uppercase text-brand-blue">{n.stackOverline}</p>
              <h2 className="mt-3 text-h2">{n.stackHeading}</h2>
              <p className="mt-4 text-body-lg text-text-muted">{n.stackLead}</p>

              {service.stack.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {service.stack.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-bg-tint-2 px-2.5 py-1 text-overline font-semibold text-brand-blue"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-4">
                {n.stackNotes.map((s) => (
                  <div key={s.label} className="flex items-start gap-3">
                    <span className="inline-flex flex-none items-center rounded-full bg-bg-tint-2 px-2.5 py-1 text-overline font-semibold text-brand-blue">
                      {s.label}
                    </span>
                    <p className="text-sm text-text">{s.body}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={80} className="min-w-0">
              <PanelArt src={n.art} caption={n.artCaption} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ===================================================== related work */}
      {n && related.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <div className="max-w-[680px]">
                <p className="text-overline uppercase text-brand-blue">Related work</p>
                <h2 className="mt-3 text-h2">{n.relatedHeading}</h2>
                {n.relatedLead && <p className="mt-3 text-body-lg text-text-muted">{n.relatedLead}</p>}
              </div>
            </Reveal>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {related.map((w, i) => (
                <Reveal key={w.id} delay={i * 60} className="min-w-0">
                  <Link
                    href={`/work/${slugify(w.title)}`}
                    className="group block h-full overflow-hidden rounded-token border border-border bg-card shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-out-soft hover:-translate-y-1 hover:border-brand-blue hover:shadow-lift"
                  >
                    <div className="grid aspect-[16/10] place-items-center bg-bg-tint-2 text-brand-sky">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18" />
                      </svg>
                    </div>
                    <div className="p-6">
                      <span className="rounded-full border border-border bg-bg-tint px-2.5 py-1 text-overline font-semibold text-text-muted">
                        {w.category}
                      </span>
                      <h3 className="mt-3 text-h3">{w.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm text-text-muted">{w.description}</p>
                      <p className="mt-4 text-sm font-semibold text-brand-blue">
                        Read the case study &rarr;
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== FAQ */}
      {n && (
        <section className="bg-bg-tint py-24">
          <div className="mx-auto max-w-3xl px-6">
            <Reveal>
              <p className="text-overline uppercase text-brand-blue">FAQ</p>
              <h2 className="mt-3 text-h2">Questions we get asked first</h2>
            </Reveal>

            <div className="mt-10 grid gap-4">
              {n.faq.map((f, i) => (
                <Reveal key={f.q} delay={i * 60} className="min-w-0">
                  <div className="rounded-token border border-border bg-card p-8 shadow-card">
                    <h3 className="text-h3">{f.q}</h3>
                    <p className="mt-3 text-text-muted">{f.a}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= CTA band */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="rounded-token bg-hero-gradient p-12 text-center text-white">
              <h2 className="text-h2 text-white">
                {n?.ctaHeading ?? 'Tell us what you’re trying to build'}
              </h2>
              {n && (
                <p className="mx-auto mt-3 max-w-[60ch] text-body-lg text-white/85">{n.ctaBody}</p>
              )}
              <Link
                href="/contact"
                className="mt-6 inline-block rounded-token bg-white px-5 py-3 font-semibold text-brand-navy transition-colors hover:bg-bg-tint"
              >
                Start a Project
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
