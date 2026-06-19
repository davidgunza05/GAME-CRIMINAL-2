import { PrismaClient, UserRole } from '@prisma/client'
import { seedBadges } from '../services/badge.service'
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


  // ─── Phase 3 — Stages, Characters, Evidence ─────────────────────────────────
  // Stages for case1
  const stage1 = await prisma.gameStage.upsert({
    where: { id: 'stage-intro-01' },
    update: {},
    create: {
      id: 'stage-intro-01',
      caseId: case1.id,
      order: 1,
      title: 'A Descoberta',
      description: 'O corpo de Victor Aldridge foi encontrado na biblioteca da mansão. A polícia acaba de chegar.',
      isLast: false,
    },
  })

  const stage2 = await prisma.gameStage.upsert({
    where: { id: 'stage-invest-02' },
    update: {},
    create: {
      id: 'stage-invest-02',
      caseId: case1.id,
      order: 2,
      title: 'Interrogatórios',
      description: 'Chegou a hora de interrogar os suspeitos e verificar os álibis.',
      isLast: false,
    },
  })

  const stage3 = await prisma.gameStage.upsert({
    where: { id: 'stage-final-03' },
    update: {},
    create: {
      id: 'stage-final-03',
      caseId: case1.id,
      order: 3,
      title: 'A Verdade',
      description: 'Todas as pistas foram analisadas. É hora de fazer a acusação final.',
      isLast: true,
    },
  })

  // Characters
  const charKiller = await prisma.character.upsert({
    where: { id: 'char-killer-01' },
    update: {},
    create: {
      id: 'char-killer-01',
      caseId: case1.id,
      name: 'Helena Voss',
      description: 'Secretária pessoal de Victor há 15 anos. Discreta e eficiente.',
      backstory: 'Helena dedicou a sua vida a Victor, mas descobriu recentemente que ele planejava reformá-la sem qualquer compensação.',
      objectives: 'Manter a tua posição e provar que és indispensável.',
      secrets: 'Sabes que Victor estava a mover os ativos para uma conta offshore sem o teu conhecimento.',
      alibi: 'Estavas na cozinha a preparar os cocktails das 21h às 22h.',
      isKiller: true,
      isDetective: false,
    },
  })

  const charDetective = await prisma.character.upsert({
    where: { id: 'char-det-01' },
    update: {},
    create: {
      id: 'char-det-01',
      caseId: case1.id,
      name: 'Inspector Ramos',
      description: 'Detetive veterano convidado para a festa como jogo social.',
      backstory: 'Ramos foi convidado por Victor para a festa como um desafio pessoal. Não esperava encontrar um crime real.',
      objectives: 'Descobrir a verdade e proteger os inocentes.',
      secrets: 'Tens suspeitas sobre Helena desde o início, mas precisas de provas.',
      alibi: 'Estavas no salão com outros convidados durante toda a noite.',
      isKiller: false,
      isDetective: true,
    },
  })

  // Evidence
  await prisma.evidence.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'ev-01',
        caseId: case1.id,
        stageId: stage1.id,
        title: 'Relatório da Autopsia',
        description: 'Vítima envenenada com arsénio. Estimativa: 21h-22h.',
        type: 'document',
        contentText: 'RELATÓRIO FORENSE N.º 2024-089 \n Vítima: Victor Aldridge, 67 anos \n Causa da morte: Envenenamento por arsénio \n Janela temporal: 21:00–22:00 \n Nota: O veneno foi misturado numa bebida.',
        isRedHerring: false,
        sortOrder: 1,
      },
      {
        id: 'ev-02',
        caseId: case1.id,
        stageId: stage1.id,
        title: 'Copo de Whisky',
        description: 'Copo encontrado na mesa de Victor com resíduos suspeitos.',
        type: 'object',
        contentText: 'Análise laboratorial: Traços de arsénio detetados. Impressões digitais: parcialmente apagadas.',
        isRedHerring: false,
        sortOrder: 2,
      },
      {
        id: 'ev-03',
        caseId: case1.id,
        stageId: stage2.id,
        title: 'Email Confidencial',
        description: 'Email encontrado no computador de Victor.',
        type: 'document',
        contentText: 'Para: advogado@firma.pt \n Assunto: Rescisão de contrato \n Preciso de redigir uma carta de rescisão para Helena Voss. Sem indemnização. Data: amanhã.',
        isRedHerring: false,
        sortOrder: 3,
      },
      {
        id: 'ev-04',
        caseId: case1.id,
        stageId: stage2.id,
        title: 'Frasco de Perfume',
        description: 'Frasco encontrado no quarto de um dos convidados.',
        type: 'object',
        contentText: 'Perfume Chanel N°5. Sem substâncias suspeitas. Pista falsa.',
        isRedHerring: true,
        sortOrder: 4,
      },
      {
        id: 'ev-05',
        caseId: case1.id,
        stageId: stage3.id,
        title: 'Registo de Compras de Helena',
        description: 'Histórico de compras online de Helena nos últimos 30 dias.',
        type: 'document',
        contentText: 'Data: 15/01 — "Kit de jardinagem avançado" — loja: Jardim & Cia \n Nota interna: O kit inclui compostos de arsénio para tratamento de pragas.',
        isRedHerring: false,
        sortOrder: 5,
      },
    ],
  })

  console.log('   🎭 Stages, characters and evidence seeded for:', case1.title)
  // ─── Player Profiles ───────────────────────────────────────────────────
  for (const u of [admin, organizer, player]) {
    await prisma.playerProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        totalXp: u.id === admin.id ? 4200 : u.id === organizer.id ? 1850 : 350,
        level: u.id === admin.id ? 8 : u.id === organizer.id ? 5 : 2,
        sessionsPlayed: u.id === admin.id ? 22 : u.id === organizer.id ? 9 : 2,
        sessionsSolved: u.id === admin.id ? 18 : u.id === organizer.id ? 7 : 1,
        correctFirst: u.id === admin.id ? 6 : u.id === organizer.id ? 2 : 0,
        evidenceFound: u.id === admin.id ? 180 : u.id === organizer.id ? 65 : 8,
      },
    })
  }

  // ─── Badges ───────────────────────────────────────────────────────────
  await seedBadges()
  console.log('   🏅 Badges seeded')

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
