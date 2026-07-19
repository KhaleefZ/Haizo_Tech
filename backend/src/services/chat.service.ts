import type {
  ChatContactList,
  ChatConversation,
  ChatConversationList,
  ChatMessage,
  ChatMessagePage,
  OpenConversation,
} from '@haizo/types';
import { Prisma } from '@prisma/client';
import { chatRepository } from '../repositories/chat.repository.js';
import { prisma } from '../lib/prisma.js';
import { forbidden, notFound, validationFailed } from '../lib/errors.js';
import { emitToConversation, joinUserToConversation } from '../sockets/io.js';

type MemberWithUser = { user: { id: string; name: string; role: string; avatarUrl: string | null } };
type MessageRow = {
  id: string;
  conversationId: string;
  body: string;
  clientNonce: string | null;
  createdAt: Date;
  sender: { id: string; name: string; role: string; avatarUrl: string | null };
};

function toChatMessage(m: MessageRow): ChatMessage {
  return {
    id: m.id,
    conversationId: m.conversationId,
    body: m.body,
    clientNonce: m.clientNonce,
    createdAt: m.createdAt.toISOString(),
    sender: {
      id: m.sender.id,
      name: m.sender.name,
      role: m.sender.role,
      avatarUrl: m.sender.avatarUrl,
    },
  };
}

/** A DM's title is the OTHER member's name; a channel's is its own name. */
function titleFor(
  conv: { type: string; name: string | null; members: MemberWithUser[] },
  viewerId: string,
): string {
  if (conv.type === 'channel') return conv.name ?? 'Channel';
  const other = conv.members.find((m) => m.user.id !== viewerId) ?? conv.members[0];
  return other?.user.name ?? 'Direct message';
}

export const chatService = {
  async listContacts(userId: string): Promise<ChatContactList> {
    const users = await chatRepository.listContacts(userId);
    return {
      data: users.map((u) => ({ id: u.id, name: u.name, role: u.role, avatarUrl: u.avatarUrl })),
    };
  },

  async listConversations(userId: string): Promise<ChatConversationList> {
    const rows = await chatRepository.listForUser(userId);
    const data: ChatConversation[] = await Promise.all(
      rows.map(async (c) => {
        const membership = c.members.find((m) => m.user.id === userId);
        const unreadCount = await chatRepository.countUnread(c.id, userId, membership?.lastReadAt ?? null);
        const last = c.messages[0];
        const conv: ChatConversation = {
          id: c.id,
          type: c.type,
          title: titleFor(c, userId),
          projectId: c.projectId,
          members: c.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            role: m.user.role,
            avatarUrl: m.user.avatarUrl,
          })),
          unreadCount,
          updatedAt: c.updatedAt.toISOString(),
        };
        // Omit (rather than null) when the conversation has no messages yet.
        if (last) conv.lastMessage = toChatMessage(last);
        return conv;
      }),
    );
    return { data };
  },

  async open(input: OpenConversation, userId: string): Promise<ChatConversation> {
    const hasUser = Boolean(input.userId);
    const hasProject = Boolean(input.projectId);
    if (hasUser === hasProject) {
      throw validationFailed([{ path: 'userId', message: 'Provide exactly one of userId or projectId' }]);
    }

    let conv;
    if (input.userId) {
      if (input.userId === userId) {
        throw validationFailed([{ path: 'userId', message: 'You cannot DM yourself' }]);
      }
      const other = await prisma.user.findUnique({ where: { id: input.userId } });
      if (!other) throw notFound('User');
      conv = (await chatRepository.findDm(userId, input.userId)) ?? (await chatRepository.createDm(userId, input.userId));
    } else {
      const project = await prisma.project.findUnique({ where: { id: input.projectId! } });
      if (!project) throw notFound('Project');
      const existing = await chatRepository.findProjectChannel(project.id);
      if (!existing) {
        conv = await chatRepository.createProjectChannel(project.id, project.name, userId);
      } else if (!existing.members.some((m) => m.user.id === userId)) {
        conv = (await chatRepository.addMember(existing.id, userId)) ?? existing;
      } else {
        conv = existing;
      }
    }

    // Make sure the caller's live sockets are in the room right away.
    joinUserToConversation(userId, conv.id);

    return {
      id: conv.id,
      type: conv.type,
      title: titleFor(conv, userId),
      projectId: conv.projectId,
      members: conv.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        role: m.user.role,
        avatarUrl: m.user.avatarUrl,
      })),
      unreadCount: 0,
      updatedAt: conv.updatedAt.toISOString(),
    };
  },

  /** Confirms membership, then throws 403 if the caller isn't in the conversation. */
  async assertMember(conversationId: string, userId: string) {
    const conv = await chatRepository.findById(conversationId);
    if (!conv) throw notFound('Conversation');
    if (!conv.members.some((m) => m.user.id === userId)) throw forbidden('You are not in this conversation');
    return conv;
  },

  async listMessages(
    conversationId: string,
    userId: string,
    before: string | undefined,
    limit: number,
  ): Promise<ChatMessagePage> {
    await this.assertMember(conversationId, userId);
    const { messages, nextBefore } = await chatRepository.listMessages(conversationId, before, limit);
    return { data: messages.map(toChatMessage), nextBefore };
  },

  async postMessage(
    conversationId: string,
    userId: string,
    body: string,
    clientNonce: string | null,
  ): Promise<ChatMessage> {
    await this.assertMember(conversationId, userId);

    // Idempotency: a resend after a dropped ack returns the original message.
    if (clientNonce) {
      const existing = await chatRepository.findMessageByNonce(conversationId, clientNonce);
      if (existing) return toChatMessage(existing);
    }

    let row;
    try {
      row = await chatRepository.createMessage({ conversationId, senderId: userId, body, clientNonce });
    } catch (err) {
      // Lost a race with a concurrent resend of the same nonce — return the winner
      // instead of surfacing the unique-constraint error, keeping the send idempotent.
      if (clientNonce && err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existing = await chatRepository.findMessageByNonce(conversationId, clientNonce);
        if (existing) return toChatMessage(existing);
      }
      throw err;
    }
    const message = toChatMessage(row);
    emitToConversation(conversationId, 'chat:message', message);
    return message;
  },
};
