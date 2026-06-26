import { PrismaClient, CaseDifficulty, CaseType, EvidenceType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hash = (p: string) => bcrypt.hashSync(p, 10)

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 A iniciar seed...\n')

  // ── Admin ──────────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      username: 'admin',
      displayName: 'Administrador',
      passwordHash: hash('Gunza17@'),
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    },
  })
  console.log(`✅ Admin: ${admin.email}`)

  // ── Casos ─────────────────────────────────────────────────────────────────

  await seedCases(admin.id)

  console.log('\n✅ Seed concluído!')
}

// ─────────────────────────────────────────────────────────────────────────────
// CASOS
// ─────────────────────────────────────────────────────────────────────────────

async function seedCases(adminId: string) {

  // ── 4 CASOS GRATUITOS ──────────────────────────────────────────────────────

  await createCase(adminId, {
    slug: 'o-veneno-do-bibliotecario',
    title: 'O Veneno do Bibliotecário',
    shortDescription: 'O bibliotecário chefe foi encontrado morto entre estantes de livros raros. O veneno no chá ainda estava quente.',
    description: `Na manhã de uma quinta-feira chuvosa, o corpo de Ernesto Figueiredo, bibliotecário-chefe da Biblioteca Municipal de Évora, foi descoberto pela auxiliar de limpeza entre as estantes da secção de manuscritos medievais. A xícara de chá ao seu lado ainda emanava vapor — o veneno agiu rapidamente.

Ernesto era conhecido pela sua natureza controvertida: guardava segredos sobre obras raras desaparecidas, mantinha um diário cifrado e tinha recentemente ameaçado denunciar irregularidades internas à administração municipal.

Os jogadores assumem o papel de investigadores privados contratados pela família Figueiredo, que não confia na polícia local — suspeita de encobrimento. Terão de interrogar testemunhas, descodificar o diário do morto, analisar o relatório toxicológico e descobrir quem, entre os quatro suspeitos com acesso à biblioteca naquela manhã, preparou a xícara fatal.

A investigação revela uma teia de corrupção, paixões antigas e ambições académicas que tornam cada suspeito igualmente plausível — até à revelação final.`,
    difficulty: CaseDifficulty.two,
    type: CaseType.digital,
    minPlayers: 2,
    maxPlayers: 5,
    estimatedMinutes: 90,
    priceDigital: null,
    isFeatured: true,
    sortOrder: 10,
    tags: ['mistério', 'veneno', 'biblioteca', 'iniciante', 'grátis'],
    coverImageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
    stages: [
      { order: 1, title: 'A Descoberta', description: 'A cena do crime e os primeiros depoimentos. Onde estava cada suspeito quando o veneno foi administrado?' },
      { order: 2, title: 'O Diário Cifrado', description: 'A família encontra o diário de Ernesto escondido num livro oco. As anotações revelam conflitos que a polícia desconhecia.' },
      { order: 3, title: 'O Relatório Toxicológico', description: 'O veneno identificado — acónito — é raro e requer conhecimento especializado. Quem na biblioteca saberia como obtê-lo?' },
      { order: 4, title: 'O Confronto Final', description: 'Com todas as pistas reunidas, é hora de confrontar o culpado. Uma acusação errada encerra o caso sem resolução.', isLast: true },
    ],
    characters: [
      {
        name: 'Dra. Inês Monteiro',
        description: 'Vice-bibliotecária, 52 anos. Metódica, ambiciosa, aguarda há 11 anos a promoção que Ernesto bloqueava sistematicamente.',
        backstory: 'Trabalha na biblioteca há 23 anos. Doutorada em Paleografia pela Universidade de Coimbra. Submeteu candidatura ao cargo de chefe três vezes — todas negadas por Ernesto, que a considerava "demasiado inovadora para a tradição da instituição". Recentemente descobriu que Ernesto falsificara um relatório de avaliação para a prejudicar.',
        objectives: 'Provar a sua competência e finalmente assumir a direcção da biblioteca.',
        secrets: 'Tem em sua posse uma fotocópia do relatório falsificado por Ernesto. Sabia da existência do diário cifrado e já tentou aceder a ele.',
        alibi: 'Afirma ter estado na sala de catalogação durante toda a manhã, mas nenhuma câmara cobre essa zona.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Prof. Rui Saraiva',
        description: 'Historiador visitante, 61 anos. Usa a biblioteca para investigação sobre manuscritos do século XV.',
        backstory: 'Académico respeitado da Universidade de Lisboa, em sabática para escrever uma monografia sobre textos medievais portugueses. Ernesto descobriu recentemente que Saraiva tinha fotografado ilegalmente manuscritos protegidos e vendera as imagens a um colecionador suíço. Estava a ser chantageado.',
        objectives: 'Concluir a sua investigação sem que o escândalo das fotografias se torne público.',
        secrets: 'Pagou a Ernesto durante seis meses para manter silêncio. O último pagamento foi recusado — Ernesto queria mais.',
        alibi: 'Diz ter chegado apenas às 10h30, já depois do crime. Mas o registo de entrada mostra 8h47.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Catarina Lemos',
        description: 'Estagiária, 24 anos. Estudante de Gestão Cultural, no último semestre do estágio curricular.',
        backstory: 'Brilhante e observadora, Catarina descobriu por acaso que Ernesto desviava verbas destinadas à restauração de obras para uma conta pessoal. Confrontou-o discretamente uma semana antes da morte, pedindo explicações. Ernesto ameaçou reprovar o seu estágio se ela "continuasse a meter o nariz onde não era chamada".',
        objectives: 'Terminar o estágio com aprovação e expor a corrupção de Ernesto pelos canais correctos.',
        secrets: 'Tem prints das transferências bancárias suspeitas guardados numa pen drive. É filha de um inspector da Polícia Judiciária.',
        alibi: 'Estava a receber caixas de livros doados na entrada principal — confirmado por uma testemunha externa.',
        isKiller: false,
        isDetective: true,
      },
      {
        name: 'Augusto Faria',
        description: 'Técnico de manutenção, 47 anos. Funcionário municipal há 19 anos, discreta e constantemente presente.',
        backstory: 'Conhece cada canto da biblioteca. Tem acesso a todas as chaves, incluindo a da sala de manuscritos onde o corpo foi encontrado. É cunhado de um vereador municipal que Ernesto estava prestes a denunciar por desvio de obras de arte do espólio municipal. Recebeu uma chamada anónima três dias antes do crime a pedir que "resolvesse o problema".',
        objectives: 'Proteger o cunhado e manter o seu emprego estável.',
        secrets: 'Preparou o chá de Ernesto naquela manhã — é ele quem conhece as preferências do bibliotecário e tem acesso à cozinha. Guarda as plantas de todo o edifício, incluindo uma secção de arquivo subterrâneo não documentado.',
        alibi: 'Afirma ter estado a reparar uma canalização no piso inferior. Trabalhou sozinho.',
        isKiller: true,
        isDetective: false,
      },
    ],
    evidence: [
      { stageIdx: 0, title: 'Relatório de Toxicologia Preliminar', description: 'Análise química da xícara de chá. Detectado acónito (aconitina) — alcalóide extraído da planta Aconitum napellus. Dose letal. Tempo de actuação: 20 a 40 minutos após ingestão.', type: EvidenceType.document, contentText: 'RELATÓRIO TOXICOLÓGICO PRELIMINAR\nVítima: Ernesto Figueiredo, 67 anos\nSubstância: Aconitina (≈ 5mg)\nVeículo: Infusão de chá preto\nTempo estimado de morte: 09h15–09h30\nObservação: A substância não altera sabor nem cor da bebida. Requer manuseamento cuidadoso — contacto dérmico prolongado também é tóxico.' },
      { stageIdx: 0, title: 'Registo de Entradas — 14 de Março', description: 'Log digital do sistema de controlo de acesso à biblioteca. Mostra horários de entrada de todos os presentes naquele dia.', type: EvidenceType.document, contentText: 'SISTEMA DE CONTROLO DE ACESSO — 14/03\n07:58 — Augusto Faria (manutenção)\n08:47 — Prof. Rui Saraiva (visitante)\n09:02 — Ernesto Figueiredo (chefe)\n09:11 — Dra. Inês Monteiro (vice-chefe)\n09:23 — Catarina Lemos (estagiária)\n\nNOTA: O sistema regista apenas entradas. Saídas não são monitorizadas neste piso.' },
      { stageIdx: 0, title: 'Fotografia da Cena do Crime', description: 'A xícara de chá, o corpo e a disposição dos objectos na mesa de Ernesto. Uma chave não identificada junto ao porta-canetas.', type: EvidenceType.photo, isRedHerring: false },
      { stageIdx: 1, title: 'Diário Cifrado de Ernesto — Páginas Decifradas', description: 'Três páginas do diário decodificadas pela equipa forense. As restantes estão ilegíveis por dano de água.', type: EvidenceType.document, contentText: '...R. continua a pagar mas agora exige os negativos. Não existem negativos — só ficheiros. Ele não sabe.\n\n...A Catarina descobriu os movimentos. Criança demasiado curiosa. O estágio dela está nas minhas mãos.\n\n...Amanhã falo com o vereador. O Augusto vai saber que o cunhado está comprometido. Veremos se ele é leal ao emprego ou à família...' },
      { stageIdx: 1, title: 'Extracto Bancário Suspeito', description: 'Conta pessoal de Ernesto Figueiredo. Seis transferências mensais de 800€ provenientes de uma empresa de consultoria que não existe nos registos comerciais.', type: EvidenceType.document, isRedHerring: false },
      { stageIdx: 2, title: 'Manual de Plantas Medicinais e Tóxicas', description: 'Encontrado na sala de manutenção — não pertence ao acervo da biblioteca. Tem marcadores em duas páginas: Aconitum napellus e Digitalispurpurea.', type: EvidenceType.object, contentText: 'Livro encadernado em verde, sem data. Marcador caseiro na página 147 (Aconitum — "uso com luvas, não ingerir"). Segunda página marcada: Digitalis (falsa pista — não foi usada). Na contracapa: carimbo apagado de uma farmácia de Beja.', isRedHerring: false },
      { stageIdx: 2, title: 'Luvas Descartadas no Contentor de Reciclagem', description: 'Par de luvas de látex encontradas no contentor da sala de manutenção. Vestígios de solo escuro nas palmas — incompatível com trabalho de canalização.', type: EvidenceType.object, isRedHerring: false },
      { stageIdx: 3, title: 'Planta do Edifício — Arquivo Subterrâneo', description: 'Planta encontrada no armário de Augusto. Revela uma divisão não mapeada no piso -1 onde foram posteriormente encontrados vasos de Aconitum napellus cultivados.', type: EvidenceType.document, contentText: 'Planta manuscrita do edifício. Piso -1 tem uma divisão de 12m² não catalogada, acessível apenas pela sala de manutenção. Câmeras não cobrem esta zona. A divisão tem luz artificial e sistema de rega — condições para cultivo de plantas.', isRedHerring: false },
      { stageIdx: 3, title: 'Chamada Anónima — Transcrição', description: 'A operadora municipal cediu a transcrição de uma chamada recebida pelo telemóvel de serviço de Augusto três dias antes do crime.', type: EvidenceType.audio, contentText: 'TRANSCRIÇÃO — 11/03, 21:47\nVoz não identificada (distorcida): "O Ernesto vai falar com a câmara na quinta. Se isso acontecer, o teu cunhado vai para a cadeia e tu perdes o emprego. Resolve isto antes de quinta-feira."\nAugusto: "Quem é que está a falar?"\n[Chamada terminada]\n\nNOTA: A chamada foi efectuada de um telemóvel pré-pago comprado em dinheiro.', isRedHerring: false },
    ],
  })

  // ─────────────────────────────────────────────────────────────────────────

  await createCase(adminId, {
    slug: 'o-naufragio-do-conde-ferreira',
    title: 'O Naufrágio do Conde Ferreira',
    shortDescription: 'Um milionário aparece morto no seu iate de luxo ancorado no Douro. Cinco convidados, uma noite de tempestade, nenhuma saída.',
    description: `Na noite de sábado, durante uma tempestade que varreu o Porto, o iate "Dona Amélia" permaneceu ancorado junto à Ribeira com cinco convidados a bordo. Pela manhã, o anfitrião, Frederico Conde Ferreira, 74 anos, magnata da indústria corticeira, foi encontrado morto no camarote principal — traumatismo craniano compatível com queda, mas a posição do corpo contradiz o acidente.

O médico legista confirma: Frederico estava vivo quando a tempestade começou e morreu durante o seu auge, quando barulho e vento tornavam impossível ouvir ou ser ouvido no convés. Ninguém saiu do barco — o sistema de alarme do cais confirmou-o. O assassino está entre os cinco convidados.

Cada jogador recebe o dossier completo de um suspeito com informação que os outros não têm. A investigação exige partilha estratégica de informação, triangulação de testemunhos contraditórios e análise do testamento de Frederico — recentemente alterado, sem que os herdeiros soubessem.`,
    difficulty: CaseDifficulty.three,
    type: CaseType.digital,
    minPlayers: 3,
    maxPlayers: 6,
    estimatedMinutes: 120,
    priceDigital: null,
    isFeatured: false,
    sortOrder: 20,
    tags: ['mistério', 'barco', 'herança', 'multiplayer', 'grátis'],
    coverImageUrl: 'https://images.unsplash.com/photo-1534008757030-27299764ef09?w=800&q=80',
    stages: [
      { order: 1, title: 'A Tempestade', description: 'A reconstrução da noite. Quem estava onde, o que foi ouvido, e o que o sistema de câmeras de bordo registou (ou não registou).' },
      { order: 2, title: 'O Testamento', description: 'O advogado de Frederico revela que o testamento foi alterado 72 horas antes da morte. A mudança prejudicou severamente três dos cinco convidados.' },
      { order: 3, title: 'Os Segredos do Camarote', description: 'A fouille do camarote revela correspondência privada, um cofre e um telemóvel com mensagens apagadas — parcialmente recuperadas.' },
      { order: 4, title: 'Contradições', description: 'Os testemunhos cruzados revelam pelo menos duas mentiras directas. Quem mente e porquê?' },
      { order: 5, title: 'Veredito Final', description: 'Com todos os elementos, a equipa deve formular a acusação: suspeito, motivo, método e oportunidade.', isLast: true },
    ],
    characters: [
      {
        name: 'Helena Conde Ferreira',
        description: 'Filha mais velha, 48 anos. Advogada de sucesso em Lisboa. Relação tensa com o pai desde o divórcio desta há 5 anos.',
        backstory: 'Herdou da mãe uma quota da empresa familiar, que Frederico tentou comprar forçosamente por valor abaixo do mercado. O litígio durava há três anos. Com a alteração do testamento, Helena foi excluída da gestão da empresa — apenas recebe um legado fixo muito inferior ao esperado.',
        objectives: 'Recuperar o controlo da empresa familiar e anular as alterações ao testamento.',
        secrets: 'Sabe que o pai tinha um acordo secreto com um fundo de investimento árabe para vender 60% da empresa. A venda tornaria o legado dela irrisório.',
        alibi: 'Afirma ter dormido no camarote 2 durante toda a noite. Mas foi vista no corredor às 02h17 por outro convidado.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Dr. Mário Esteves',
        description: 'Médico de família de Frederico, 63 anos. Amigo pessoal há 40 anos. Único não-familiar convidado.',
        backstory: 'Médico aposentado que acompanhou Frederico durante uma doença cardíaca há dois anos. Sabe que Frederico foi diagnosticado com cancro pancreático há 6 meses — diagnóstico que o paciente pediu que mantivesse secreto da família. Tem conflito de interesses: é beneficiário de um seguro de vida no valor de 2 milhões de euros.',
        objectives: 'Proteger o segredo médico e garantir que o diagnóstico não emerge durante a investigação.',
        secrets: 'Na noite do crime, administrou a Frederico a dose habitual de medicação. Mas a dose era o dobro do prescrito — erro ou intenção?',
        alibi: 'Estava no convés a fumar entre as 01h45 e as 02h30. Confirma ter ouvido um barulho surdo às 02h20.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Tomás Ferreira Júnior',
        description: 'Neto, 29 anos. Designer de moda em Paris. Extravagante, endividado, com uma relação privilegiada com o avô.',
        backstory: 'O favorito de Frederico. Recebeu sempre apoio financeiro sem contrapartidas. Com a alteração do testamento, Tomás passa a receber o dobro dos outros herdeiros — o que os restantes desconhecem. Mas Tomás tem dívidas de jogo que ascendem a 340.000€ e o avô descobriu recentemente.',
        objectives: 'Garantir a herança antes que o avô mude de ideias novamente.',
        secrets: 'Estava a ser chantageado por um credor que ameaçava revelar as dívidas ao avô. Frederico descobriu na semana anterior — e ameaçou alterar o testamento novamente.',
        alibi: 'Diz ter estado no salão a jogar cartas sozinho. Não há testemunhas.',
        isKiller: true,
        isDetective: false,
      },
      {
        name: 'Sílvia Montez',
        description: 'Assessora pessoal de Frederico, 38 anos. Discreta, eficiente, conhecedora de todos os negócios do patrão.',
        backstory: 'Trabalha para Frederico há 11 anos. Sabe de todos os acordos, incluindo a venda ao fundo árabe. Frederico prometeu-lhe um bónus de 500.000€ quando a venda fosse concluída — promessa verbal, sem contrato. Com a morte, o bónus desaparece. Tem cópias digitais de toda a correspondência de Frederico dos últimos três anos.',
        objectives: 'Garantir compensação pelo seu trabalho e lealdade, com ou sem o acordo de venda.',
        secrets: 'Está em contacto com o fundo de investimento árabe independentemente dos herdeiros. Tem propostas para continuar o negócio sem a família.',
        alibi: 'No camarote de trabalho a preparar documentos para uma reunião de segunda-feira. Confirmado por logs do laptop — mas logs podem ser manipulados.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Capitão Jorge Vasques',
        description: 'Capitão do iate, 55 anos. Ao serviço de Frederico há 8 anos. Conhece o barco como a palma da mão.',
        backstory: 'Reformado da Marinha Portuguesa. Leal a Frederico, mas recentemente descobriu irregularidades no registo de carga do iate — o barco foi usado sem o seu conhecimento para transporte de algo não declarado. Frederico prometeu uma explicação que nunca chegou.',
        objectives: 'Proteger a sua reputação e licença de capitão. Descobrir o que foi transportado no iate.',
        secrets: 'Tem acesso a todas as áreas do barco, incluindo a caixa de fusíveis que desligou as câmeras de segurança por 47 minutos durante a noite — avaria técnica ou sabotagem?',
        alibi: 'Na ponte de comando durante a tempestade. Saiu brevemente para verificar as amarras às 02h15.',
        isKiller: false,
        isDetective: true,
      },
    ],
    evidence: [
      { stageIdx: 0, title: 'Registo de Câmeras de Bordo', description: 'O sistema de videovigilância do iate registou normalmente até às 01h58. Falha técnica entre 01h58 e 02h45. Imagem retomada com o corpo já descoberto.', type: EvidenceType.document, contentText: 'LOG DO SISTEMA — Dona Amélia\n23:45 — Todos os convidados no salão principal\n00:30 — Frederico retira-se para o camarote\n01:15 — Tomás Ferreira entra na cozinha (2 min)\n01:47 — Dr. Esteves sobe ao convés\n01:58 — FALHA DO SISTEMA (47 minutos)\n02:45 — Sistema reactivado\n07:12 — Corpo descoberto por Sílvia Montez' },
      { stageIdx: 0, title: 'Relatório do Médico Legista', description: 'Causa da morte: traumatismo craniano severo. Instrumento contundente de superfície curva. Hora da morte: entre 02h00 e 02h30.', type: EvidenceType.document, contentText: 'A lesão é incompatível com queda acidental — o ângulo de impacto implica golpe de cima para baixo, com força considerável. A vítima estava de joelhos ou sentada quando foi atingida. Vestígios de tinta azul na ferida — provavelmente do objecto usado.' },
      { stageIdx: 1, title: 'Testamento — Versão Alterada (72h antes)', description: 'Cópia autenticada. Tomás Ferreira Júnior passa de 15% para 40% da herança. Helena Conde Ferreira reduzida de 35% para 8%.', type: EvidenceType.document, isRedHerring: false },
      { stageIdx: 1, title: 'Email do Advogado — 3 dias antes', description: 'Frederico instrui alteração urgente ao testamento. Motivo mencionado: "razões que se tornaram evidentes esta semana".', type: EvidenceType.document, contentText: 'De: fcferreira@condeferreira.pt\nPara: rui.tavares@tavares-associados.pt\nAssunto: Alteração urgente\n\nRui,\nPreciso de rever o testamento com urgência. Descobri algo sobre o Tomás que muda a minha perspectiva — por agora favorável a ele, mas que pode mudar. Que seja formalizado enquanto a minha opinião ainda é esta.\nFrederico' },
      { stageIdx: 2, title: 'Cofre do Camarote — Conteúdo', description: 'Cofre aberto pela polícia. Continha: carta manuscrita inacabada, USB encriptado, e um remo decorativo de 40cm em madeira lacada — azul.', type: EvidenceType.object, contentText: 'INVENTÁRIO DO COFRE:\n1. Carta inacabada (ver pista separada)\n2. USB — encriptado, conteúdo desconhecido\n3. Remo decorativo de madeira lacada azul, 40cm — pertence ao conjunto decorativo do camarote. AUSENTE do conjunto decorativo quando o barco foi vistoriado anteriormente.', isRedHerring: false },
      { stageIdx: 2, title: 'Carta Inacabada de Frederico', description: 'Carta manuscrita encontrada no cofre. Escrita na noite do crime — a tinta ainda estava semi-fresca quando descoberta.', type: EvidenceType.document, contentText: 'Tomás,\nSoube do Carvalho. 340 mil euros não é um número que podes ignorar e esperar que eu não descubra. Fiquei mais triste do que zangado — mentiste-me durante meses.\nDecidi dar-te uma última oportunidade. Amanhã falamos. Se a tua resposta me convencer, o testamento fica como está. Se não me convencer,', isRedHerring: false },
      { stageIdx: 3, title: 'Mensagens Recuperadas — Telemóvel de Frederico', description: 'Sete mensagens parcialmente recuperadas pela forense digital. As mais relevantes são de Tomás, enviadas entre 23h e 01h.', type: EvidenceType.document, contentText: 'MENSAGENS RECUPERADAS (fragmentos)\n23:47 — Tomás: "avô preciso de falar contigo a sós antes de amanhã"\n23:52 — Frederico: "amanhã de manhã. agora não"\n00:14 — Tomás: "não pode esperar. é sobre o carvalho. eu explico tudo"\n00:19 — Frederico: "vem ao camarote às 2. bate à porta"\n[restantes mensagens corruptas]', isRedHerring: false },
      { stageIdx: 3, title: 'Depoimento Contraditório — Dr. Esteves', description: 'O médico afirma ter ouvido "um barulho surdo" às 02h20 no convés. Mas o relatório meteorológico mostra que a rajada mais intensa — capaz de encobrir um impacto — ocorreu às 02h12.', type: EvidenceType.document, isRedHerring: true, contentText: 'NOTA DE INVESTIGAÇÃO: O Dr. Esteves disse "02h20" em dois depoimentos separados. O barulho que descreve seria consistente com o crime — mas o timing não coincide com a hora de morte estimada. Possível erro de memória, ou tentativa de criar confusão temporal?' },
      { stageIdx: 4, title: 'Remo Decorativo — Análise Forense', description: 'Vestígios de cabelo e sangue da vítima no remo azul. Impressões digitais parcialmente apagadas — com excepção de uma impressão no cabo, provavelmente do indicador direito.', type: EvidenceType.object, contentText: 'LAUDO FORENSE — OBJECTO 003\nTipo: Remo decorativo, madeira de carvalho lacada, azul marinho\nComprimento: 41cm, peso 380g\nADN: positivo para Frederico Conde Ferreira\nImpressões: superfície limpa com pano (vestígios de microfibra). Excepção: impressão parcial no cabo inferior — curva do indicador direito, mão direita.', isRedHerring: false },
    ],
  })

  // ─────────────────────────────────────────────────────────────────────────

  await createCase(adminId, {
    slug: 'fantasma-da-fabrica',
    title: 'O Fantasma da Fábrica',
    shortDescription: 'Um operário foi encontrado morto numa fábrica têxtil abandonada. Dizem que é o terceiro acidente em dois anos — mas os outros dois também foram assassinatos.',
    description: `A Fábrica Textília do Mondego encerrou em 2019 após décadas de laboração. Em Fevereiro, o corpo de Gilberto Ramos, ex-operário e activista laboral, foi encontrado no interior do edifício abandonado com traumatismo múltiplos. A polícia classificou como acidente — queda de uma passagem elevada em mau estado.

Mas a filha de Gilberto não acredita. Contratou os investigadores depois de descobrir que dois outros ex-operários morreram em "acidentes" nos últimos dois anos, ambos relacionados com a tentativa de reabrir processos judiciais contra os antigos proprietários por exposição ilegal a amianto.

O caso envolve consulta de arquivos históricos da fábrica, entrevistas a ex-funcionários ainda vivos, e análise de documentos internos que provam que a direcção sabia há 20 anos dos riscos — e os ignorou deliberadamente. O assassino do presente está a proteger crimes do passado.`,
    difficulty: CaseDifficulty.three,
    type: CaseType.digital,
    minPlayers: 2,
    maxPlayers: 6,
    estimatedMinutes: 105,
    priceDigital: null,
    isFeatured: false,
    sortOrder: 30,
    tags: ['mistério', 'indústria', 'passado', 'amianto', 'grátis'],
    coverImageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&q=80',
    stages: [
      { order: 1, title: 'A Fábrica Abandonada', description: 'Visita ao local, depoimento inicial da filha de Gilberto e contexto histórico da Textília do Mondego.' },
      { order: 2, title: 'Os Outros Dois', description: 'Análise dos casos anteriores. Padrão emerge: todos os mortos eram testemunhas do processo de amianto.' },
      { order: 3, title: 'O Arquivo Secreto', description: 'Nos escombros do escritório de direcção, a equipa encontra um arquivo com relatórios internos que nunca deveriam ter existido.' },
      { order: 4, title: 'O Presente Encontra o Passado', description: 'A ligação entre a direcção antiga e alguém que ainda está activo hoje. Quem lucra com o silêncio?', isLast: true },
    ],
    characters: [
      {
        name: 'Engenheira Marta Silveira',
        description: 'Ex-directora de produção, 67 anos. Reformada. Assinou os relatórios internos sobre o amianto.',
        backstory: 'Passou 30 anos na Textília. Sabia dos riscos do amianto desde 1998 — os relatórios internos mostram a sua assinatura. Após o encerramento, recebe uma pensão complementar paga pelos antigos donos. Se o processo judicial for reaberto, pode perder a pensão e enfrentar acusações criminais.',
        objectives: 'Impedir que os relatórios internos cheguem ao tribunal.',
        secrets: 'Tem cópias digitais de todos os relatórios. Guardou-os como seguro pessoal — para usar contra os donos se eles tentassem culpá-la sozinha.',
        alibi: 'Afirma não ter estado na fábrica há 4 anos. O porteiro de um armazém próximo diz tê-la visto.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Henrique Salavessa',
        description: 'Ex-dono e presidente do conselho de administração, 71 anos. Vive no Algarve. Viajou ao Mondego na semana do crime.',
        backstory: 'Vendeu a fábrica em 2019 por um valor simbólico para evitar responsabilidades. Tem advogados prontos para qualquer eventualidade. O processo de amianto pode resultar em indemnizações que ultrapassam 40 milhões de euros — o seu único activo real é a casa no Algarve e um fundo offshore.',
        objectives: 'Destruir qualquer prova documental que reste na fábrica.',
        secrets: 'Pagou em dinheiro para que dois relatórios médicos de ex-operários desaparecessem dos arquivos hospitalares. É investigado pela Europol por uma questão não relacionada.',
        alibi: 'Estava em reunião em Lisboa. O hotel confirma check-in mas não check-out.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Filomena Ramos',
        description: 'Filha de Gilberto, 41 anos. Professora de História. Contratou os investigadores.',
        backstory: 'Cresceu a ouvir o pai falar dos companheiros que adoeceram. Passou dois anos a compilar documentação para reabrir o processo. Tem contactos em jornais que estão prontos a publicar se conseguir provas sólidas. A sua motivação é a justiça — mas a sua obsessão pode tê-la levado longe de mais.',
        objectives: 'Provar que o pai foi assassinado e levar os responsáveis a julgamento.',
        secrets: 'Entrou ilegalmente na fábrica duas semanas antes da morte do pai. Sabe onde está o arquivo — foi ela que o descobriu primeiro.',
        alibi: 'Em casa com os filhos. Verificado.',
        isKiller: false,
        isDetective: true,
      },
      {
        name: 'Vítor Campos',
        description: 'Segurança privado contratado para guardar a fábrica, 44 anos. Novo no cargo — começou três meses antes do crime.',
        backstory: 'Ex-militar. Contratado directamente por Salavessa, não pela empresa de segurança oficial — contrato paralelo e não declarado. Tem dívidas de jogo e aceitou o trabalho "sem fazer perguntas". Encontrou Gilberto dentro da fábrica duas vezes antes da noite do crime e não o expulsou — porque Gilberto lhe deu dinheiro.',
        objectives: 'Proteger o seu emprego e não ser implicado numa morte.',
        secrets: 'Na noite do crime, não estava no posto — estava numa casa de apostas a 12 km. Salavessa sabe e usa isso para o controlar.',
        alibi: 'Afirma ter rondado o perímetro. O registo do crachá diz o contrário.',
        isKiller: true,
        isDetective: false,
      },
    ],
    evidence: [
      { stageIdx: 0, title: 'Relatório da Polícia — Acidente ou Crime?', description: 'O relatório policial classifica como acidente. Mas o médico legista privado contratado pela família detecta inconsistências.', type: EvidenceType.document, contentText: 'NOTA DO MÉDICO LEGISTA PRIVADO:\nAs lesões são extensas e consistentes com queda de altura. No entanto: (1) ausência de lesões defensivas nas mãos — atípico para quedas conscientes; (2) hematoma occipital anterior à queda, sugerindo golpe prévio; (3) posição do corpo inconsistente com trajectória de queda da passagem identificada.' },
      { stageIdx: 0, title: 'Registo de Crachás — Portão Principal', description: 'Sistema de acesso da empresa de segurança oficial. Vítor Campos não registou entrada após as 20h47 na noite do crime.', type: EvidenceType.document, isRedHerring: false },
      { stageIdx: 1, title: 'Dossier dos Casos Anteriores', description: 'Filomena compilou os obituários e relatórios de acidente dos dois ex-operários mortos. Os três casos partilham o mesmo classificador: "acidente de trabalho póstumo".', type: EvidenceType.document, contentText: 'CASO 1 — Manuel Dinis, 2022: queda de escadas em casa. Era testemunha principal no processo de amianto.\nCASO 2 — Rosa Faria, 2023: atropelamento. Tinha recolhido 47 assinaturas de ex-operários para peticionar ao tribunal.\nCASO 3 — Gilberto Ramos, 2024: queda na fábrica. Tinha localizado o arquivo interno.' },
      { stageIdx: 2, title: 'Relatório Interno de 1998 — Exposição ao Amianto', description: 'Documento encontrado no arquivo da fábrica. Assinado por Marta Silveira e Henrique Salavessa. Confirma conhecimento dos riscos em 1998.', type: EvidenceType.document, contentText: 'RELATÓRIO CONFIDENCIAL — TEXTÍLIA DO MONDEGO\nData: 14/09/1998\nAssunto: Avaliação de Risco — Fibras de Amianto\n\nConclusão: Níveis de exposição na secção de tecelagem excedem em 340% os limites legais. Recomenda-se evacuação imediata e substituição total do isolamento.\n\nDecisão da administração: Manter laboração. Instalar ventilação adicional. Não informar os operários.\n\nAssinaturas: H. Salavessa / M. Silveira' },
      { stageIdx: 2, title: 'Telemóvel de Vítor Campos — Localização', description: 'Dados de localização do telemóvel de serviço. Na noite do crime, o dispositivo esteve 12km da fábrica entre 21h e 23h30.', type: EvidenceType.object, contentText: 'DADOS DE LOCALIZAÇÃO (operadora):\n20:47 — Portão principal fábrica\n21:03 — Deslocação para norte\n21:19 — Casino/Sala de Apostas Coimbra Sul (permanência: 2h11m)\n23h30 — Regresso à fábrica\n00:02 — Portão principal fábrica\n\nNOTA: Gilberto Ramos terá morrido entre 21h30 e 23h00.' },
      { stageIdx: 3, title: 'Transferência Bancária — Conta Offshore', description: 'Documento cedido anonimamente. Transferência de 15.000€ de uma conta associada a Salavessa para Vítor Campos, efectuada 48h após o crime.', type: EvidenceType.document, isRedHerring: false },
      { stageIdx: 3, title: 'SMS de Salavessa para Campos (noite do crime)', description: 'Mensagem recuperada forense do telemóvel pessoal de Campos: "Confirmado para esta noite. Não deixes rasto. A conta fica limpa depois."', type: EvidenceType.document, isRedHerring: false },
    ],
  })

  // ─────────────────────────────────────────────────────────────────────────

  await createCase(adminId, {
    slug: 'a-ultima-exposicao',
    title: 'A Última Exposição',
    shortDescription: 'Durante a inauguração de uma galeria de arte contemporânea, o curador principal é encontrado morto. O assassino está entre os convidados — e a obra de arte mais valiosa desapareceu.',
    description: `Na noite de abertura da Galeria Nox, em Lisboa, 87 convidados celebravam a estreia da colecção "Sombras do Real" quando o curador António Bravo foi encontrado sem vida na sala técnica, atrás do painel central. Causa de morte: injecção de insulina em dose letal — discreta, rápida, eficaz. A obra central da exposição, "Vácuo #1" de Maria Lusitana, avaliada em 280.000€, desapareceu da parede sem que os sistemas de alarme disparassem.

Os investigadores têm acesso ao mundo opaco do mercado de arte contemporânea: falsificações, esquemas de valorização artificial, coleccionadores com dívidas ocultas e artistas com motivações que vão muito além do reconhecimento. O assassino conhecia o espaço, tinha acesso à sala técnica e sabia desactivar o alarme — ou tinha cumplicidade de quem sabia.`,
    difficulty: CaseDifficulty.four,
    type: CaseType.digital,
    minPlayers: 3,
    maxPlayers: 8,
    estimatedMinutes: 150,
    priceDigital: null,
    isFeatured: true,
    sortOrder: 40,
    tags: ['arte', 'mistério', 'Lisboa', 'roubo', 'avançado', 'grátis'],
    coverImageUrl: 'https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=800&q=80',
    stages: [
      { order: 1, title: 'A Noite de Abertura', description: 'Reconstrução da timeline. 87 convidados, câmeras com pontos cegos, e um morto que ninguém viu sair da sala principal.' },
      { order: 2, title: 'O Mercado das Sombras', description: 'O mundo do mercado de arte contemporânea revela-se mais obscuro que as obras expostas. António tinha segredos de negócio que valiam mais que vidas.' },
      { order: 3, title: 'A Obra Desaparecida', description: 'A investigação ao roubo de "Vácuo #1" liga-se inesperadamente ao assassínio — não é coincidência.' },
      { order: 4, title: 'Falsificação', description: 'Um perito revela que pelo menos duas obras na exposição são falsificações de alta qualidade. António sabia?', isLast: false },
      { order: 5, title: 'Acusação', description: 'O motivo, o método e o culpado convergem. A obra foi o pretexto — o assassínio foi planeado meses antes.', isLast: true },
    ],
    characters: [
      {
        name: 'António Bravo',
        description: 'Curador, 54 anos. Vítima. Conhecido pela sua capacidade de descobrir novos talentos e pelo seu gosto controverso.',
        backstory: 'Vítima — perfil fornecido para contextualizar a investigação. António construiu a sua reputação identificando artistas antes do mercado. Nos últimos dois anos, tornou-se suspeito de gonflação artificial de preços: comprava obras a artistas desconhecidos, criava exposições mediáticas e vendia a coleccionadores que depois revendiam com margens enormes. Tinha inimigos em ambos os lados — artistas que sentiam ter sido explorados e coleccionadores que tinham pago preços inflacionados.',
        objectives: 'N/A — vítima.',
        secrets: 'Tinha descoberto recentemente que "Vácuo #1" era uma falsificação. Planeava revelar o facto na abertura, o que destruiria a reputação da artista e de pelo menos dois coleccionadores presentes.',
        alibi: 'N/A',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Maria Lusitana',
        description: 'Artista, 36 anos. Criadora de "Vácuo #1". A estrela da noite — ou seria?',
        backstory: 'Descoberta por António há três anos. A sua obra passou de 800€ para 280.000€ em 36 meses — uma valorização que o mercado considera impossível sem manipulação. Maria está convicta de que o seu talento justifica os preços. Ou estaria. António revelou-lhe no dia anterior que "Vácuo #1" seria retirada por ser "tecnicamente problemática" — eufemismo para falsificação que ela não compreendeu completamente.',
        objectives: 'Proteger a sua reputação e a valorização das suas obras.',
        secrets: 'A obra original de "Vácuo #1" foi substituída por uma cópia três semanas antes da exposição — sem o seu conhecimento, ela afirma. Mas tem conhecimentos técnicos avançados e um atelier equipado.',
        alibi: 'Estava no centro da sala durante toda a abertura — rodeada de admiradores. Múltiplas testemunhas.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Dr. Bernardo Queirós',
        description: 'Coleccionador, 68 anos. Comprou três obras de Maria Lusitana pelo valor total de 520.000€.',
        backstory: 'Médico reformado, coleccionador desde os 40 anos. Tem diabetes tipo 1 — usa insulina diariamente. Comprou as obras como investimento, convicto de que continuariam a valorizar. Se a falsificação for confirmada, as suas obras perdem 90% do valor. António planeava revelar o esquema publicamente, o que tornaria Bernardo o "coleccionador enganado" — humilhação pública e perda financeira simultâneas.',
        objectives: 'Impedir a revelação pública e recuperar o dinheiro investido.',
        secrets: 'Tem insulina na sua bolsa em todos os eventos sociais — facto documentado e conhecido. O veneno usado foi insulina de acção rápida, tipo idêntico ao que usa.',
        alibi: 'No bar da galeria entre 21h e 22h30. Saiu brevemente "para fumar" às 21h47 — sem testemunhas por 18 minutos.',
        isKiller: true,
        isDetective: false,
      },
      {
        name: 'Lena Voss',
        description: 'Galerista alemã, 45 anos. Representante europeia para obras de artistas portugueses emergentes.',
        backstory: 'Parceira de negócios de António há 6 anos. Comissionou a valorização artificial de várias obras que depois revendeu na Alemanha, Suíça e Emirados. A sua comissão sobre "Vácuo #1" seria de 42.000€. Se o esquema for revelado, a sua galeria em Berlim perde a licença e ela enfrenta processos em três países.',
        objectives: 'Garantir que o esquema nunca se torna público e recuperar "Vácuo #1" para revenda discreta.',
        secrets: 'É ela quem organizou a substituição da obra original. A cópia foi feita por um falsificador profissional contratado por ela. António descobriu e confrontou-a — daí a revelação planeada.',
        alibi: 'A fotografar obras com o telemóvel durante a abertura. Metadata das fotos confirma — mas podem ter sido tiradas por outra pessoa.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Ricardo Neves',
        description: 'Técnico de instalação da galeria, 31 anos. Instalou e conhece todos os sistemas de segurança.',
        backstory: 'Freelancer contratado especificamente para esta exposição. Tem um passado de pequenos crimes — dois processos arquivados por roubo. Foi contratado com uma recomendação de Lena Voss, não através do processo normal da galeria. É o único não-convidado com acesso à sala técnica.',
        objectives: 'Cumprir o trabalho para o qual foi pago e desaparecer.',
        secrets: 'Foi pago 8.000€ em dinheiro por Lena Voss para desactivar o alarme da sala onde "Vácuo #1" estava e facilitar a remoção. Não sabia que haveria um assassínio.',
        alibi: 'Sala técnica durante toda a noite — "a monitorizar os sistemas". Não tem testemunhas.',
        isKiller: false,
        isDetective: true,
      },
    ],
    evidence: [
      { stageIdx: 0, title: 'Timeline da Câmera de Segurança', description: 'Sistema de 12 câmeras com 3 pontos cegos documentados. A sala técnica não tem câmera — só a porta de acesso.', type: EvidenceType.document, contentText: 'PONTOS CEGOS:\n- Corredor técnico lateral (18m)\n- Sala técnica (completo)\n- Acesso ao armazém inferior\n\nREGISTOS RELEVANTES:\n21h42 — António Bravo entra no corredor técnico\n21h48 — Pessoa não identificada (altura aprox. 175cm, casaco escuro) entra no corredor\n22h04 — Mesma pessoa sai do corredor sozinha\n22h31 — António Bravo não aparece em nenhuma câmera após as 21h42' },
      { stageIdx: 0, title: 'Causa de Morte — Laudo Forense', description: 'Injecção de insulina de acção rápida (lispro) no pescoço. Dose: 80 unidades — letal em adulto não diabético em 15 a 30 minutos.', type: EvidenceType.document, contentText: 'A vítima não era diabética. A injecção foi feita com seringa de 1ml padrão. O ponto de injecção (pescoço, zona posterior) sugere que a vítima foi surpreendida ou imobilizada brevemente. Não há sinais de luta.' },
      { stageIdx: 1, title: 'Contrato de Representação — Lena Voss', description: 'Contrato confidencial encontrado no escritório de António. Cláusula 7: comissão de 15% sobre valorização de obras acima de 100.000€.', type: EvidenceType.document, isRedHerring: false },
      { stageIdx: 1, title: 'Email de António — Dia Anterior ao Crime', description: 'Email enviado para o advogado de António às 16h do dia anterior. Assunto: "Preciso de aconselhamento legal urgente — falsificação".', type: EvidenceType.document, contentText: 'Paulo,\nDescobri algo grave. Uma das obras centrais da exposição de amanhã é uma falsificação de alta qualidade. Sei quem organizou a substituição e tenho provas. Preciso de saber como posso revelar isto publicamente sem me expor legalmente — estive envolvido na valorização das obras, mesmo sem saber que havia falsificação.\nAntónio' },
      { stageIdx: 2, title: 'Parede Vazia — Análise Forense', description: 'A parede onde estava "Vácuo #1" tem marcas de sistema de ancoragem especializado — não o sistema padrão da galeria.', type: EvidenceType.object, contentText: 'O sistema usado para instalar "Vácuo #1" era diferente das outras obras: parafusos de aço inoxidável com rosca específica, não disponíveis em lojas de construção. A remoção requer ferramenta própria. Ricardo Neves foi visto com uma mala de ferramentas incomum na montagem.' },
      { stageIdx: 3, title: 'Relatório do Perito em Arte', description: 'A obra "Vácuo #3" (ainda presente) é identificada como falsificação. Tinta com componentes químicos pós-2020 em obra datada de 2019.', type: EvidenceType.document, contentText: 'ANÁLISE ESPECTROMÉTRICA\nObra: Vácuo #3, Maria Lusitana, 2019\nResultado: Pigmento azul cobalto com aditivo sintético introduzido no mercado em Q3 2021. A obra não pode ter sido criada em 2019.\nConclusão: Falsificação de alta qualidade, executada entre 2021 e 2023.' },
      { stageIdx: 3, title: 'Transferência Bancária — Ricardo Neves', description: '8.000€ em numerário depositados na conta de Ricardo Neves 10 dias antes da exposição. Origem: levantemento ATM em Berlim.', type: EvidenceType.document, isRedHerring: false },
      { stageIdx: 4, title: 'Bolsa de Bernardo Queirós — Inventário', description: 'Autorizado pelo advogado durante a detenção preventiva. Conteúdo: carteira, telemóvel, caneta, pastilhas, e estojo de insulina — com uma seringa em falta do conjunto de três.', type: EvidenceType.object, contentText: 'ESTOJO MÉDICO (Dr. Bernardo Queirós):\n- Caneta de insulina glargina (basal) — completa\n- Seringas 1ml: 2 unidades (estojo para 3)\n- Álcool em gel\n- Glucómetro\n\nNOTA: O Dr. Queirós afirma ter usado uma seringa "mais cedo" mas não regista administração de insulina no seu diário médico nesse dia.', isRedHerring: false },
    ],
  })

  console.log('✅ 4 casos gratuitos criados\n')

  // ── 4 CASOS PAGOS ─────────────────────────────────────────────────────────

  await createCase(adminId, {
    slug: 'operacao-tejo-negro',
    title: 'Operação Tejo Negro',
    shortDescription: 'Um agente dos serviços secretos é encontrado morto nas margens do Tejo. O seu dossiê classificado — que provaria a existência de uma rede de espionagem industrial em Portugal — desapareceu.',
    description: `O agente Luís Ferraz, 41 anos, oficial do Serviço de Informações de Segurança, foi encontrado morto nas margens do Tejo em Santarém, com uma bala de 9mm no peito. Causa oficial: assalto à mão armada. Causa real, que a SIS não pode reconhecer publicamente: execução.

Ferraz conduzia há 18 meses a Operação Tejo Negro — investigação à infiltração de agentes de uma potência estrangeira em empresas tecnológicas portuguesas. O seu dossiê classificado continha identidades, provas e contactos que teriam resultado em dezenas de detenções. O dossiê desapareceu.

Os investigadores trabalham para um cliente anónimo com credenciais que sugerem ligação às mais altas esferas do Estado. O caso implica acesso a informação compartimentada, análise de comunicações interceptadas e navegação num mundo onde ninguém é quem parece ser — incluindo o próprio cliente.`,
    difficulty: CaseDifficulty.five,
    type: CaseType.digital,
    minPlayers: 3,
    maxPlayers: 6,
    estimatedMinutes: 180,
    priceDigital: 12.99,
    pricePhysical: 34.99,
    isFeatured: true,
    sortOrder: 50,
    tags: ['espionagem', 'thriller', 'portugal', 'avançado', 'pago'],
    coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    stages: [
      { order: 1, title: 'A Cena do Crime', description: 'As margens do Tejo ao amanhecer. O corpo, a bala, e o que estava — e não estava — nos bolsos de Ferraz.' },
      { order: 2, title: 'Quem Era Ferraz', description: 'O perfil do agente, as suas últimas 48 horas e os contactos suspeitos. Um nome em código aparece repetidamente: ATLAS.' },
      { order: 3, title: 'A Rede', description: 'O dossiê parcialmente reconstruído revela a estrutura da rede de espionagem. Quatro empresas, três embaixadas, dois agentes activos.' },
      { order: 4, title: 'ATLAS', description: 'A identidade de ATLAS — o topo da rede — começa a emergir. Mas quem enviou os investigadores para este caso?', isLast: false },
      { order: 5, title: 'Duplo Jogo', description: 'A revelação final: o cliente anónimo tem agenda própria. A verdade sobre Ferraz é mais complexa do que parecia.', isLast: true },
    ],
    characters: [
      {
        name: 'Coronel Américo Fonseca',
        description: 'Director-adjunto da SIS, 58 anos. Superior hierárquico de Ferraz. Aparentemente cooperante com a investigação.',
        backstory: 'Veterano dos serviços de informações. Foi ele que lançou a Operação Tejo Negro — e também foi ele que a encerrou abruptamente dois dias antes da morte de Ferraz, alegando "falta de substância". Tem acesso ao dossiê original e ao cofre onde estava guardado. A sua trajectória é impecável — demasiado impecável para um ambiente tão opaco.',
        objectives: 'Controlar o que os investigadores descobrem e garantir que certas verdades nunca chegam a julgamento.',
        secrets: 'É ATLAS. Recrutado há 12 anos por uma potência estrangeira. Autorizou a morte de Ferraz quando este descobriu a sua identidade.',
        alibi: 'Em reunião ministerial em Lisboa no momento da morte. Documentado.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Isabel Vaz',
        description: 'Analista da SIS, 34 anos. Parceira de trabalho de Ferraz. A única pessoa que sabia o que ele tinha descoberto.',
        backstory: 'Trabalhou lado a lado com Ferraz durante toda a investigação. Ela digitalizou partes do dossiê por precaução — sem autorização. Após a morte do parceiro, fugiu para o Norte, desligou o telemóvel e usa apenas computadores públicos. Está em pânico mas tem as provas mais cruciais do caso.',
        objectives: 'Sobreviver e garantir que as provas cheguem às pessoas certas.',
        secrets: 'Sabe que o dossiê foi acedido pelo Coronel Fonseca na noite anterior à morte de Ferraz. Tem cópias das comunicações interceptadas que identificam ATLAS.',
        alibi: 'Desaparecida — localização desconhecida.',
        isKiller: false,
        isDetective: true,
      },
      {
        name: 'Dmitri Orlov',
        description: 'Adido cultural da embaixada russa, 47 anos. Diplomaticamente imune. Cruzou o caminho de Ferraz várias vezes.',
        backstory: 'Oficial de inteligência do GRU sob cobertura diplomática. Identificado por Ferraz como coordenador da rede em Portugal, mas sem provas judicialmente admissíveis. Tem imunidade diplomática total. A sua presença em Santarém no dia anterior ao crime foi captada por câmeras de trânsito.',
        objectives: 'Garantir que a operação continua sem interrupção e que nenhum agente activo é exposto.',
        secrets: 'Foi ele quem executou Ferraz — a pedido de ATLAS. Tem o dossiê original em posse diplomática, tecnicamente intocável.',
        alibi: 'Imunidade diplomática — não pode ser questionado sem autorização do Ministério.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Engenheira Catarina Sousa',
        description: 'CEO de uma startup tecnológica de Braga, 39 anos. A empresa é uma das quatro identificadas na rede.',
        backstory: 'Fundou a empresa há 6 anos com capital europeu. Especialista em software de gestão logística para portos — produto estratégico. Ferraz suspeitava que ela vendia dados de movimentação de cargas militares americanas que passam por Sines. Catarina jura que não sabia que os seus clientes usavam o software para espionagem.',
        objectives: 'Proteger a empresa e provar que é vítima, não cúmplice.',
        secrets: 'Conhece Orlov — ele foi apresentado como "consultor de expansão para mercados de leste" por um intermediário. As reuniões estão documentadas no seu email.',
        alibi: 'Em Braga durante toda a semana do crime. Verificado.',
        isKiller: false,
        isDetective: false,
      },
    ],
    evidence: [
      { stageIdx: 0, title: 'Relatório Balístico', description: 'Projéctil 9mm, calibre Parabellum. Arma não recuperada. Ângulo de entrada: disparo efectuado de frente, distância inferior a 2 metros. Executado por alguém conhecido — não houve tentativa de fuga.', type: EvidenceType.document, contentText: 'BALÍSTICA — caso 2024/Ferraz\nMunição: 9×19mm FMJ, fabricação Eastern European (identificação parcial)\nDistância estimada: 1.2–1.8m\nÂngulo: entrada anterior, ligeiramente descendente — atirador mais alto que a vítima ou em posição elevada\nVítima: sem lesões defensivas. Posição do corpo: queda para trás, directa. A vítima não tentou fugir.' },
      { stageIdx: 0, title: 'Últimas Chamadas de Ferraz', description: 'Log do telemóvel de trabalho — o pessoal não foi recuperado. Três chamadas nas últimas 2 horas: duas para números encriptados, uma para o Coronel Fonseca.', type: EvidenceType.document, contentText: 'CHAMADAS (dia do crime, telemóvel profissional):\n18:42 — Nr. encriptado A (4 min 17s)\n19:11 — Nr. encriptado B (23s — chamada terminada pelo receptor)\n19:34 — Coronel A. Fonseca (1 min 02s)\n[Sem chamadas posteriores]\n\nNOTA: Fonseca afirma que Ferraz lhe comunicou "que estava a caminho de casa". Não mencionou qualquer reunião.' },
      { stageIdx: 1, title: 'Diário de Campo de Ferraz — Últimas Entradas', description: 'Diário físico recuperado de um cofre numa agência bancária — Ferraz tinha uma instrução legal de entrega em caso de morte.', type: EvidenceType.document, contentText: '...ATLAS não está na rede — ATLAS é a rede. Estrutura radial, não hierárquica. Todos os agentes activos reportam directamente.\n\n...Confirmado: ATLAS tem acesso ao sistema interno da SIS. Só há seis pessoas com esse nível de acesso. Tenho de falar com o ministro directamente — não posso usar os canais internos.\n\n...Amanhã vejo o Coronel pela última vez. Se ele é quem suspeito, não vai terminar bem. Mas preciso de o confrontar com a prova antes de ir ao ministro.' },
      { stageIdx: 2, title: 'Organograma Parcial da Rede', description: 'Reconstrução baseada em fragmentos do dossiê e comunicações interceptadas. Quatro nós identificados, o nó central (ATLAS) com ponto de interrogação.', type: EvidenceType.document, contentText: 'NÓS CONFIRMADOS:\n- Dmitri Orlov (coordenação operacional)\n- Empresa Logística Nortenha (dados portuários)\n- Startup C. Sousa (software logístico)\n- Funcionário ministerial não identificado (acesso regulatório)\n\nNÓ CENTRAL — ATLAS:\n- Acesso ao sistema SIS confirmado por log de auditoria\n- Comunicação via canal encriptado próprio (protocolo não padrão)\n- Identificado em fragmento como "alguém de confiança do Estado"' },
      { stageIdx: 3, title: 'Log de Acesso ao Cofre do Dossiê', description: 'Sistema de auditoria do cofre classificado onde o dossiê estava. Último acesso antes do desaparecimento: 23h47 do dia anterior ao crime. Código de utilizador: AF-0041.', type: EvidenceType.document, contentText: 'AUDITORIA DE COFRE — CLASSIFICADO\nData: [dia anterior ao crime], 23:47\nUtilizador: AF-0041\nNível de acesso: Director-Adjunto\nDocumento acedido: Dossiê Tejo Negro (completo)\nDuração: 12 minutos\nDocumento removido: Sim\n\nNOTA: AF-0041 = Coronel Américo Fonseca\nNOTA: O sistema de auditoria é normalmente verificado apenas semanalmente — este log só foi descoberto pelos investigadores ao solicitarem registos completos.' },
      { stageIdx: 4, title: 'Mensagem Encriptada de Isabel Vaz', description: 'Recebida pelos investigadores através de um canal seguro. Isabel Vaz quebra o silêncio.', type: EvidenceType.document, contentText: 'Não sei em quem confiar mas preciso que saibam:\n\nO Ferraz descobriu que o Coronel Fonseca tinha um segundo telemóvel — nunca declarado, número russo. Eu vi o Fonseca a ligar para esse número na noite antes de o Ferraz morrer.\n\nA prova está num servidor na Islândia. Passo o acesso apenas se garantirem a minha segurança através de um canal que o Fonseca não controle.\n\nTomem cuidado com quem vos contratou para este caso.\n— I.' },
    ],
  })

  // ─────────────────────────────────────────────────────────────────────────

  await createCase(adminId, {
    slug: 'a-heranca-dos-medeiros',
    title: 'A Herança dos Medeiros',
    shortDescription: 'O patriarca de uma família de proprietários rurais alentejanos é encontrado morto na véspera de assinar a divisão da herdade. Cinco filhos, uma fortuna, e uma família que se desfaz.',
    description: `Manuel Medeiros, 82 anos, patriarca de uma das maiores propriedades agrícolas do Alentejo, foi encontrado morto no seu escritório na Herdade do Sobreiro Branco em Évora. Causa aparente: paragem cardíaca. Mas o médico de família recusou assinar o certificado de óbito — havia algo errado nos olhos da vítima.

A toxicologia confirma: envenenamento por digitálica em dose quase indetectável. Alguém com conhecimento médico ou acesso a fontes botânicas — o Alentejo está cheio de ambas. Na manhã seguinte à sua morte, Manuel deveria ter assinado um novo testamento que retirava dois dos cinco filhos da herança. Esse testamento nunca foi assinado — o testamento anterior, que divide a herdade igualmente, permanece válido.

O caso é uma viagem ao interior de uma família portuguesa com décadas de ressentimentos acumulados, segredos intergeracionais e a pressão implacável da terra, do dinheiro e do sangue.`,
    difficulty: CaseDifficulty.four,
    type: CaseType.digital,
    minPlayers: 3,
    maxPlayers: 8,
    estimatedMinutes: 150,
    priceDigital: 9.99,
    isFeatured: false,
    sortOrder: 60,
    tags: ['família', 'herança', 'alentejo', 'veneno', 'drama', 'pago'],
    coverImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    stages: [
      { order: 1, title: 'A Herdade', description: 'Chegada à propriedade. Apresentação dos cinco filhos e do médico de família. A dinâmica familiar revela-se imediatamente tensa.' },
      { order: 2, title: 'O Testamento que Nunca Foi', description: 'O advogado da família revela o conteúdo do novo testamento. Dois filhos seriam excluídos — qual dos dois sabia?' },
      { order: 3, title: 'A Digitálica', description: 'A fonte do veneno é encontrada: plantas de Digitalis purpurea cultivadas num canto escondido da propriedade. Quem as plantou e quando?' },
      { order: 4, title: 'Segredos da Terra', description: 'O passado de Manuel emerge: negócios escondidos, um filho ilegítimo desconhecido pela maioria, e uma dívida de honra antiga.', isLast: true },
    ],
    characters: [
      {
        name: 'António Medeiros',
        description: 'Filho mais velho, 58 anos. Gere a herdade há 20 anos. Rígido, tradicional, convicto de que a terra não deve ser dividida.',
        backstory: 'Dedicou a vida à herdade enquanto os irmãos foram para a cidade estudar e trabalhar. Considera que a propriedade lhe pertence por direito de trabalho, não de herança. Descobriu há dois meses que o novo testamento o excluía completamente — Manuel considerava que António já tinha "sido pago em vida" com décadas de salário e habitação.',
        objectives: 'Manter o controlo da herdade e impedir a sua fragmentação.',
        secrets: 'Sabia do novo testamento porque interceptou uma carta do advogado. Tem conhecimentos botânicos avançados — criou o jardim medicinal da propriedade há 15 anos.',
        alibi: 'Afirma ter dormido na sua casa na propriedade. Não há testemunhas.',
        isKiller: true,
        isDetective: false,
      },
      {
        name: 'Dra. Filipa Medeiros',
        description: 'Filha, 54 anos. Médica cardiologista em Lisboa. Visita raramente.',
        backstory: 'A filha "bem-sucedida" que saiu do Alentejo aos 18 anos e nunca olhou para trás. Tem uma relação fria com o pai, que nunca aprovou as suas escolhas — casamento, carreira, estilo de vida. Com o novo testamento, seria uma das excluídas. Mas Filipa tem uma vantagem: conhecimento médico preciso sobre digitálica — e prescreve-a regularmente a doentes cardíacos.',
        objectives: 'Garantir a sua parte da herança e fechar o capítulo do pai na sua vida.',
        secrets: 'Tinha uma relação melhor com o pai do que aparentava — encontravam-se mensalmente em Évora sem contar à família. Manuel contou-lhe sobre o novo testamento pessoalmente, esperando a sua compreensão. Não obteve.',
        alibi: 'Chegou à herdade nessa tarde, após a morte do pai. Confirmado pelo GPS do carro.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Padre Tomé Alves',
        description: 'Pároco da aldeia, 71 anos. Confidente de Manuel há 30 anos. Não é familiar mas estava na propriedade naquela noite.',
        backstory: 'Amigo íntimo de Manuel desde a juventude. Sabia de todos os segredos do patriarca — incluindo a existência de um filho ilegítimo que nenhum dos filhos legítimos conhece. Foi ele que aconselhou Manuel a fazer o novo testamento. Estava na herdade para jantar e pernoitar, como fazia frequentemente.',
        objectives: 'Proteger os segredos de Manuel e garantir que a sua memória seja honrada.',
        secrets: 'Conhece a identidade do filho ilegítimo. Manuel deixou-lhe uma carta selada para ser aberta apenas se morresse em "circunstâncias não naturais" — o padre ainda não a abriu.',
        alibi: 'No quarto de hóspedes. Afirma ter ouvido Manuel no escritório até às 23h.',
        isKiller: false,
        isDetective: true,
      },
      {
        name: 'Graça Medeiros',
        description: 'Nora, 52 anos. Casada com António há 28 anos. Gestora da componente turística da herdade.',
        backstory: 'Construiu o agro-turismo da herdade do zero e transformou-o no principal gerador de receita. Legalmente, nada lhe pertence — tudo está em nome de António. Se António for excluído da herança, o trabalho de três décadas desaparece. Teve uma relação próxima com Manuel — mais próxima do que António sabia.',
        objectives: 'Proteger o investimento de vida e garantir o futuro do turismo rural que criou.',
        secrets: 'Sabe que as plantas de Digitalis no jardim foram plantadas por António há seis meses — ela própria o questionou sobre elas. Não disse nada porque protege o marido.',
        alibi: 'Preparando o pequeno-almoço para hóspedes desde as 06h. Verificado por três hóspedes.',
        isKiller: false,
        isDetective: false,
      },
    ],
    evidence: [
      { stageIdx: 0, title: 'Relatório Toxicológico', description: 'Digitoxina em concentração de 4.2 ng/mL — acima do limiar tóxico (3.0). A dose foi administrada ao longo de várias horas, provavelmente via ingestão (chá ou vinho).', type: EvidenceType.document, contentText: 'TOXICOLOGIA — Manuel Medeiros\nSubstância: Digitoxina (glicósido cardíaco)\nConcentração sérica: 4.2 ng/mL (limiar tóxico: 3.0)\nVia de administração: provavelmente oral — níveis gastrointestinais consistentes\nJanela de administração: 4 a 8 horas antes da morte\nNOTA: Manuel tomava digoxina prescrita para fibrilação auricular. A digitoxina é um composto diferente — não constava da sua medicação.' },
      { stageIdx: 0, title: 'Último Jantar — Inventário', description: 'O jantar foi preparado por Graça. Mesa do escritório: garrafa de vinho do Alentejo (aberta), dois copos (um com batom), queijo curado, e uma chávena de chá de ervas.', type: EvidenceType.object, contentText: 'ANÁLISE DO COPO COM BATOM:\nBatom cor borgonha — não é a cor que Graça usa (confirmado). ADN feminino na borda — análise em curso.\n\nANÁLISE DO CHÁ:\nResiduos de Digitalis purpurea — concentração significativa\nA chávena pertencia a Manuel — o segundo copo (com batom) não tinha chá.\n\nCONCLUSÃO: Alguém jantou com Manuel naquela noite. Quem?' },
      { stageIdx: 1, title: 'Carta do Advogado — Novo Testamento', description: 'Cópia do novo testamento preparado mas nunca assinado. António e Filipa excluídos. Os outros três filhos dividem a propriedade.', type: EvidenceType.document, contentText: 'DISPOSIÇÕES PRINCIPAIS (versão não assinada):\n- Herdade do Sobreiro Branco: dividida igualmente entre Rosário, João e Miguel Medeiros\n- António Medeiros: excluído (justificação: "remunerado adequadamente ao longo de décadas")\n- Filipa Medeiros: excluída (justificação: "por vontade expressa sua, declarada em conversa de [data]")\n- Legado adicional de 50.000€: destinado a pessoa a identificar em codicilo selado\n\nNOTA DO ADVOGADO: Manuel referiu o codicilo mas nunca o entregou.' },
      { stageIdx: 2, title: 'Jardim Medicinal — Relatório Botânico', description: 'Vistoria ao jardim identificou cinco plantas de Digitalis purpurea com 6 a 8 meses de crescimento. Plantadas fora da estação habitual — requereram cuidados especiais.', type: EvidenceType.document, contentText: 'RELATÓRIO BOTÂNICO:\nEspécie: Digitalis purpurea (dedaleira)\nIdade estimada: 6–8 meses\nCondição: saudável, com sinais de rega manual regular\nLocalização: canto nordeste do jardim, parcialmente oculto por sebes\nNOTA: A plantação em Setembro (fora da época) requer conhecimento específico de horticultura. As folhas mais antigas apresentam sinais de colheita recente.' },
      { stageIdx: 2, title: 'Caderno de Notas do Jardim — António', description: 'Caderno encontrado na casinha de ferramentas. Registos meticulosos das plantas, incluindo as dedaleiras. Entrada de há 3 semanas: "testar extracção — ver pág. 47 do manual".', type: EvidenceType.document, contentText: 'EXTRACTOS DO CADERNO:\n[6 meses atrás] "Plantei as dedaleiras no canto N. Graça perguntou para quê. Disse que eram decorativas."\n[3 semanas atrás] "Testar extracção — ver pág. 47 do manual de farmacognosia."\n[2 semanas atrás] "Método funciona. Concentração suficiente. Paciência."', isRedHerring: false },
      { stageIdx: 3, title: 'Carta Selada do Padre Tomé', description: 'Aberta pelos investigadores com autorização judicial. Manuel confessa a existência de um filho ilegítimo — e revela que este estava presente na propriedade naquela noite como funcionário temporário.', type: EvidenceType.document, contentText: 'Carta de Manuel Medeiros, selada para abertura em caso de morte não natural:\n\n"Se estás a ler isto, aconteceu o que sempre temi. Um dos meus filhos descobriu o que estava no novo testamento e não aceitou.\n\nO codicilo selado que não entregues ao advogado dá ao meu filho Dário — filho da Teresa Brás, nascido em 1971 — o direito sobre a parte norte da herdade. Dário trabalha aqui há dois meses como auxiliar de turismo. Nenhum dos filhos legítimos sabe quem ele é.\n\nProtege-o, Tomé. Ele não tem culpa de nada."', isRedHerring: false },
    ],
  })

  // ─────────────────────────────────────────────────────────────────────────

  await createCase(adminId, {
    slug: 'o-algoritmo',
    title: 'O Algoritmo',
    shortDescription: 'O CEO de uma startup de inteligência artificial é encontrado morto no seu escritório em Lisboa. O seu código-fonte — que valerá biliões — desapareceu. E o assassino pode ser uma das suas próprias criações.',
    description: `Pedro Saraiva, 37 anos, fundador e CEO da NovaMente AI, foi encontrado morto no 12º andar do edifício de escritórios de Parque das Nações por um segurança de madrugada. Causa de morte: paragem cardíaca induzida por estimulação eléctrica — um método sofisticado que requer conhecimento avançado de electrónica médica. O seu laptop e os servidores locais estavam completamente apagados. O backup na cloud foi eliminado com autorização do próprio login de Pedro — entre as 02h e as 03h da manhã.

A NovaMente desenvolvia um sistema de IA generativa aplicado a diagnóstico médico que tinha atraído uma oferta de aquisição de 2,3 mil milhões de euros de um consórcio americano. A assinatura estava prevista para a semana seguinte. Agora, sem o código, a empresa não vale nada.

O caso explora o mundo das startups tecnológicas, a ética da inteligência artificial e um crime que pode ter sido planeado — em parte — por uma máquina.`,
    difficulty: CaseDifficulty.five,
    type: CaseType.digital,
    minPlayers: 3,
    maxPlayers: 6,
    estimatedMinutes: 180,
    priceDigital: 14.99,
    pricePhysical: 39.99,
    isFeatured: true,
    sortOrder: 70,
    tags: ['tecnologia', 'IA', 'Lisboa', 'startup', 'expert', 'pago'],
    coverImageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80',
    stages: [
      { order: 1, title: 'A Startup', description: 'O escritório, o corpo, e o ecossistema da NovaMente. Quem estava no edifício? O sistema de controlo de acesso foi manipulado.' },
      { order: 2, title: 'O Código Que Desapareceu', description: 'A análise forense digital revela como o código foi apagado — e que alguém o copiou antes de apagar.' },
      { order: 3, title: 'Os Investidores', description: 'A oferta de 2,3 mil milhões tinha concorrentes. Um deles fez tudo para que a venda não acontecesse — incluindo uma contra-oferta recusada 48h antes do crime.' },
      { order: 4, title: 'A IA Testemunha', description: 'O sistema de IA da NovaMente mantinha logs de conversação com Pedro. As últimas sessões revelam que Pedro sabia que estava em perigo.', isLast: false },
      { order: 5, title: 'O Método', description: 'A técnica de estimulação eléctrica aponta para um perfil muito específico. Há apenas três pessoas em Portugal com esse conhecimento documentado.', isLast: true },
    ],
    characters: [
      {
        name: 'Diana Costa',
        description: 'CTO da NovaMente, 34 anos. Co-fundadora e responsável técnica. Escreveu 60% do código-fonte.',
        backstory: 'Amiga de Pedro desde a universidade. Criou a NovaMente com ele, mas o acordo original dava-lhe 30% da empresa. Quando Pedro renegociou os termos para a entrada de investidores, a quota de Diana baixou para 12%. Com a aquisição a 2,3 mil milhões, Pedro receberia 1.8 mil milhões e Diana apenas 275 milhões — o que considera uma traição ao acordo original. Nos últimos meses, consultou advogados sobre a possibilidade de contestar os termos.',
        objectives: 'Recuperar o que considera que lhe pertence por direito.',
        secrets: 'Tem uma cópia completa do código-fonte — fez backup pessoal há três semanas, quando percebeu que a situação estava a deteriorar-se. Está em contacto com o consórcio americano independentemente de Pedro.',
        alibi: 'Em casa, confirmado por dados de Wi-Fi do router doméstico. Mas o router pode ser manipulado.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Ricardo Faria',
        description: 'Investidor principal, 55 anos. Fundo de venture capital português. Detentor de 35% da NovaMente.',
        backstory: 'Investiu 8 milhões na NovaMente em duas rondas. A aquisição daria-lhe um retorno de 805 milhões — o maior da história do seu fundo. Mas Pedro tinha revelado três dias antes que estava a considerar rejeitar a oferta americana e continuar independente. Ricardo viu os 805 milhões ameaçados por um fundador de 37 anos com ideais.',
        objectives: 'Garantir que a venda acontece, com ou sem Pedro.',
        secrets: 'Tem procuração para assinar contratos em nome da NovaMente em certas circunstâncias — condição que negociou dois anos atrás. Com Pedro morto e sem herdeiros designados, pode ter base legal para forçar a venda.',
        alibi: 'Jantar com clientes no Bairro Alto até à meia-noite. Confirmado. Depois: "fui para casa".', isKiller: true,
        isDetective: false,
      },
      {
        name: 'Prof. Dra. Sónia Mira',
        description: 'Investigadora de ética em IA, Universidade de Lisboa, 48 anos. Crítica pública da NovaMente.',
        backstory: 'Publicou dois artigos académicos denunciando os riscos do sistema da NovaMente para diagnóstico médico — viéses de dados que poderiam resultar em erros de diagnóstico em populações minoritárias. Pedro respondeu publicamente que as suas críticas eram "tecnicamente desinformadas". O conflito escalou para processos de difamação mútuos. Se o sistema fosse vendido e implementado, as consequências que Sónia prevê poderiam afectar milhões.',
        objectives: 'Impedir a implementação do sistema ou forçar a sua revisão ética antes da venda.',
        secrets: 'Tem formação em engenharia biomédica — o seu doutoramento original era em estimulação eléctrica cardíaca. Mudou para ética em IA há 12 anos. Esse historial não é público.',
        alibi: 'Conferência em Braga — hospedada num hotel, check-in confirmado. Lisboa fica a 4 horas.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Engenheiro Nuno Pacheco',
        description: 'Engenheiro de hardware, 42 anos. Responsável pela infra-estrutura física dos servidores.',
        backstory: 'Funcionário desde o primeiro ano da empresa. Especialista em sistemas embebidos e hardware biomédico — a sua área anterior era dispositivos cardíacos numa empresa alemã. Recentemente recusou uma promoção que teria duplicado o seu salário noutra empresa, dizendo que era leal à NovaMente. Na realidade, estava a ser chantageado para permanecer: Pedro descobrira que Nuno copiara código proprietário da empresa anterior.',
        objectives: 'Manter o seu segredo e o seu emprego.',
        secrets: 'Foi ele que instalou o sistema de backup nos servidores — e sabe como eliminá-lo sem deixar rasto. Tem conhecimento avançado de estimulação eléctrica — trabalhou em desfibrilhadores automáticos durante 8 anos.',
        alibi: 'Afirma ter estado em casa. O seu cartão de acesso ao edifício foi usado às 02h17 — mas ele nega ter ido ao escritório.',
        isKiller: false,
        isDetective: true,
      },
    ],
    evidence: [
      { stageIdx: 0, title: 'Laudo do Médico Legista', description: 'Fibrilação ventricular induzida por corrente eléctrica de baixa voltagem e alta frequência. Marca na pele do tórax consistente com eléctrodos adesivos. Método atípico — requer planeamento e equipamento especializado.', type: EvidenceType.document, contentText: 'CAUSA DA MORTE: Fibrilação ventricular\nMECANISMO: Estimulação eléctrica externa (corrente AC, estimada 50-60Hz, baixa amperagem)\nSINAIS: Queimadura superficial circular (2.3cm) no hemitórax direito. Segundo ponto de contacto provável na zona dorsal.\nTEMPO DE MORTE: 02h15–02h45\nNOTA: Este método requer conhecimento de electrofisiologia cardíaca. Não deixa marcas visíveis sem análise forense especializada. Provavelmente seleccionado para simular paragem cardíaca natural.' },
      { stageIdx: 0, title: 'Registo de Acesso ao Edifício', description: 'Log completo do sistema de controlo de acesso por cartão RFID. Uma entrada suspeita às 02h17 com o cartão de Nuno Pacheco.', type: EvidenceType.document, contentText: 'ACESSOS — noite do crime:\n22:34 — Pedro Saraiva (saída ignorada — ficou no edifício)\n23:58 — Segurança nocturno (ronda programada)\n02:17 — Nuno Pacheco (RFID #0047) — 12º andar\n02:58 — Saída registada RFID #0047\n03:12 — Segurança nocturno descobre corpo\n\nNOTA: Nuno Pacheco afirma não ter ido ao escritório nessa noite. O cartão esteve na sua posse durante o dia mas afirma não saber o que aconteceu depois.' },
      { stageIdx: 1, title: 'Análise Forense Digital', description: 'O código foi copiado para um dispositivo externo antes de ser apagado. A cópia foi feita com credenciais de Pedro — mas os metadados indicam hardware externo não registado.', type: EvidenceType.document, contentText: 'FORENSE DIGITAL:\n- Eliminação iniciada: 02h21 (usando credenciais de Pedro Saraiva)\n- HIPÓTESE: credenciais obtidas por acesso físico ao dispositivo desbloqueado (Pedro estava morto ou inconsciente)\n- CÓPIA PRÉVIA: entre 02h03 e 02h19, 847GB transferidos para dispositivo USB (UUID não registado no sistema)\n- O dispositivo de destino não foi encontrado no local\n- Origem da transferência: workstation de Nuno Pacheco (#WS-007)' },
      { stageIdx: 2, title: 'Email da Contra-Oferta', description: 'Email enviado por Ricardo Faria a Pedro Saraiva 48h antes do crime. Tom crescentemente desesperado — a última mensagem tem tom de ameaça velada.', type: EvidenceType.document, contentText: 'De: rfaria@fundolisboa.pt\nPara: pedro@novamente.ai\nData: [48h antes]\n\nPedro,\nSe não assinares na próxima semana, o fundo vai exercer os seus direitos contratuais. Tenho advogados prontos. Pensa bem no que estás a arriscar — não só para ti, mas para toda a equipa que depende deste desfecho.\n\nEspero a tua resposta até amanhã.\nRicardo\n\nPS: A procuração que assinas-te em 2022 dá-me mais opções do que pensas.' },
      { stageIdx: 3, title: 'Logs da IA — Últimas Sessões de Pedro', description: 'O sistema de IA mantinha sessões de trabalho em linguagem natural com Pedro. As últimas 48 horas revelam o estado mental do CEO.', type: EvidenceType.document, contentText: 'SESSÃO — [2 dias antes, 23:47]\nPedro: "Se eu morrer nos próximos dias, quero que guardes o seguinte: Ricardo tem procuração. Diana tem cópia do código. Nuno sabe coisas que não devia saber. Não sei em quem confiar."\nIA: "Estás a descrever uma ameaça pessoal. Devo contactar alguém?"\nPedro: "Não. Só... lembra-te."\n\nSESSÃO — [dia anterior, 14:22]\nPedro: "Cancelei a reunião com Ricardo. Vou falar com um advogado independente esta tarde. Decidi não vender."\nIA: "Isso vai criar conflito com o fundo."\nPedro: "Já sei."' },
      { stageIdx: 4, title: 'CV de Ricardo Faria — Versão Antiga', description: 'Versão anterior do CV de Ricardo Faria, descoberta nos arquivos do LinkedIn. Inclui cargo omitido na versão actual: Director Técnico numa empresa de dispositivos médicos, 1994–2001.', type: EvidenceType.document, contentText: 'EXPERIÊNCIA PROFISSIONAL (versão 2008, arquivada):\n1994–2001: CardioTech Lisboa — Director Técnico\n  Especialização: Desfibrilhadores e estimulação cardíaca externa\n  Projecto principal: Sistema de cardioversão de emergência portátil\n\n(Este cargo foi removido do CV actualizado — apenas consta "consultor de tecnologia 1994–2001")' },
      { stageIdx: 4, title: 'Dispositivo USB — Encontrado no Escritório de Ricardo', description: 'Mandado de busca executado. Dispositivo USB encontrado numa gaveta fechada. Conteúdo: 847GB de ficheiros de código-fonte. Hash criptográfico confirma: é o código da NovaMente.', type: EvidenceType.object, contentText: 'RESULTADO DE BUSCA — Escritório Ricardo Faria:\nDispositivo: USB 3.0, 1TB, sem marca\nConteúdo: 847GB, estrutura de directórios consistente com repositório de software\nVERIFICAÇÃO: Hash SHA-256 dos ficheiros principais = correspondência 100% com backups antigos da NovaMente fornecidos por Diana Costa\nPEGADAS DACTILARES: Parciais de dois indivíduos. Uma confirmada: Ricardo Faria. Segunda: análise em curso.', isRedHerring: false },
    ],
  })

  // ─────────────────────────────────────────────────────────────────────────

  await createCase(adminId, {
    slug: 'o-convento-das-sombras',
    title: 'O Convento das Sombras',
    shortDescription: 'Uma freira é encontrada morta numa cela de um convento histórico do século XVII em Braga. A porta estava trancada por dentro. Impossível. E ainda assim, aconteceu.',
    description: `Irmã Beatriz, 71 anos, a religiosa mais antiga do Convento de Santa Clara de Braga, foi encontrada morta na sua cela numa manhã de inverno. A porta estava trancada por dentro com a chave na fechadura — do interior. A janela dá para um pátio 14 metros abaixo, sem sinais de arrombamento.

O convento existe há 347 anos. Tem 12 freiras residentes, dois funcionários laicos e uma tradição de hermetismo que os torna profundamente desconfiados de qualquer investigador exterior. A Superiora Geral aceitou a presença dos investigadores a contragosto — há pressão do Bispado para resolver o caso discretamente.

O que parece impossível tem sempre uma explicação racional. O caso desafia os jogadores a desconstruir o "quarto fechado", compreender a física e mecânica da cela, e navegar a complexa política interna de uma instituição religiosa com séculos de segredos.`,
    difficulty: CaseDifficulty.four,
    type: CaseType.digital,
    minPlayers: 2,
    maxPlayers: 6,
    estimatedMinutes: 135,
    priceDigital: 11.99,
    isFeatured: false,
    sortOrder: 80,
    tags: ['quarto fechado', 'convento', 'religião', 'impossível', 'braga', 'pago'],
    coverImageUrl: 'https://images.unsplash.com/photo-1520637836862-4d197d17c73a?w=800&q=80',
    stages: [
      { order: 1, title: 'O Quarto Fechado', description: 'A cela, a porta, a janela e o corpo. A mecânica do impossível.' },
      { order: 2, title: 'O Convento Por Dentro', description: 'As 12 freiras, a hierarquia interna e os segredos de uma instituição que não gosta de perguntas.' },
      { order: 3, title: 'O Passado de Irmã Beatriz', description: 'Antes de tomar votos, Beatriz tinha outro nome e outra vida. Alguém do passado voltou?' },
      { order: 4, title: 'A Mecânica do Crime', description: 'O método que torna o impossível possível. Arquitectura, física e engenhosidade.', isLast: true },
    ],
    characters: [
      {
        name: 'Madre Superiora Dulce',
        description: 'Superiora Geral do convento, 67 anos. Governa com mão de ferro há 18 anos.',
        backstory: 'Conhecia Beatriz há 45 anos — eram noviças juntas. A relação deteriorou-se quando Dulce foi eleita Superiora e Beatriz discordou abertamente das suas decisões. Beatriz tinha conhecimento de irregularidades financeiras no convento — doações que não constavam nos livros oficiais. Estava a ponderar denunciá-las ao Bispado.',
        objectives: 'Proteger a reputação do convento e as suas próprias decisões administrativas.',
        secrets: 'Tem acesso a um conjunto de chaves-mestre do convento que oficialmente não existe. O arquivo de 1987 mostra uma planta do convento diferente da actual — há uma passagem não mapeada.',
        alibi: 'Na sua cela, em oração, das 23h às 06h. Nenhuma testemunha.',
        isKiller: true,
        isDetective: false,
      },
      {
        name: 'Irmã Conceição',
        description: 'Freira, 58 anos. Responsável pela enfermaria do convento. Próxima de Beatriz.',
        backstory: 'A única pessoa com quem Beatriz comunicava abertamente. Sabia das preocupações de Beatriz sobre as finanças. Tem acesso a medicação e conhecimento médico avançado — o convento tem uma farmácia interna com histórico de séculos.',
        objectives: 'Descobrir o que aconteceu à sua amiga e proteger a sua memória.',
        secrets: 'Na noite anterior, Beatriz deu-lhe um envelope selado com instrução de o enviar ao Bispo se "algo lhe acontecesse". Conceição ainda não enviou — hesitou.',
        alibi: 'Na enfermaria com uma freira doente. Confirmado.',
        isKiller: false,
        isDetective: true,
      },
      {
        name: 'Jorge Peixoto',
        description: 'Funcionário laico, 44 anos. Responsável pela manutenção do edifício histórico há 12 anos.',
        backstory: 'Conhece cada pedra do convento. Realizou obras de restauro em todos os andares nos últimos anos. Sabe de passagens e mecanismos que as próprias freiras desconhecem. Tem uma relação complexa com o convento — a sua avó foi religiosa aqui e deixou-lhe uma herança que inclui documentos históricos do séc. XIX.',
        objectives: 'Manter o seu emprego e não se envolver em assuntos internos.',
        secrets: 'Descobriu durante obras há 3 anos uma passagem entre a cela de Beatriz e o corredor de serviço. Tapou-a a pedido da Madre Superiora — mas não completamente.',
        alibi: 'Em casa com a família. Verificado.',
        isKiller: false,
        isDetective: false,
      },
      {
        name: 'Dr. Manuel Rego',
        description: 'Advogado do convento, 61 anos. Gere os assuntos legais e patrimoniais há 20 anos.',
        backstory: 'Arquitecto das irregularidades financeiras que Beatriz queria denunciar. Criou uma estrutura de doações que desviava parte dos fundos para uma conta paralela — com a cumplicidade da Madre Superiora e em benefício de ambos. Se Beatriz falar com o Bispo, os dois enfrentam processos criminais.',
        objectives: 'Impedir a denúncia a todo o custo.',
        secrets: 'Visitou o convento no dia anterior ao crime — visita não registada, acesso pela entrada de serviço. Tem uma cópia da planta original do convento com todas as passagens marcadas.',
        alibi: 'No escritório, em reuniões documentadas. Mas a tarde está por explicar.',
        isKiller: false,
        isDetective: false,
      },
    ],
    evidence: [
      { stageIdx: 0, title: 'Relatório da Cena do Crime', description: 'Porta trancada por dentro com chave. Janela intacta. Corpo encontrado junto à secretária. Sem sinais de luta. Causa de morte: asfixia.', type: EvidenceType.document, contentText: 'RELATÓRIO INICIAL:\nPorta: trancada por dentro, chave no interior da fechadura, do lado da cela\nJanela: única, 40x60cm, grades originais do séc. XVII intactas — impossível passar\nVentilação: gradeamento fixo (verificado)\nCorpo: posição sentada junto à secretária, inclinado para a frente\nCAUSA PROVISÓRIA: Asfixia (confirmação pendente de toxicologia)\nSEM sinais de luta, arrombamento ou acesso não autorizado aparente' },
      { stageIdx: 0, title: 'Mecanismo da Fechadura — Análise', description: 'A fechadura do séc. XVIII tem uma peculiaridade: a chave pode ser rodada do exterior com uma ferramenta específica se a chave interior não estiver completamente inserida.', type: EvidenceType.document, contentText: 'ANÁLISE DO SERRALHEIRO:\nFechadura: modelo português, séc. XVIII, sem modificações\nPECULIARIDADE: O cilindro permite rotação exterior parcial se a chave interior não estiver totalmente inserida (posição de 8-10mm em vez de 15mm completo)\nFerramenta necessária: chave mestra longa ou ferramenta de ferreiro — não comum\nCONCLUSÃO: É tecnicamente possível trancar a porta do exterior deixando a chave interior aparentemente no lugar se houver acesso a ferramenta específica e a chave não estiver totalmente inserida' },
      { stageIdx: 1, title: 'Livro de Registos do Convento', description: 'Entradas e saídas oficiais. Uma visita não registada foi detectada por câmera de segurança instalada recentemente no portão principal.', type: EvidenceType.document, contentText: 'CÂMERA PORTÃO (instalada há 6 meses, desconhecida da Madre Superiora):\n[Dia anterior ao crime]\n16:47 — Entrada: Dr. Manuel Rego (não registado no livro oficial)\n18:23 — Saída: Dr. Manuel Rego\n\n[Noite do crime]\nSem entradas exteriores\nMas: câmera do pátio interno captou movimento no corredor de serviço às 02h14 — figura encapuzada, altura consistente com residente do convento' },
      { stageIdx: 2, title: 'Dossier de Beatriz — Vida Anterior', description: 'Antes do convento, Beatriz chamava-se Maria José Guerreiro. Tinha uma vida, um marido, e um filho que deu para adopção em 1978.', type: EvidenceType.document, contentText: 'REGISTO CIVIL (pesquisa externa):\nNome de baptismo: Maria José Guerreiro\nNascida: 1953, Guimarães\nCasada em 1975 com António Sousa (falecido 1979)\nFilho: nascido 1978, dado para adopção voluntária\nEntrada no convento: 1980 (após viuvez)\nNome religioso adoptado: Irmã Beatriz\n\nNOTA: O filho adoptado teria hoje 46 anos. Pesquisa em curso.' },
      { stageIdx: 2, title: 'Envelope de Irmã Conceição', description: 'O envelope que Beatriz entregou a Conceição. Contém fotocópias de registos contabilísticos e uma carta dirigida ao Bispo de Braga.', type: EvidenceType.document, contentText: 'CARTA DE BEATRIZ PARA O BISPO:\n"Excelência,\nAnexo documentação que demonstra desvio sistemático de fundos doados ao convento entre 2015 e 2024. Valor estimado: 340.000€. A responsabilidade é da Madre Superiora, com conhecimento e participação do advogado Manuel Rego.\nSe esta carta chegar ao Vosso conhecimento, é porque algo me aconteceu. Rezo para que me engane.\nEm Cristo,\nIrmã Beatriz"' },
      { stageIdx: 3, title: 'A Passagem Oculta', description: 'Atrás de um armário da cela de Beatriz, a equipa encontra uma abertura de 40x50cm que comunica com um corredor técnico — tapada com pedras soltas.', type: EvidenceType.object, contentText: 'A abertura tem sido usada recentemente: poeira perturbada, marca de joelhos no chão interior da cela, e uma mecha de tecido de lã cinzenta presa numa pedra (cor consistente com o hábito das freiras do convento).\n\nO corredor técnico liga directamente à ala da Madre Superiora — percurso: 23 metros, sem câmeras, sem portas trancadas.' },
      { stageIdx: 3, title: 'Toxicologia Final', description: 'Causa de morte: asfixia por almofada (vestígios de fibras na via aérea). A Irmã Beatriz estava sedada previamente — barbiturico de acção rápida no sistema, dose sub-letal mas suficiente para incapacitar.', type: EvidenceType.document, contentText: 'TOXICOLOGIA COMPLETA:\nBarbitúrico: fenobarbital, 0.8 mg/L sérico — concentração sedativa significativa\nVia de administração: provavelmente oral (chá da noite — Beatriz tomava chá às 21h30 por hábito documentado)\nCAUSA CONFIRMADA: Asfixia mecânica por compressão facial (almofada)\nCONCLUSÃO: Beatriz foi sedada primeiro, depois asfixiada. Requereu pouca força física — compatível com agressora idosa ou de compleição normal.', isRedHerring: false },
    ],
  })

  console.log('✅ 4 casos pagos criados\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — criar caso completo
// ─────────────────────────────────────────────────────────────────────────────

async function createCase(adminId: string, data: {
  slug: string
  title: string
  shortDescription: string
  description: string
  difficulty: CaseDifficulty
  type: CaseType
  minPlayers: number
  maxPlayers: number
  estimatedMinutes: number
  priceDigital?: number | null
  pricePhysical?: number | null
  isFeatured: boolean
  sortOrder: number
  tags: string[]
  coverImageUrl: string
  stages: Array<{ order: number; title: string; description: string; isLast?: boolean }>
  characters: Array<{
    name: string; description: string; backstory: string
    objectives: string; secrets: string; alibi: string
    isKiller: boolean; isDetective: boolean
  }>
  evidence: Array<{
    stageIdx: number; title: string; description: string; type: EvidenceType
    contentText?: string; isRedHerring?: boolean
  }>
}) {
  // Apagar caso existente (idempotente)
  const existing = await prisma.case.findUnique({ where: { slug: data.slug } })
  if (existing) {
    await prisma.case.delete({ where: { id: existing.id } })
  }

  // Criar o caso
  const c = await prisma.case.create({
    data: {
      slug: data.slug,
      title: data.title,
      shortDescription: data.shortDescription,
      description: data.description,
      difficulty: data.difficulty,
      type: data.type,
      minPlayers: data.minPlayers,
      maxPlayers: data.maxPlayers,
      estimatedMinutes: data.estimatedMinutes,
      priceDigital: data.priceDigital ?? null,
      pricePhysical: data.pricePhysical ?? null,
      coverImageUrl: data.coverImageUrl,
      tags: data.tags,
      isFeatured: data.isFeatured,
      isPublished: true,
      sortOrder: data.sortOrder,
      authorId: adminId,
    },
  })

  // Criar stages
  const stages = await Promise.all(
    data.stages.map((s) =>
      prisma.gameStage.create({
        data: {
          caseId: c.id,
          order: s.order,
          title: s.title,
          description: s.description,
          isLast: s.isLast ?? false,
        },
      })
    )
  )

  // Criar personagens
  await Promise.all(
    data.characters.map((ch) =>
      prisma.character.create({
        data: {
          caseId: c.id,
          name: ch.name,
          description: ch.description,
          backstory: ch.backstory,
          objectives: ch.objectives,
          secrets: ch.secrets,
          alibi: ch.alibi,
          isKiller: ch.isKiller,
          isDetective: ch.isDetective,
        },
      })
    )
  )

  // Criar evidências ligadas ao stage correcto
  await Promise.all(
    data.evidence.map((ev) =>
      prisma.evidence.create({
        data: {
          caseId: c.id,
          stageId: stages[ev.stageIdx]?.id ?? null,
          title: ev.title,
          description: ev.description,
          type: ev.type,
          contentText: ev.contentText ?? null,
          isRedHerring: ev.isRedHerring ?? false,
          sortOrder: 0,
        },
      })
    )
  )

  console.log(`   ✅ "${data.title}" (${data.priceDigital ? `€${data.priceDigital}` : 'GRÁTIS'})`)
  return c
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
