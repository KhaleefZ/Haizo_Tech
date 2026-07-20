import type {
  ChatAttachment,
  ChatContactList,
  ChatConversation,
  ChatConversationList,
  ChatMessage,
  ChatMessagePage,
  ChatRead,
  OpenConversation,
} from '@haizo/types';
import { Prisma } from '@prisma/client';
import { chatRepository } from '../repositories/chat.repository.js';
import { uploadRepository } from '../repositories/upload.repository.js';
import { prisma } from '../lib/prisma.js';
import { publicUrl } from '../lib/storage.js';
import { forbidden, notFound, validationFailed } from '../lib/errors.js';
import { emitToConversation, joinUserToConversation } from '../sockets/io.js';
import { notificationService } from './notification.service.js';

const MENTION_RE = /@([a-zA-Z0-9_]+)/g;

/** Resolve @tokens in a message to member ids (matching name parts), minus the sender. */
function resolveMentions(body: string, members: MemberWithUser[], excludeId: string): string[] {
  const tokens = new Set([...body.matchAll(MENTION_RE)].map((m) => m[1]!.toLowerCase()));
  if (tokens.size === 0) return [];
  const ids = new Set<string>();
  for (const m of members) {
    if (m.user.id === excludeId) continue;
    const name = m.user.name.toLowerCase();
    const parts = name.split(/\s+/).filter(Boolean);
    const nospace = name.replace(/\s+/g, '');
    if ([...tokens].some((t) => t === nospace || parts.includes(t))) ids.add(m.user.id);
  }
  return [...ids];
}

type MemberWithUser = {
  lastReadAt: Date | null;
  user: { id: string; name: string; role: string; avatarUrl: string | null };
};

const toReads = (members: MemberWithUser[]): ChatRead[] =>
  members.map((m) => ({ userId: m.user.id, lastReadAt: m.lastReadAt?.toISOString() ?? null }));
type MessageRow = {
  id: string;
  conversationId: string;
  body: string;
  clientNonce: string | null;
  createdAt: Date;
  sender: { id: string; name: string; role: string; avatarUrl: string | null };
};

function toAttachment(a: { key: string; filename: string; mimeType: string; size: number }): ChatAttachment {
  return { url: publicUrl(a.key), filename: a.filename, mimeType: a.mimeType, size: a.size };
}

function toChatMessage(m: MessageRow, attachment?: ChatAttachment): ChatMessage {
  const msg: ChatMessage = {
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
  if (attachment) msg.attachment = attachment;
  return msg;
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
          reads: toReads(c.members),
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
      reads: toReads(conv.members),
      unreadCount: 0,
      updatedAt: conv.updatedAt.toISOString(),
    };
  },

  async markRead(conversationId: string, userId: string): Promise<ChatRead> {
    await this.assertMember(conversationId, userId);
    const member = await chatRepository.markRead(conversationId, userId);
    const receipt: ChatRead = { userId, lastReadAt: member.lastReadAt?.toISOString() ?? null };
    // Let the other members' clients advance their read receipts.
    emitToConversation(conversationId, 'chat:read', { conversationId, ...receipt });
    return receipt;
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
    const atts = await chatRepository.attachmentsForMessages(messages.map((m) => m.id));
    const byMsg = new Map(atts.map((a) => [a.messageId, toAttachment(a)]));
    return { data: messages.map((m) => toChatMessage(m, byMsg.get(m.id))), nextBefore };
  },

  /** Rebuild a message DTO including its attachment (used on idempotent resends). */
  async messageWithAttachment(row: MessageRow): Promise<ChatMessage> {
    const [a] = await chatRepository.attachmentsForMessages([row.id]);
    return toChatMessage(row, a ? toAttachment(a) : undefined);
  },

  async postMessage(
    conversationId: string,
    userId: string,
    body: string,
    clientNonce: string | null,
    attachmentId?: string | null,
  ): Promise<ChatMessage> {
    const conv = await this.assertMember(conversationId, userId);

    if (!body.trim() && !attachmentId) {
      throw validationFailed([{ path: 'body', message: 'A message needs text or a file' }]);
    }

    // Validate the attachment: it must be the caller's own completed upload, not
    // already bound to another message.
    let attachment: ChatAttachment | undefined;
    if (attachmentId) {
      const att = await uploadRepository.findById(attachmentId);
      if (!att || att.status !== 'READY' || att.uploadedById !== userId || att.messageId) {
        throw validationFailed([{ path: 'attachmentId', message: 'Invalid or already-used attachment' }]);
      }
      attachment = toAttachment(att);
    }

    // Idempotency: a resend after a dropped ack returns the original message.
    if (clientNonce) {
      const existing = await chatRepository.findMessageByNonce(conversationId, clientNonce);
      if (existing) return this.messageWithAttachment(existing);
    }

    let row;
    try {
      row = await chatRepository.createMessage({ conversationId, senderId: userId, body, clientNonce });
    } catch (err) {
      // Lost a race with a concurrent resend of the same nonce — return the winner
      // instead of surfacing the unique-constraint error, keeping the send idempotent.
      if (clientNonce && err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existing = await chatRepository.findMessageByNonce(conversationId, clientNonce);
        if (existing) return this.messageWithAttachment(existing);
      }
      throw err;
    }

    if (attachmentId) await uploadRepository.attachToMessage(attachmentId, row.id);
    const message = toChatMessage(row, attachment);
    emitToConversation(conversationId, 'chat:message', message);

    // Notify anyone @mentioned (best-effort; never blocks the send).
    const mentioned = resolveMentions(body, conv.members, userId);
    if (mentioned.length) {
      void notificationService.emit({
        type: 'chat.mention',
        recipientIds: mentioned,
        actorId: userId,
        entity: { type: 'conversation', id: conversationId },
        params: {
          actorName: row.sender.name,
          conversation: conv.type === 'channel' ? `#${conv.name ?? 'channel'}` : undefined,
        },
      });
    }
    return message;
  },
};
