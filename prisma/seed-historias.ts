import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

/**
 * Datos para probar las historias de amigos (HU-19) con una cuenta concreta,
 * por defecto `pepito`: 10 amigos, 5 de ellos con 1 a 3 temas creados en las
 * últimas horas. Se puede repetir: los temas se vuelven a crear con fechas
 * nuevas y sin visitas, así que las historias vuelven a salir aunque hayan
 * pasado más de 24 horas o ya se hayan visto.
 *   npm run prisma:seed:historias
 *   npm run prisma:seed:historias -- otro_usuario
 */
const prisma = new PrismaClient();

const TARGET_USERNAME = process.argv[2] ?? "pepito";
const FRIEND_PASSWORD = "password123";
const BCRYPT_COST = 12;
const HOUR = 60 * 60 * 1000;

const avatarFor = (username: string) => `https://picsum.photos/seed/opina-user-${username}/200`;

// La mitad sin foto, para ver también la burbuja con la inicial.
const FRIENDS = [
  "lucia",
  "marcos",
  "sofia",
  "hugo",
  "elena",
  "pablo",
  "irene",
  "diego",
  "nora",
  "alvaro",
].map((username, index) => ({
  username,
  email: `${username}@opina.test`,
  avatarUrl: index % 2 === 0 ? avatarFor(username) : null,
  bio: `Soy ${username}, amigo de prueba para las historias.`,
}));

// 5 amigos con temas: contadores de 1 a 3, públicos y privados, y fechas
// escalonadas para comprobar el orden de las burbujas (la más reciente primero).
const STORY_TOPICS: ReadonlyArray<{
  author: string;
  title: string;
  hoursAgo: number;
  visibility: "PUBLIC" | "PRIVATE";
  image?: boolean;
}> = [
  {
    author: "hugo",
    title: "¿Es mejor la tortilla con cebolla?",
    hoursAgo: 6,
    visibility: "PUBLIC",
  },
  {
    author: "hugo",
    title: "¿Deberían los videojuegos ser deporte olímpico?",
    hoursAgo: 2,
    visibility: "PUBLIC",
    image: true,
  },
  {
    author: "hugo",
    title: "¿Quién se apunta al pádel el domingo?",
    hoursAgo: 0.5,
    visibility: "PRIVATE",
  },
  {
    author: "lucia",
    title: "¿Playa o montaña para las vacaciones?",
    hoursAgo: 4,
    visibility: "PUBLIC",
    image: true,
  },
  {
    author: "lucia",
    title: "¿Os viene bien cenar en mi casa el sábado?",
    hoursAgo: 1,
    visibility: "PRIVATE",
  },
  {
    author: "sofia",
    title: "¿Las series largas se hacen pesadas?",
    hoursAgo: 3,
    visibility: "PUBLIC",
  },
  {
    author: "marcos",
    title: "¿Hay que madrugar para ser productivo?",
    hoursAgo: 8,
    visibility: "PUBLIC",
  },
  {
    author: "marcos",
    title: "¿El mejor bocadillo es el de calamares?",
    hoursAgo: 7,
    visibility: "PUBLIC",
    image: true,
  },
  {
    author: "marcos",
    title: "¿Vamos al concierto del mes que viene?",
    hoursAgo: 5,
    visibility: "PRIVATE",
  },
  {
    author: "elena",
    title: "¿Leer en el móvil cansa más la vista?",
    hoursAgo: 12,
    visibility: "PUBLIC",
  },
];

async function main() {
  const target = await prisma.user.findUnique({
    where: { username: TARGET_USERNAME },
    select: { id: true, username: true },
  });
  if (!target) {
    throw new Error(`No existe el usuario «${TARGET_USERNAME}»`);
  }

  const passwordHash = await bcrypt.hash(FRIEND_PASSWORD, BCRYPT_COST);
  const friendIds = new Map<string, string>();
  for (const friend of FRIENDS) {
    const created = await prisma.user.upsert({
      where: { username: friend.username },
      update: { avatarUrl: friend.avatarUrl, bio: friend.bio },
      create: { ...friend, passwordHash },
      select: { id: true },
    });
    friendIds.set(friend.username, created.id);
  }

  // Amistad simétrica: dos filas por pareja (docs/03-modelo-datos.md §3.3).
  await prisma.friendship.createMany({
    data: [...friendIds.values()].flatMap((friendId) => [
      { userId: target.id, friendId },
      { userId: friendId, friendId: target.id },
    ]),
    skipDuplicates: true,
  });

  // Se borran y se vuelven a crear: fechas nuevas y sin visitas, votos ni
  // notificaciones anteriores (todo cae en cascada con el tema).
  const authorIds = [...new Set(STORY_TOPICS.map((topic) => friendIds.get(topic.author)!))];
  await prisma.topic.deleteMany({
    where: { authorId: { in: authorIds }, title: { in: STORY_TOPICS.map((topic) => topic.title) } },
  });

  for (const [index, story] of STORY_TOPICS.entries()) {
    const authorId = friendIds.get(story.author)!;
    const createdAt = new Date(Date.now() - story.hoursAgo * HOUR);
    await prisma.$transaction(async (tx) => {
      const topic = await tx.topic.create({
        data: {
          title: story.title,
          visibility: story.visibility,
          authorId,
          createdAt,
          imageUrl: story.image
            ? `https://picsum.photos/seed/opina-historia-${index}/800/600`
            : null,
        },
        select: { id: true },
      });
      if (story.visibility === "PRIVATE") {
        // Como NotificationService.notifyFriendsOfPrivateTopic: aviso a cada amigo del autor.
        await tx.$executeRaw`
          INSERT INTO notifications (id, recipient_id, actor_id, topic_id, type, created_at)
          SELECT gen_random_uuid(), f.friend_id, ${authorId}::uuid, ${topic.id}::uuid,
                 'PRIVATE_TOPIC_CREATED'::"NotificationType", ${createdAt}
          FROM friendships f
          WHERE f.user_id = ${authorId}::uuid
        `;
      }
    });
  }

  const authors = new Set(STORY_TOPICS.map((topic) => topic.author));
  console.log(
    `Historias para «${target.username}»: ${FRIENDS.length} amigos (misma contraseña que la semilla), ` +
      `${STORY_TOPICS.length} temas de ${authors.size} de ellos en las últimas 24 horas.`,
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
