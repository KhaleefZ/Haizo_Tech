/**
 * Team-management reads/writes. Selects a fixed column set that never includes
 * the password hash — the hash only ever leaves the DB on the login path.
 */
import type { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
} as const;

export const userRepository = {
  listUsers() {
    return prisma.user.findMany({ select: USER_SELECT, orderBy: { createdAt: 'asc' } });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  },

  updateRole(id: string, role: Role) {
    return prisma.user.update({ where: { id }, data: { role }, select: USER_SELECT });
  },
};
