/**
 * Digest pipeline test. The SMTP transport is mocked (isMailConfigured→true,
 * sendMail captured), so this exercises the real selection + composition + the
 * emailedAt stamping without needing credentials or a network.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/mailer.js', () => ({
  isMailConfigured: () => true,
  sendMail: vi.fn(async () => ({ sent: true })),
}));

import { runDigest } from '../jobs/digest.js';
import { sendMail } from '../lib/mailer.js';
import { prisma } from '../lib/prisma.js';

const EMAIL = 'p5-digest@test.local';
let userId = '';
let notifId = '';

beforeAll(async () => {
  const u = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { notificationsEnabled: true, name: 'Digest User' },
    create: { email: EMAIL, name: 'Digest User', role: 'DEV', password: 'x', notificationsEnabled: true },
  });
  userId = u.id;
  const n = await prisma.notification.create({
    data: {
      userId,
      type: 'inquiry.received',
      title: 'New enquiry',
      message: 'Someone sent an enquiry',
      url: '/inquiries',
      isRead: false,
    },
  });
  notifId = n.id;
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await prisma.$disconnect();
});

describe('notification digest', () => {
  it('emails a user their unread notifications and stamps emailedAt', async () => {
    const res = await runDigest();
    expect(res.usersEmailed).toBeGreaterThanOrEqual(1);

    // Our user got an email whose body contains the notification.
    const calls = (sendMail as unknown as { mock: { calls: Array<[{ to: string; html: string }]> } }).mock.calls;
    const toUs = calls.find((c) => c[0].to === EMAIL);
    expect(toUs).toBeTruthy();
    expect(toUs![0].html).toContain('New enquiry');

    // The notification is now stamped, so a second run won't re-send it.
    const after = await prisma.notification.findUnique({ where: { id: notifId } });
    expect(after?.emailedAt).not.toBeNull();

    const second = await runDigest();
    const oursSecond = (sendMail as unknown as { mock: { calls: Array<[{ to: string }]> } }).mock.calls.filter(
      (c) => c[0].to === EMAIL,
    ).length;
    // Still only the one email to us — the stamped notification isn't repeated.
    expect(oursSecond).toBe(1);
    expect(second).toBeTruthy();
  });
});
