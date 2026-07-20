/**
 * Unanswered-support sweep.
 *
 * A visitor can ask a question when no agent is around and then close the tab. So
 * nothing is lost, this periodically turns OPEN sessions that got a visitor message
 * but no staff reply (and have gone quiet) into an Inquiry — the same durable,
 * assignable record the contact form produces — and stamps the session so it's
 * never spilled twice.
 */
import { prisma } from '../lib/prisma.js';
import { supportRepository } from '../repositories/support.repository.js';
import { logger } from '../lib/logger.js';
import { emitToSupportAgents } from '../sockets/io.js';

const IDLE_MINUTES = 15;

export async function runSupportSweep(idleMinutes = IDLE_MINUTES): Promise<number> {
  const idleBefore = new Date(Date.now() - idleMinutes * 60_000);
  const sessions = await supportRepository.findUnanswered(idleBefore);
  let spilled = 0;

  for (const session of sessions) {
    try {
      const transcript = session.messages.map((m) => m.body).join('\n');
      const inquiry = await prisma.inquiry.create({
        data: {
          name: session.visitor.name || 'Website visitor',
          // The Inquiry needs an address; use the visitor's if given, else a clearly
          // internal placeholder so staff know there's no reply-to.
          email: session.visitor.email || `noreply+${session.visitor.id}@haizotech.local`,
          message: `[Unanswered support chat]\n\n${transcript}`,
          status: 'NEW',
        },
      });
      await supportRepository.markSpilled(session.id, inquiry.id);
      spilled += 1;
    } catch (err) {
      logger.error({ err, sessionId: session.id }, 'support sweep: failed to spill session');
    }
  }

  if (spilled > 0) {
    emitToSupportAgents('support:session-updated', { swept: spilled });
    logger.info({ spilled }, 'support sweep: spilled unanswered sessions to inquiries');
  }
  return spilled;
}
