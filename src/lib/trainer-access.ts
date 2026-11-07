import { Prisma, UserRole } from '@prisma/client';
import { prisma } from './db';

export const eligibleTrainer: Prisma.TrainerWhereInput = {
  approved: true,
  active: true,
  user: { role: UserRole.TRAINER },
};

export function assignedClient(trainerUserId: string): Prisma.ClientWhereInput {
  return { active: true, trainers: { some: { ...eligibleTrainer, userId: trainerUserId } } };
}

export async function trainerCanAccessClient(trainerUserId: string, clientId: string) {
  return !!(await prisma.client.findFirst({
    where: { id: clientId, ...assignedClient(trainerUserId) },
    select: { id: true },
  }));
}
