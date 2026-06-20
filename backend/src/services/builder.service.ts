import { prisma } from '../config/prisma'
import { CaseSubmissionStatus, ModerationAction } from '@prisma/client'
import { BuilderCaseInfoInput } from '../models/builder.schema'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fullSubmissionInclude = () => ({
  case: {
    include: {
      stages: { orderBy: { order: 'asc' as const } },
      characters: true,
      evidence: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  author: { select: { id: true, username: true, displayName: true, email: true, avatarUrl: true } },
  reviewedBy: { select: { id: true, username: true } },
  history: {
    orderBy: { createdAt: 'desc' as const },
    include: { admin: { select: { id: true, username: true } } },
    take: 20,
  },
})

// ─── Create Draft Case ────────────────────────────────────────────────────────

export const createDraftCase = async (authorId: string, input: BuilderCaseInfoInput) => {
  // Check slug uniqueness
  const existing = await prisma.case.findUnique({ where: { slug: input.slug } })
  if (existing) throw new Error('SLUG_TAKEN')

  const newCase = await prisma.case.create({
    data: {
      ...input,
      authorId,
      isPublished: false,
      priceDigital: input.priceDigital ?? null,
      pricePhysical: input.pricePhysical ?? null,
      coverImageUrl: input.coverImageUrl || null,
    },
  })

  // Create submission record (draft)
  const submission = await prisma.caseSubmission.create({
    data: {
      caseId: newCase.id,
      authorId,
      status: CaseSubmissionStatus.draft,
    },
    include: fullSubmissionInclude(),
  })

  return submission
}

// ─── Update Draft ─────────────────────────────────────────────────────────────

export const updateDraftCase = async (
  caseId: string,
  authorId: string,
  input: Partial<BuilderCaseInfoInput>
) => {
  const submission = await prisma.caseSubmission.findUnique({ where: { caseId } })
  if (!submission) throw new Error('NOT_FOUND')
  if (submission.authorId !== authorId) throw new Error('FORBIDDEN')
  if (!['draft', 'rejected'].includes(submission.status)) throw new Error('NOT_EDITABLE')

  if (input.slug && input.slug !== (await prisma.case.findUnique({ where: { id: caseId } }))?.slug) {
    const existing = await prisma.case.findUnique({ where: { slug: input.slug } })
    if (existing && existing.id !== caseId) throw new Error('SLUG_TAKEN')
  }

  await prisma.case.update({
    where: { id: caseId },
    data: {
      ...input,
      priceDigital: input.priceDigital ?? undefined,
      pricePhysical: input.pricePhysical ?? undefined,
      coverImageUrl: input.coverImageUrl || undefined,
    },
  })

  // Re-open for editing if previously rejected
  if (submission.status === CaseSubmissionStatus.rejected) {
    await prisma.caseSubmission.update({
      where: { caseId },
      data: { status: CaseSubmissionStatus.draft, rejectionReason: null, changeRequests: null },
    })
  }

  return getSubmissionByCaseId(caseId)
}

// ─── Get my submissions ───────────────────────────────────────────────────────

export const getMySubmissions = async (authorId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit
  const [submissions, total] = await prisma.$transaction([
    prisma.caseSubmission.findMany({
      where: { authorId },
      skip, take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        case: {
          select: {
            id: true, title: true, slug: true, coverImageUrl: true,
            difficulty: true, type: true, isPublished: true,
          },
        },
        history: { take: 1, orderBy: { createdAt: 'desc' }, include: { admin: { select: { username: true } } } },
      },
    }),
    prisma.caseSubmission.count({ where: { authorId } }),
  ])
  return { submissions, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export const getSubmissionByCaseId = async (caseId: string) => {
  return prisma.caseSubmission.findUnique({
    where: { caseId },
    include: fullSubmissionInclude(),
  })
}

export const getMySubmissionByCaseId = async (caseId: string, authorId: string) => {
  const sub = await prisma.caseSubmission.findUnique({
    where: { caseId },
    include: fullSubmissionInclude(),
  })
  if (!sub || sub.authorId !== authorId) throw new Error('NOT_FOUND')
  return sub
}

// ─── Validate completeness before submit ──────────────────────────────────────

export const validateCaseCompleteness = async (caseId: string) => {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      stages: true,
      characters: true,
      evidence: true,
    },
  })
  if (!c) throw new Error('NOT_FOUND')

  const errors: string[] = []

  if (!c.title || c.title.trim().length < 3)         errors.push('Título obrigatório (mínimo 3 caracteres)')
  if (!c.description || c.description.trim().length < 20) errors.push('Descrição obrigatória (mínimo 20 caracteres)')
  if (!c.priceDigital && !c.pricePhysical)           errors.push('Define pelo menos um preço (digital ou físico)')
  if (c.stages.length === 0)                          errors.push('O caso precisa de pelo menos 1 stage')
  if (!c.stages.some((s) => s.isLast))               errors.push('Define qual é a stage final (isLast)')
  if (c.characters.length < 2)                        errors.push('O caso precisa de pelo menos 2 personagens')
  if (!c.characters.some((ch) => ch.isKiller))       errors.push('Define quem é o culpado (isKiller)')
  if (c.evidence.length < 3)                          errors.push('O caso precisa de pelo menos 3 evidências')

  return { valid: errors.length === 0, errors }
}

// ─── Submit for Review ────────────────────────────────────────────────────────

export const submitForReview = async (caseId: string, authorId: string) => {
  const submission = await prisma.caseSubmission.findUnique({ where: { caseId } })
  if (!submission) throw new Error('NOT_FOUND')
  if (submission.authorId !== authorId) throw new Error('FORBIDDEN')
  if (!['draft', 'rejected'].includes(submission.status)) throw new Error('ALREADY_SUBMITTED')

  const { valid, errors } = await validateCaseCompleteness(caseId)
  if (!valid) throw new Error(`INCOMPLETE:${errors.join('|')}`)

  return prisma.caseSubmission.update({
    where: { caseId },
    data: {
      status: CaseSubmissionStatus.submitted,
      submittedAt: new Date(),
      rejectionReason: null,
      changeRequests: null,
    },
    include: fullSubmissionInclude(),
  })
}

// ─── Delete Draft ─────────────────────────────────────────────────────────────

export const deleteDraftCase = async (caseId: string, authorId: string) => {
  const submission = await prisma.caseSubmission.findUnique({ where: { caseId } })
  if (!submission) throw new Error('NOT_FOUND')
  if (submission.authorId !== authorId) throw new Error('FORBIDDEN')
  if (!['draft', 'rejected'].includes(submission.status)) throw new Error('NOT_DELETABLE')

  await prisma.case.delete({ where: { id: caseId } }) // cascades submission
}

// ─── Admin: List All Submissions ──────────────────────────────────────────────

export const adminListSubmissions = async (opts: {
  page: number; limit: number; status?: string; search?: string
}) => {
  const { page, limit, status, search } = opts
  const skip = (page - 1) * limit
  const where: any = {}

  if (status) where.status = status
  if (search) {
    where.OR = [
      { case: { title: { contains: search, mode: 'insensitive' } } },
      { author: { username: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [submissions, total] = await prisma.$transaction([
    prisma.caseSubmission.findMany({
      where, skip, take: limit,
      orderBy: [{ status: 'asc' }, { submittedAt: 'desc' }],
      include: {
        case: {
          select: {
            id: true, title: true, slug: true, coverImageUrl: true,
            difficulty: true, type: true, _count: { select: { stages: true, characters: true, evidence: true } },
          },
        },
        author: { select: { id: true, username: true, displayName: true, email: true, avatarUrl: true } },
        reviewedBy: { select: { username: true } },
        history: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.caseSubmission.count({ where }),
  ])

  return { submissions, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export const adminGetSubmission = async (submissionId: string) => {
  return prisma.caseSubmission.findUnique({
    where: { id: submissionId },
    include: fullSubmissionInclude(),
  })
}

// ─── Admin: Moderation Actions ────────────────────────────────────────────────

export const adminModerateSubmission = async (
  submissionId: string,
  adminId: string,
  action: 'approve' | 'reject' | 'request_changes' | 'publish' | 'unpublish',
  payload: { comment?: string; rejectionReason?: string; changeRequests?: string }
) => {
  const submission = await prisma.caseSubmission.findUnique({ where: { id: submissionId } })
  if (!submission) throw new Error('NOT_FOUND')

  let newStatus: CaseSubmissionStatus
  let moderationAction: ModerationAction
  let caseUpdate: any = {}

  switch (action) {
    case 'approve':
      newStatus = CaseSubmissionStatus.approved
      moderationAction = ModerationAction.approved
      break
    case 'reject':
      newStatus = CaseSubmissionStatus.rejected
      moderationAction = ModerationAction.rejected
      break
    case 'request_changes':
      newStatus = CaseSubmissionStatus.rejected
      moderationAction = ModerationAction.requested_changes
      break
    case 'publish':
      newStatus = CaseSubmissionStatus.published
      moderationAction = ModerationAction.published
      caseUpdate = { isPublished: true }
      break
    case 'unpublish':
      newStatus = CaseSubmissionStatus.approved
      moderationAction = ModerationAction.unpublished
      caseUpdate = { isPublished: false }
      break
    default:
      throw new Error('INVALID_ACTION')
  }

  return prisma.$transaction(async (tx) => {
    // Update submission
    const updated = await tx.caseSubmission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedById: adminId,
        rejectionReason: payload.rejectionReason ?? null,
        changeRequests: payload.changeRequests ?? null,
        ...(action === 'publish' ? { publishedAt: new Date() } : {}),
      },
      include: fullSubmissionInclude(),
    })

    // Update case if needed
    if (Object.keys(caseUpdate).length > 0) {
      await tx.case.update({
        where: { id: submission.caseId },
        data: caseUpdate,
      })
    }

    // Log history
    await tx.moderationHistory.create({
      data: {
        submissionId,
        adminId,
        action: moderationAction,
        comment: payload.comment ?? null,
      },
    })

    return updated
  })
}

// ─── Case Reviews ─────────────────────────────────────────────────────────────

export const upsertReview = async (
  caseId: string,
  userId: string,
  rating: number,
  comment?: string
) => {
  // Verify user has played this case
  const participated = await prisma.participant.findFirst({
    where: { userId, session: { caseId, status: 'completed' } },
  })
  if (!participated) throw new Error('NOT_PLAYED')

  return prisma.caseReview.upsert({
    where: { caseId_userId: { caseId, userId } },
    create: { caseId, userId, rating, comment: comment ?? null },
    update: { rating, comment: comment ?? null },
  })
}

export const getCaseReviews = async (caseId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit
  const [reviews, total, avg] = await prisma.$transaction([
    prisma.caseReview.findMany({
      where: { caseId },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.caseReview.count({ where: { caseId } }),
    prisma.caseReview.aggregate({ where: { caseId }, _avg: { rating: true } }),
  ])

  return {
    reviews,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    avgRating: avg._avg.rating ? Math.round(avg._avg.rating * 10) / 10 : null,
  }
}
