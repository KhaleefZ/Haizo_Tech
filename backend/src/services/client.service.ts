import { Prisma } from '@prisma/client';
import type { AdminClient, AdminClientList, CreateClient, UpdateClient } from '@haizo/types';
import { clientRepository } from '../repositories/client.repository.js';
import { conflict, notFound } from '../lib/errors.js';

type ClientRow = NonNullable<Awaited<ReturnType<typeof clientRepository.findClientById>>>;

function toAdminClient(row: ClientRow): AdminClient {
  return {
    id: row.id,
    organization: row.organization,
    contactName: row.contactName,
    email: row.email,
    projectCount: row._count.projects,
    createdAt: row.createdAt.toISOString(),
  };
}

export const clientService = {
  async listClients(page: number, pageSize: number): Promise<AdminClientList> {
    const [rows, total] = await clientRepository.listClients({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map(toAdminClient),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  async getClient(id: string): Promise<AdminClient> {
    const row = await clientRepository.findClientById(id);
    if (!row) throw notFound('Client');
    return toAdminClient(row);
  },

  async createClient(input: CreateClient): Promise<AdminClient> {
    const row = await clientRepository.createClient({
      organization: input.organization,
      contactName: input.contactName,
      email: input.email ?? null,
    });
    return toAdminClient(row);
  },

  async updateClient(id: string, input: UpdateClient): Promise<AdminClient> {
    const existing = await clientRepository.findClientById(id);
    if (!existing) throw notFound('Client');
    const row = await clientRepository.updateClient(id, {
      ...(input.organization !== undefined ? { organization: input.organization } : {}),
      ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
    });
    return toAdminClient(row);
  },

  async deleteClient(id: string): Promise<void> {
    try {
      await clientRepository.deleteClient(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') throw notFound('Client');
        // A FK restriction means projects still reference this client.
        if (err.code === 'P2003') throw conflict('Reassign or remove this client’s projects first');
      }
      throw err;
    }
  },
};
