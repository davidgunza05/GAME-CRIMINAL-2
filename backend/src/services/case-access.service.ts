import { prisma } from '../config/prisma'

// Verificar se utilizador tem acesso a um caso
export const hasAccess = async (userId: string, caseId: string): Promise<boolean> => {
  const access = await prisma.caseAccess.findUnique({
    where: { userId_caseId: { userId, caseId } },
  })
  return !!access
}

// Conceder acesso após pagamento
export const grantAccessFromOrder = async (orderId: string): Promise<void> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { case: true } } },
  })
  if (!order) return

  for (const item of order.items) {
    await prisma.caseAccess.upsert({
      where: { userId_caseId: { userId: order.userId, caseId: item.caseId } },
      create: { userId: order.userId, caseId: item.caseId, orderId },
      update: {},
    })
  }
}

// Admin concede acesso manual
export const adminGrantAccess = async (
  userId: string,
  caseId: string
): Promise<void> => {
  await prisma.caseAccess.upsert({
    where: { userId_caseId: { userId, caseId } },
    create: { userId, caseId },
    update: {},
  })
}

// Listar casos que o utilizador tem acesso
export const getUserCases = async (userId: string) => {
  return prisma.caseAccess.findMany({
    where: { userId },
    include: {
      case: {
        select: {
          id: true, slug: true, title: true, coverImageUrl: true,
          difficulty: true, type: true, estimatedMinutes: true,
        },
      },
    },
    orderBy: { grantedAt: 'desc' },
  })
}
