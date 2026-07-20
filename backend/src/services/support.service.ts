import type {
  AdminSupportSession,
  AdminSupportSessionDetail,
  AdminSupportSessionList,
  StartSupport,
  SupportAvailability,
  SupportMessage,
  SupportStart,
  SupportThread,
  UpdateSupportSession,
} from '@haizo/types';
import { Prisma } from '@prisma/client';
import { supportRepository } from '../repositories/support.repository.js';
import { prisma } from '../lib/prisma.js';
import { signVisitorToken } from '../lib/auth/visitorTokens.js';
import { notFound, validationFailed } from '../lib/errors.js';
import { emitSupportMessage, emitToSupportAgents } from '../sockets/io.js';
import { onlineUserIds } from '../sockets/presence.js';

type MessageRow = {
  id: string;
  sessionId: string;
  body: string;
  staffId: string | null;
  clientNonce: string | null;
  createdAt: Date;
  staff: { id: string; name: string } | null;
};

type SessionRow = {
  id: string;
  status: string;
  subject: string | null;
  lastStaffReadAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  visitor: { id: string; name: string | null; email: string | null };
  assignee: { id: string; name: string } | null;
};

function toSupportMessage(m: MessageRow): SupportMessage {
  return {
    id: m.id,
    sessionId: m.sessionId,
    body: m.body,
    from: m.staffId ? 'staff' : 'visitor',
    staffName: m.staff?.name ?? null,
    clientNonce: m.clientNonce,
    createdAt: m.createdAt.toISOString(),
  };
}

function toAdminSession(
  s: SessionRow,
  unreadCount: number,
  lastMessage?: MessageRow,
): AdminSupportSession {
  const dto: AdminSupportSession = {
    id: s.id,
    status: s.status,
    subject: s.subject,
    visitor: { id: s.visitor.id, name: s.visitor.name, email: s.visitor.email },
    unreadCount,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
  if (s.assignee) dto.assignee = { id: s.assignee.id, name: s.assignee.name };
  if (lastMessage) dto.lastMessage = toSupportMessage(lastMessage);
  return dto;
}

export const supportService = {
  availability(): SupportAvailability {
    // Live chat is "online" when at least one staff member has a socket connected.
    return { online: onlineUserIds().length > 0 };
  },

  async start(input: StartSupport): Promise<SupportStart> {
    const subject = input.message ? input.message.slice(0, 80) : undefined;
    const session = await supportRepository.createSession({
      name: input.name,
      email: input.email,
      subject,
    });
    const token = signVisitorToken({ sub: session.visitor.id, sid: session.id });

    const messages: SupportMessage[] = [];
    if (input.message?.trim()) {
      const row = await supportRepository.createMessage({
        sessionId: session.id,
        staffId: null,
        body: input.message.trim(),
        clientNonce: null,
        sessionStatus: 'OPEN',
      });
      messages.push(toSupportMessage(row));
    }

    // Tell staff a new conversation just arrived.
    emitToSupportAgents('support:new', { sessionId: session.id });

    return { token, sessionId: session.id, status: session.status, messages };
  },

  async thread(sessionId: string): Promise<SupportThread> {
    const session = await supportRepository.findSession(sessionId);
    if (!session) throw notFound('Support session');
    const messages = await supportRepository.listMessages(sessionId);
    return { sessionId, status: session.status, messages: messages.map(toSupportMessage) };
  },

  async postVisitorMessage(
    sessionId: string,
    body: string,
    clientNonce: string | null,
  ): Promise<SupportMessage> {
    const session = await supportRepository.findSession(sessionId);
    if (!session) throw notFound('Support session');
    if (!body.trim()) throw validationFailed([{ path: 'body', message: 'Message cannot be empty' }]);

    const message = await this.persistMessage(sessionId, null, body, clientNonce, 'OPEN');
    return message;
  },

  async listSessions(status: string | undefined): Promise<AdminSupportSessionList> {
    const rows = await supportRepository.listSessions(status);
    const data = await Promise.all(
      rows.map(async (s) => {
        const unread = await supportRepository.countUnreadForStaff(s.id, s.lastStaffReadAt);
        return toAdminSession(s, unread, s.messages[0]);
      }),
    );
    return { data };
  },

  async getSession(id: string): Promise<AdminSupportSessionDetail> {
    const session = await supportRepository.findSession(id);
    if (!session) throw notFound('Support session');
    const messages = await supportRepository.listMessages(id);
    // Opening it marks the visitor's messages read from the staff side.
    await supportRepository.markStaffRead(id);
    return { session: toAdminSession(session, 0), messages: messages.map(toSupportMessage) };
  },

  async reply(
    sessionId: string,
    staffId: string,
    body: string,
    clientNonce: string | null,
  ): Promise<SupportMessage> {
    const session = await supportRepository.findSession(sessionId);
    if (!session) throw notFound('Support session');
    if (!body.trim()) throw validationFailed([{ path: 'body', message: 'Message cannot be empty' }]);
    // A staff reply moves the session to "waiting on the visitor".
    return this.persistMessage(sessionId, staffId, body, clientNonce, 'PENDING');
  },

  async updateSession(id: string, input: UpdateSupportSession): Promise<AdminSupportSession> {
    const session = await supportRepository.findSession(id);
    if (!session) throw notFound('Support session');
    if (input.assigneeId) {
      const staff = await prisma.user.findUnique({ where: { id: input.assigneeId } });
      if (!staff) throw notFound('Staff member');
    }
    const updated = await supportRepository.updateSession(id, {
      ...(input.status ? { status: input.status } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    });
    const dto = toAdminSession(updated, 0);
    emitToSupportAgents('support:session-updated', { sessionId: id });
    return dto;
  },

  /** Shared create path: nonce dedupe (with P2002 race fallback) + realtime emit. */
  async persistMessage(
    sessionId: string,
    staffId: string | null,
    body: string,
    clientNonce: string | null,
    sessionStatus: string,
  ): Promise<SupportMessage> {
    if (clientNonce) {
      const existing = await supportRepository.findMessageByNonce(sessionId, clientNonce);
      if (existing) return toSupportMessage(existing);
    }
    let row;
    try {
      row = await supportRepository.createMessage({ sessionId, staffId, body: body.trim(), clientNonce, sessionStatus });
    } catch (err) {
      if (clientNonce && err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existing = await supportRepository.findMessageByNonce(sessionId, clientNonce);
        if (existing) return toSupportMessage(existing);
      }
      throw err;
    }
    const message = toSupportMessage(row);
    emitSupportMessage(sessionId, 'support:message', message);
    return message;
  },
};
