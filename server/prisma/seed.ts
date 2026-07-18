/**
 * Seeds the content models with REAL copy taken from haizotech.com.
 *
 * Two rules this script exists to enforce:
 *   1. Nothing here is invented. Every service description is the live site's own
 *      wording. Where a fact wasn't available (a timeline, a price) the field is
 *      left null rather than filled with something plausible.
 *   2. Testimonials seed as UNPUBLISHED unless they carry provenance. The one real
 *      quote we have is from Sri ASK Residency; the fabricated "Sarah Chen" and
 *      "Michael Chang" quotes on the live site are deliberately not carried over.
 *
 * Idempotent — upserts by slug, so re-running is safe.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SERVICES = [
  {
    slug: 'custom-software-development',
    title: 'Custom Software Development',
    summary:
      'End-to-end development of bespoke software solutions designed to streamline operations, enhance productivity, and drive digital transformation.',
    deliverables: [
      '100% IP Ownership',
      'No Vendor Lock-in',
      'Perfectly aligned with your workflows',
      'Scalable microservices architecture',
    ],
    stack: [] as string[],
    icon: 'code',
    order: 1,
  },
  {
    slug: 'web-mobile-application-development',
    title: 'Web & Mobile Application Development',
    summary:
      'Creating intuitive, fast-loading web and mobile applications with cutting-edge technologies for exceptional user experiences.',
    deliverables: [
      'Sub-second page loads',
      'Cross-platform consistency',
      'High conversion UI/UX',
      'SEO-optimized architectures',
    ],
    stack: ['React', 'Next.js', 'React Native'],
    icon: 'smartphone',
    order: 2,
  },
  {
    slug: 'ai-systems-integrations',
    title: 'AI Systems & Integrations',
    summary:
      'Leveraging artificial intelligence capabilities including RAG pipelines, multi-agent orchestration, and LLM integrations.',
    deliverables: [
      'Automated complex reasoning',
      'Secure on-premise AI deployments',
      'Drastic reduction in manual overhead',
      'Data-driven predictive modeling',
    ],
    stack: ['RAG pipelines', 'Multi-agent orchestration', 'LLM integrations'],
    icon: 'brain',
    order: 3,
  },
  {
    slug: 'network-services-it-solutions',
    title: 'Network Services & IT Solutions',
    summary:
      'Designing and implementing robust network infrastructure, cloud strategies, and scalable IT architectures.',
    deliverables: [
      '99.99% Uptime guarantees',
      'Zero-Trust security posture',
      'Automated CI/CD pipelines',
      'Disaster recovery & redundancy',
    ],
    stack: ['Kubernetes', 'Infrastructure-as-Code'],
    icon: 'shield',
    order: 4,
  },
];

const INDUSTRIES = [
  { slug: 'healthcare', name: 'Healthcare', capability: 'Patient-facing systems with role-based access, audit trails and careful data handling.', order: 1 },
  { slug: 'fintech', name: 'FinTech', capability: 'UPI and Razorpay integrations, reconciliation flows, and ledgers that survive an audit.', order: 2 },
  { slug: 'education', name: 'Education', capability: 'Attendance, fees, timetables and parent access — multi-tenant from the first line.', order: 3 },
  { slug: 'hospitality', name: 'Hospitality', capability: 'Room and venue booking with live availability, pricing rules and reporting.', order: 4 },
  { slug: 'logistics', name: 'Logistics', capability: 'Dispatch and tracking dashboards that stay accurate under load.', order: 5 },
  { slug: 'cloud-internal-tooling', name: 'Cloud & internal tooling', capability: 'Control planes with cost and access visibility across providers.', order: 6 },
];

async function main() {
  for (const s of SERVICES) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: { ...s, published: true, publishedAt: new Date() },
      create: { ...s, published: true, publishedAt: new Date() },
    });
  }
  console.log(`✓ ${SERVICES.length} services`);

  for (const i of INDUSTRIES) {
    await prisma.industry.upsert({
      where: { slug: i.slug },
      update: i,
      create: i,
    });
  }
  console.log(`✓ ${INDUSTRIES.length} industries`);

  // The one testimonial we can actually attribute. `sourceUrl` and `verifiedAt`
  // are left NULL on purpose: it is quoted from the live site, but nobody has
  // confirmed where it originally came from. Because publishing requires both
  // fields, it stays a draft until someone does that work — which is exactly the
  // behaviour we want.
  const existing = await prisma.testimonial.findFirst({ where: { author: 'Nivethitha' } });
  if (!existing) {
    await prisma.testimonial.create({
      data: {
        author: 'Nivethitha',
        role: 'Owner',
        company: 'Sri ASK Residency',
        quote:
          'Haizo Tech delivered a modern platform that scaled from day one. Their team is responsive, thoughtful, and deeply technical.',
        published: false,
        order: 1,
      },
    });
  }
  console.log('✓ 1 testimonial (unpublished — needs sourceUrl + verifiedAt)');

  const fabricated = await prisma.testimonial.count({
    where: { author: { in: ['Sarah Chen', 'Michael Chang'] } },
  });
  console.log(
    fabricated === 0
      ? '✓ fabricated testimonials not carried over'
      : `✗ ${fabricated} fabricated testimonials present — remove them`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
