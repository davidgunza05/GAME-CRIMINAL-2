import { prisma } from '../config/prisma'
import { CaseDifficulty, CaseType } from '@prisma/client'
import { CreateCaseInput, UpdateCaseInput, ListCasesQuery } from '../models/case.schema'

// ─── Public catalog ───────────────────────────────────────────────────────────

export const listPublishedCases = async (query: ListCasesQuery) => {
  const { page, limit, search, difficulty, type, minPlayers, maxPlayers, featured, tags, sortBy, sortOrder } = query
  const skip = (page - 1) * limit

  const where: any = { isPublished: true }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { shortDescription: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (difficulty) where.difficulty = difficulty
  if (type) where.type = type
  if (featured !== undefined) where.isFeatured = featured
  if (minPlayers) where.maxPlayers = { gte: minPlayers }
  if (maxPlayers) where.minPlayers = { lte: maxPlayers }
  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
    if (tagList.length) where.tags = { hasSome: tagList }
  }

  const orderBy: any = { [sortBy]: sortOrder }

  const [cases, total] = await prisma.$transaction([
    prisma.case.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        difficulty: true,
        type: true,
        minPlayers: true,
        maxPlayers: true,
        estimatedMinutes: true,
        priceDigital: true,
        pricePhysical: true,
        coverImageUrl: true,
        tags: true,
        isFeatured: true,
        createdAt: true,
      },
    }),
    prisma.case.count({ where }),
  ])

  return { cases, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export const getPublishedCaseBySlug = async (slug: string) => {
  return prisma.case.findFirst({
    where: { slug, isPublished: true },
  })
}

export const getFeaturedCases = async (limit = 4) => {
  return prisma.case.findMany({
    where: { isPublished: true, isFeatured: true },
    take: limit,
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true, slug: true, title: true, shortDescription: true,
      difficulty: true, type: true, minPlayers: true, maxPlayers: true,
      estimatedMinutes: true, priceDigital: true, pricePhysical: true,
      coverImageUrl: true, tags: true,
    },
  })
}

export const getAllTags = async (): Promise<string[]> => {
  const cases = await prisma.case.findMany({
    where: { isPublished: true },
    select: { tags: true },
  })
  const all = cases.flatMap((c) => c.tags)
  return [...new Set(all)].sort()
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export const adminListCases = async (query: ListCasesQuery) => {
  const { page, limit, search, difficulty, type } = query
  const skip = (page - 1) * limit
  const where: any = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (difficulty) where.difficulty = difficulty
  if (type) where.type = type

  const [cases, total] = await prisma.$transaction([
    prisma.case.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.case.count({ where }),
  ])

  return { cases, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export const getCaseById = async (id: string) => {
  return prisma.case.findUnique({ where: { id } })
}

export const createCase = async (input: CreateCaseInput) => {
  const existing = await prisma.case.findUnique({ where: { slug: input.slug } })
  if (existing) throw new Error('SLUG_TAKEN')

  return prisma.case.create({
    data: {
      ...input,
      priceDigital: input.priceDigital ?? null,
      pricePhysical: input.pricePhysical ?? null,
    },
  })
}

export const updateCase = async (id: string, input: UpdateCaseInput) => {
  const exists = await prisma.case.findUnique({ where: { id } })
  if (!exists) throw new Error('NOT_FOUND')

  if (input.slug && input.slug !== exists.slug) {
    const slugTaken = await prisma.case.findUnique({ where: { slug: input.slug } })
    if (slugTaken) throw new Error('SLUG_TAKEN')
  }

  return prisma.case.update({ where: { id }, data: input })
}

export const deleteCase = async (id: string) => {
  const exists = await prisma.case.findUnique({ where: { id } })
  if (!exists) throw new Error('NOT_FOUND')
  return prisma.case.delete({ where: { id } })
}

export const togglePublish = async (id: string, isPublished: boolean) => {
  return prisma.case.update({ where: { id }, data: { isPublished } })
}

export const toggleFeatured = async (id: string, isFeatured: boolean) => {
  return prisma.case.update({ where: { id }, data: { isFeatured } })
}

// ─── Price lookup (used by order service) ─────────────────────────────────────

export const getCasePrice = async (caseId: string, itemType: 'digital' | 'physical' | 'event') => {
  const c = await prisma.case.findUnique({ where: { id: caseId, isPublished: true } })
  if (!c) throw new Error('CASE_NOT_FOUND')

  if (itemType === 'digital' && c.priceDigital) return Number(c.priceDigital)
  if (itemType === 'physical' && c.pricePhysical) return Number(c.pricePhysical)

  throw new Error('PRICE_NOT_AVAILABLE')
}
