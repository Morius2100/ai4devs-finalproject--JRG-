import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { AuthService } from "@/server/services/auth-service";

const RUN_ID = Date.now().toString(36);

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: `upro+${RUN_ID}` } } });
  await prisma.$disconnect();
});

describe("Perfil mínimo de usuario (TKT-033)", () => {
  it("Usuario registrado sin perfil: avatarUrl y bio quedan nulos", async () => {
    const user = await AuthService.register({
      username: `upro${RUN_ID}`,
      email: `upro+${RUN_ID}@example.com`,
      password: "password123",
    });

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

    expect(stored.avatarUrl).toBeNull();
    expect(stored.bio).toBeNull();
  });

  it("Acepta foto y una descripción de hasta 160 caracteres", async () => {
    const bio = "b".repeat(160);
    const user = await prisma.user.create({
      data: {
        username: `uprob${RUN_ID}`,
        email: `upro+b${RUN_ID}@example.com`,
        passwordHash: "not-a-real-hash",
        avatarUrl: "https://picsum.photos/seed/x/200",
        bio,
      },
    });

    expect(user.avatarUrl).toBe("https://picsum.photos/seed/x/200");
    expect(user.bio).toBe(bio);
  });
});
