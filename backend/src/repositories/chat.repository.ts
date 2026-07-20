import { prisma } from '../lib/prisma.js';

/** The user fields the chat UI needs — never the password/email. */
const userSelect = { id: true, name: true, role: true, avatarUrl: true } as const;

const withMembers = {
  members: { include: { user: { select: userSelect } } },
} as const;

export const chatRepository = {
  /** Everyone but the caller — the DM target directory. */
  listContacts(excludeUserId: string) {
    return prisma.user.findMany({
      where: { id: { not: excludeUserId } },
      select: userSelect,
      orderBy: { name: 'asc' },
    });
  },

  /** Conversations the user belongs to, most-recently-active first, with members + last message. */
  listForUser(userId: string) {
    return prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: {
        ...withMembers,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: userSelect } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  findMembership(conversationId: string, userId: string) {
    return prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
  },

  findById(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: withMembers,
    });
  },

  /** The one-to-one DM between exactly these two users, if it exists. */
  async findDm(a: string, b: string) {
    const candidates = await prisma.conversation.findMany({
      where: {
        type: 'dm',
        AND: [{ members: { some: { userId: a } } }, { members: { some: { userId: b } } }],
      },
      include: { ...withMembers, _count: { select: { members: true } } },
    });
    return candidates.find((c) => c._count.members === 2) ?? null;
  },

  createDm(a: string, b: string) {
    return prisma.conversation.create({
      data: { type: 'dm', members: { create: [{ userId: a }, { userId: b }] } },
      include: withMembers,
    });
  },

  findProjectChannel(projectId: string) {
    return prisma.conversation.findFirst({
      where: { type: 'channel', projectId },
      include: withMembers,
    });
  },

  createProjectChannel(projectId: string, name: string, userId: string) {
    return prisma.conversation.create({
      data: { type: 'channel', projectId, name, members: { create: [{ userId }] } },
      include: withMembers,
    });
  },

  async addMember(conversationId: string, userId: string) {
    await prisma.conversationMember.create({ data: { conversationId, userId } });
    return this.findById(conversationId);
  },

  /** A keyset page of messages, oldest→newest, optionally before a cursor message. */
  async listMessages(conversationId: string, before: string | undefined, limit: number) {
    let cursor: { createdAt: Date; id: string } | null = null;
    if (before) {
      cursor = await prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true, id: true },
      });
    }
    const rows = await prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      include: { sender: { select: userSelect } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1, // one extra tells us whether an older page exists
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { messages: page.reverse(), nextBefore: hasMore ? page[0]?.id ?? null : null };
  },

  /** READY attachments for a set of messages, keyed later by messageId. */
  attachmentsForMessages(messageIds: string[]) {
    return prisma.attachment.findMany({
      where: { messageId: { in: messageIds }, status: 'READY' },
      select: { messageId: true, key: true, filename: true, mimeType: true, size: true },
    });
  },

  findMessageByNonce(conversationId: string, clientNonce: string) {
    return prisma.message.findUnique({
      where: { conversationId_clientNonce: { conversationId, clientNonce } },
      include: { sender: { select: userSelect } },
    });
  },

  async createMessage(input: {
    conversationId: string;
    senderId: string;
    body: string;
    clientNonce: string | null;
  }) {
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: input,
        include: { sender: { select: userSelect } },
      }),
      // Bump the conversation so it sorts to the top of everyone's list.
      prisma.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  },

  markRead(conversationId: string, userId: string) {
    return prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  },

  /** Messages in the conversation the user hasn't seen (after lastReadAt, not their own). */
  countUnread(conversationId: string, userId: string, lastReadAt: Date | null) {
    return prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });
  },
};
