import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const WITH_COUNT = { _count: { select: { projects: true } } } as const;

export const clientRepository = {
  listClients({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.client.findMany({ orderBy: { createdAt: 'desc' }, skip, take, include: WITH_COUNT }),
      prisma.client.count(),
    ]);
  },

  findClientById(id: string) {
    return prisma.client.findUnique({ where: { id }, include: WITH_COUNT });
  },

  createClient(data: Prisma.ClientCreateInput) {
    return prisma.client.create({ data, include: WITH_COUNT });
  },

  updateClient(id: string, data: Prisma.ClientUpdateInput) {
    return prisma.client.update({ where: { id }, data, include: WITH_COUNT });
  },

  deleteClient(id: string) {
    return prisma.client.delete({ where: { id } });
  },
};
