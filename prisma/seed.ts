import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

/**
 * Datos semilla de desarrollo y pruebas (TKT-004, TKT-011, docs/03-modelo-datos.md §3.6).
 * Usuarios, amistades y temas públicos de ejemplo. Idempotente: se puede
 * ejecutar varias veces sin duplicar datos.
 */
const prisma = new PrismaClient();

const SEED_PASSWORD = "password123";
const BCRYPT_COST = 12;

// Perfil mínimo (F-07): foto de demostración y descripción. `dani` queda sin
// foto ni descripción para cubrir el respaldo de la inicial.
const avatarFor = (username: string) => `https://picsum.photos/seed/opina-user-${username}/200`;

const USERS: ReadonlyArray<{
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
}> = [
  {
    username: "ana",
    email: "ana@opina.test",
    avatarUrl: avatarFor("ana"),
    bio: "Opino de cine, series y de todo lo que se ponga por delante.",
  },
  {
    username: "bruno",
    email: "bruno@opina.test",
    avatarUrl: avatarFor("bruno"),
    bio: "Me encanta debatir.",
  },
  {
    username: "carla",
    email: "carla@opina.test",
    avatarUrl: avatarFor("carla"),
    bio: "Libros, café y debates largos.",
  },
  { username: "dani", email: "dani@opina.test", avatarUrl: null, bio: null },
  // Usuarios extra para probar la paginación de la lista de personas (TKT-033).
  ...Array.from({ length: 25 }, (_, index) => {
    const username = `persona${String(index + 1).padStart(2, "0")}`;
    return {
      username,
      email: `${username}@opina.test`,
      avatarUrl: index % 2 === 0 ? avatarFor(username) : null,
      bio: index % 3 === 0 ? `Soy ${username} y opino de casi todo.` : null,
    };
  }),
];

// Amistades simétricas: ana↔bruno y ana↔carla (docs/03-modelo-datos.md §3.6).
const FRIENDSHIPS: Array<[string, string]> = [
  ["ana", "bruno"],
  ["ana", "carla"],
];

// 25 temas públicos con votos variados, algunos con imagen (TKT-011).
// Idempotentes por título: si ya existen (misma cadena) no se duplican.
const TOPIC_TITLES = [
  "¿La piña en la pizza es un crimen?",
  "¿Deberían las tiendas abrir los domingos?",
  "¿El teletrabajo es mejor que ir a la oficina?",
  "¿Se debería prohibir fumar en las terrazas?",
  "¿La mejor pizza de la ciudad lleva piña?",
  "¿Merece la pena madrugar para hacer deporte?",
  "¿Hay que dar propina siempre?",
  "¿El café con leche solo se toma por la mañana?",
  "¿Los perros son mejores compañeros que los gatos?",
  "¿Se debería subir el salario mínimo?",
  "¿Las redes sociales hacen más mal que bien?",
  "¿Merece la pena comprar vivienda antes de los 30?",
  "¿El fútbol femenino debería tener el mismo sueldo?",
  "¿Hay que aprender a cocinar antes de irse de casa?",
  "¿Los libros en papel son mejores que los digitales?",
  "¿Se debería alargar el fin de semana a tres días?",
  "¿La siesta debería ser obligatoria en el trabajo?",
  "¿Vale la pena ir al gimnasio o basta con andar?",
  "¿El aire acondicionado en verano es un lujo o una necesidad?",
  "¿Se debería enseñar educación financiera en el colegio?",
  "¿Los madrugadores rinden más que los noctámbulos?",
  "¿Merece la pena pagar por streaming o mejor ver la tele?",
  "¿Hay que reciclar aunque parezca que no sirve de nada?",
  "¿El turrón se debería poder comer todo el año?",
  "¿Es mejor viajar solo o acompañado?",
] as const;

function voteCountsForIndex(index: number): { positiveVotes: number; negativeVotes: number } {
  return {
    positiveVotes: ((index * 7) % 50) + 5,
    negativeVotes: (index * 3) % 20,
  };
}

// Tema privado de ana con notificación a sus amigos (bruno y carla, TKT-029).
const PRIVATE_TOPIC_TITLE = "¿Quedamos para cenar el viernes?";

// Temas de «historia» (TKT-055): creados por amigos de ana en las últimas horas.
// Su fecha se renueva en cada seed, para que las historias de ana (HU-19) se
// puedan probar siempre, aunque hayan pasado más de 24 horas desde el primer seed.
const STORY_TOPICS = [
  { title: "¿Vale la pena madrugar los fines de semana?", author: "carla", hoursAgo: 5 },
  { title: "¿Es mejor el café con hielo que el caliente?", author: "carla", hoursAgo: 2 },
  { title: "¿Debería haber menos reuniones en el trabajo?", author: "bruno", hoursAgo: 1 },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_COST);

  const usersByUsername = new Map<string, { id: string }>();
  for (const user of USERS) {
    const created = await prisma.user.upsert({
      where: { username: user.username },
      // Mantiene actualizado el perfil demo sin tocar la contraseña.
      update: { avatarUrl: user.avatarUrl, bio: user.bio },
      create: { ...user, passwordHash },
      select: { id: true, username: true },
    });
    usersByUsername.set(created.username, created);
  }

  for (const [a, b] of FRIENDSHIPS) {
    const userA = usersByUsername.get(a);
    const userB = usersByUsername.get(b);
    if (!userA || !userB) continue;

    // Dos filas (A→B y B→A): la amistad es simétrica (docs/03-modelo-datos.md §3.3).
    await prisma.friendship.upsert({
      where: { userId_friendId: { userId: userA.id, friendId: userB.id } },
      update: {},
      create: { userId: userA.id, friendId: userB.id },
    });
    await prisma.friendship.upsert({
      where: { userId_friendId: { userId: userB.id, friendId: userA.id } },
      update: {},
      create: { userId: userB.id, friendId: userA.id },
    });
  }

  // Los 25 temas públicos se reparten solo entre los cuatro usuarios principales.
  const authors = ["ana", "bruno", "carla", "dani"].map((name) => usersByUsername.get(name)!);
  let topicsCreated = 0;
  for (const [index, title] of TOPIC_TITLES.entries()) {
    const existing = await prisma.topic.findFirst({ where: { title } });
    if (existing) continue;

    const { positiveVotes, negativeVotes } = voteCountsForIndex(index);
    const author = authors[index % authors.length];
    const hasImage = index % 3 === 0;

    await prisma.topic.create({
      data: {
        title,
        visibility: "PUBLIC",
        authorId: author.id,
        // Fechas escalonadas (una hora por tema) para que «Más recientes» y
        // «Más puntuados» den órdenes distintos en los perfiles.
        createdAt: new Date(Date.now() - index * 60 * 60 * 1000),
        positiveVotes,
        negativeVotes,
        totalVotes: positiveVotes + negativeVotes,
        imageUrl: hasImage ? `https://picsum.photos/seed/opina-topic-${index}/800/600` : null,
      },
    });
    topicsCreated += 1;
  }

  let privateTopicCreated = false;
  const existingPrivateTopic = await prisma.topic.findFirst({
    where: { title: PRIVATE_TOPIC_TITLE },
  });
  if (!existingPrivateTopic) {
    const ana = usersByUsername.get("ana");
    if (ana) {
      await prisma.$transaction(async (tx) => {
        const topic = await tx.topic.create({
          data: { title: PRIVATE_TOPIC_TITLE, visibility: "PRIVATE", authorId: ana.id },
          select: { id: true },
        });
        // Mismo INSERT … SELECT que NotificationService.notifyFriendsOfPrivateTopic
        // (src/server/services/notification-service.ts): una notificación por amigo.
        await tx.$executeRaw`
          INSERT INTO notifications (id, recipient_id, actor_id, topic_id, type, created_at)
          SELECT gen_random_uuid(), f.friend_id, ${ana.id}::uuid, ${topic.id}::uuid,
                 'PRIVATE_TOPIC_CREATED'::"NotificationType", now()
          FROM friendships f
          WHERE f.user_id = ${ana.id}::uuid
        `;
      });
      privateTopicCreated = true;
    }
  }

  // Historias: crea o renueva los temas y olvida las visitas de ana (TKT-055).
  const ana = usersByUsername.get("ana");
  for (const story of STORY_TOPICS) {
    const author = usersByUsername.get(story.author);
    if (!author) continue;

    const createdAt = new Date(Date.now() - story.hoursAgo * 60 * 60 * 1000);
    const existing = await prisma.topic.findFirst({ where: { title: story.title } });
    const topic = existing
      ? await prisma.topic.update({ where: { id: existing.id }, data: { createdAt } })
      : await prisma.topic.create({
          data: { title: story.title, visibility: "PUBLIC", authorId: author.id, createdAt },
        });
    if (ana) {
      await prisma.topicView.deleteMany({ where: { userId: ana.id, topicId: topic.id } });
    }
  }

  console.log(
    `Semilla completada: ${usersByUsername.size} usuarios, ${FRIENDSHIPS.length * 2} amistades, ${topicsCreated} temas nuevos, ${privateTopicCreated ? 1 : 0} tema privado nuevo y ${STORY_TOPICS.length} temas de historia renovados.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
