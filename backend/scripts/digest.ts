/**
 * Run the notification digest once, on demand: `pnpm digest`.
 * Useful for verifying the email pipeline without waiting for the 08:00 cron.
 */
import { runDigest } from '../src/jobs/digest.js';
import { prisma } from '../src/lib/prisma.js';

runDigest()
  .then((r) => console.log('digest complete:', r))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
