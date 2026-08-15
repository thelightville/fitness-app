import { prisma } from './db';

export async function logAudit(params: {
  actorId?: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
  appointmentId?: string;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      metadata: (params.metadata ?? {}) as any,
      appointmentId: params.appointmentId,
    },
  });
}
