import { prisma } from '../config/prisma'
import { SafeUser } from '../types'
import { hashPassword, comparePassword } from '../utils/crypto'

const toSafeUser = (user: any): SafeUser => {
  const { passwordHash, ...safe } = user
  return safe as SafeUser
}

// ─── Get Profile ──────────────────────────────────────────────────────────────

export const getUserById = async (id: string): Promise<SafeUser | null> => {
  const user = await prisma.user.findUnique({ where: { id } })
  return user ? toSafeUser(user) : null
}

export const getUserByUsername = async (username: string): Promise<SafeUser | null> => {
  const user = await prisma.user.findUnique({ where: { username } })
  return user ? toSafeUser(user) : null
}

// ─── Update Profile ───────────────────────────────────────────────────────────

export interface UpdateProfileInput {
  displayName?: string
  bio?: string
  avatarUrl?: string
}

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput
): Promise<SafeUser> => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    },
  })
  return toSafeUser(user)
}

// ─── Change Password ──────────────────────────────────────────────────────────

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('USER_NOT_FOUND')

  const valid = await comparePassword(currentPassword, user.passwordHash)
  if (!valid) throw new Error('INVALID_CURRENT_PASSWORD')

  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })
}

// ─── Change Username ──────────────────────────────────────────────────────────

export const changeUsername = async (
  userId: string,
  newUsername: string
): Promise<SafeUser> => {
  const existing = await prisma.user.findUnique({ where: { username: newUsername } })
  if (existing && existing.id !== userId) throw new Error('USERNAME_TAKEN')

  const user = await prisma.user.update({
    where: { id: userId },
    data: { username: newUsername },
  })
  return toSafeUser(user)
}

// ─── Admin: List Users ────────────────────────────────────────────────────────

export interface ListUsersOptions {
  page?: number
  limit?: number
  search?: string
  role?: string
}

export const listUsers = async (options: ListUsersOptions = {}) => {
  const { page = 1, limit = 20, search, role } = options
  const skip = (page - 1) * limit

  const where: any = {}
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { displayName: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (role) where.role = role

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        displayName: true,
        avatarUrl: true,
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ─── Admin: Toggle User Active ────────────────────────────────────────────────

export const toggleUserActive = async (
  userId: string,
  isActive: boolean
): Promise<SafeUser> => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  })
  return toSafeUser(user)
}

// ─── Admin: Change User Role ──────────────────────────────────────────────────

export const changeUserRole = async (
  userId: string,
  role: any
): Promise<SafeUser> => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  })
  return toSafeUser(user)
}
