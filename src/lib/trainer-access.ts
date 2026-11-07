import { Prisma, UserRole } from '@prisma/client';
import { prisma } from './db';

export const eligibleTrainer: Prisma.TrainerWhereInput = {
  approvedAt: { not: null },
  active: true,
  user: { role: UserRole.TRAINER },
};

export function assignedClient(trainerUserId: string): Prisma.ClientWhereInput {
  return { active: true, user: { role: UserRole.CLIENT }, trainers: { some: { ...eligibleTrainer, userId: trainerUserId } } };
}

export async function trainerCanAccessClient(trainerUserId: string, clientId: string) {
  return !!(await prisma.client.findFirst({
    where: { id: clientId, ...assignedClient(trainerUserId) },
    select: { id: true },
  }));
}
