import { prisma } from '../lib/prisma.js';

const staffSelect = { id: true, name: true } as const;
const sessionInclude = {
  visitor: true,
  assignee: { select: staffSelect },
} as const;

export const supportRepository = {
  createSession(input: { name?: string | null; email?: string | null; subject?: string | null }) {
    return prisma.supportSession.create({
      data: {
        subject: input.subject ?? null,
        visitor: { create: { name: input.name ?? null, email: input.email ?? null } },
      },
      include: sessionInclude,
    });
  },

  findSession(id: string) {
    return prisma.supportSession.findUnique({ where: { id }, include: sessionInclude });
  },

  listSessions(status?: string) {
    return prisma.supportSession.findMany({
      where: status ? { status } : {},
      include: {
        ...sessionInclude,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { staff: { select: staffSelect } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  },

  listMessages(sessionId: string) {
    return prisma.supportMessage.findMany({
      where: { sessionId },
      include: { staff: { select: staffSelect } },
      orderBy: { createdAt: 'asc' },
      take: 300,
    });
  },

  findMessageByNonce(sessionId: string, clientNonce: string) {
    return prisma.supportMessage.findUnique({
      where: { sessionId_clientNonce: { sessionId, clientNonce } },
      include: { staff: { select: staffSelect } },
    });
  },

  async createMessage(input: {
    sessionId: string;
    staffId: string | null;
    body: string;
    clientNonce: string | null;
    sessionStatus?: string;
  }) {
    const [message] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          sessionId: input.sessionId,
          staffId: input.staffId,
          body: input.body,
          clientNonce: input.clientNonce,
        },
        include: { staff: { select: staffSelect } },
      }),
      prisma.supportSession.update({
        where: { id: input.sessionId },
        data: { updatedAt: new Date(), ...(input.sessionStatus ? { status: input.sessionStatus } : {}) },
      }),
    ]);
    return message;
  },

  updateSession(id: string, data: { status?: string; assigneeId?: string | null }) {
    return prisma.supportSession.update({ where: { id }, data, include: sessionInclude });
  },

  markStaffRead(id: string) {
    return prisma.supportSession.update({ where: { id }, data: { lastStaffReadAt: new Date() } });
  },

  /** Visitor messages the staff side hasn't seen. */
  countUnreadForStaff(sessionId: string, lastStaffReadAt: Date | null) {
    return prisma.supportMessage.count({
      where: { sessionId, staffId: null, ...(lastStaffReadAt ? { createdAt: { gt: lastStaffReadAt } } : {}) },
    });
  },
};
