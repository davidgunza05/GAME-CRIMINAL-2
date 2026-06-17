import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crimegame.com' },
    update: {},
    create: {
      email: 'admin@crimegame.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: UserRole.admin,
      displayName: 'Administrator',
      isEmailVerified: true,
    },
  })

  // Organizer user
  const organizerPassword = await bcrypt.hash('Organizer@123456', 12)
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@crimegame.com' },
    update: {},
    create: {
      email: 'organizer@crimegame.com',
      username: 'organizer_demo',
      passwordHash: organizerPassword,
      role: UserRole.organizer,
      displayName: 'Demo Organizer',
      isEmailVerified: true,
    },
  })

  // Player user
  const playerPassword = await bcrypt.hash('Player@123456', 12)
  const player = await prisma.user.upsert({
    where: { email: 'player@crimegame.com' },
    update: {},
    create: {
      email: 'player@crimegame.com',
      username: 'player_demo',
      passwordHash: playerPassword,
      role: UserRole.player,
      displayName: 'Demo Player',
      isEmailVerified: true,
    },
  })

  // ─── Cases ──────────────────────────────────────────────────────────────────
  const case1 = await prisma.case.upsert({
    where: { slug: 'a-noite-do-mansion' },
    update: {},
    create: {
      slug: 'a-noite-do-mansion',
      title: 'A Noite do Mansion',
      shortDescription: 'Um magnata encontrado morto na sua mansão. Seis suspeitos. Uma noite para resolver o mistério.',
      description: 'O milionário Victor Aldridge foi encontrado morto na sua mansão durante uma festa privada. Seis convidados, todos com motivos ocultos.',
      difficulty: 'three',
      type: 'hybrid',
      minPlayers: 3,
      maxPlayers: 8,
      estimatedMinutes: 120,
      priceDigital: 14.99,
      pricePhysical: 39.99,
      tags: ['murder mystery', 'roleplay', 'mansão'],
      isPublished: true,
      isFeatured: true,
      sortOrder: 1,
    },
  })

  const case2 = await prisma.case.upsert({
    where: { slug: 'codigo-vermelho' },
    update: {},
    create: {
      slug: 'codigo-vermelho',
      title: 'Código Vermelho',
      shortDescription: 'Um laboratório secreto. Um cientista desaparecido. E uma fórmula que pode mudar o mundo.',
      description: 'A Dra. Elena Marsh desapareceu do Laboratório Prometheus. Os servidores foram apagados e um protótipo valioso está em falta.',
      difficulty: 'four',
      type: 'digital',
      minPlayers: 2,
      maxPlayers: 6,
      estimatedMinutes: 90,
      priceDigital: 11.99,
      tags: ['espionagem', 'tecnologia', 'thriller'],
      isPublished: true,
      isFeatured: false,
      sortOrder: 2,
    },
  })

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: 'Desconto de boas-vindas — 10% no primeiro caso',
      discountPercent: 10,
      maxUses: 100,
      isActive: true,
    },
  })

  console.log('✅ Seed complete!')
  console.log(`   👤 Admin:     admin@crimegame.com / Admin@123456`)
  console.log(`   👤 Organizer: organizer@crimegame.com / Organizer@123456`)
  console.log(`   👤 Player:    player@crimegame.com / Player@123456`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
