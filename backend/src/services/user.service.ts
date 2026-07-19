import { Prisma } from '@prisma/client';
import type { Role } from '@prisma/client';
import type { AdminUser, AdminUserList } from '@haizo/types';
import { userRepository } from '../repositories/user.repository.js';
import { forbidden, notFound } from '../lib/errors.js';

type UserRow = NonNullable<Awaited<ReturnType<typeof userRepository.findUserById>>>;

function toAdminUser(row: UserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

export const userService = {
  async listUsers(): Promise<AdminUserList> {
    const rows = await userRepository.listUsers();
    return { data: rows.map(toAdminUser) };
  },

  async updateRole(id: string, role: Role, actingUserId: string): Promise<AdminUser> {
    // Self-demotion is the classic way to lock everyone out of user management.
    if (id === actingUserId) {
      throw forbidden('You cannot change your own role');
    }
    try {
      const row = await userRepository.updateRole(id, role);
      return toAdminUser(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('User');
      }
      throw err;
    }
  },
};
