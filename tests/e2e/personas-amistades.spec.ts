import { expect, test, type Page } from "@playwright/test";

// E2E de las specs `menu-inferior`, `personas` y `amistades` (TKT-040,
// HU-13..HU-15). Cada prueba registra a su propio usuario (no toca las
// amistades de los usuarios semilla, de las que dependen otras pruebas
// que corren en paralelo); ana (prisma/seed.ts) tiene temas públicos con
// votos variados.

type Visitor = { username: string; email: string; password: string };

function newVisitor(): Visitor {
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    username: `e2ep${runId}`,
    email: `e2ep+${runId}@example.com`,
    password: "password123",
  };
}

async function register(page: Page, visitor: Visitor) {
  await page.goto("/registro");
  await page.getByLabel("Nombre de usuario").fill(visitor.username);
  await page.getByLabel("Email").fill(visitor.email);
  await page.getByLabel("Contraseña").fill(visitor.password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/");
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/");
}

async function logout(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú principal" }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/login");
}

test("un usuario busca a ana, la añade y ve y vota su tema privado; al quitarla pierde el acceso", async ({
  page,
}) => {
  // ana crea un tema privado con un título único.
  await login(page, "ana@opina.test", "password123");
  await page.getByRole("button", { name: "Abrir menú principal" }).click();
  await page.getByRole("menuitem", { name: "Crear tema" }).click();
  await expect(page).toHaveURL("/temas/nuevo");
  const title = `¿Cena el sábado? ${Date.now().toString(36)}`;
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Privado").check();
  await page.getByRole("button", { name: "Crear tema" }).click();
  await expect(page).toHaveURL(/\/tema\?id=[0-9a-f-]{36}$/, { timeout: 10_000 });
  const topicUrl = page.url();
  await logout(page);

  // 1. Un usuario nuevo se registra: Temas es la pestaña activa por defecto.
  await register(page, newVisitor());
  const nav = page.getByRole("navigation", { name: "Secciones" });
  await expect(nav.getByRole("link", { name: "Temas" })).toHaveAttribute("aria-current", "page");

  // 2. Pulsa Personas y busca a ana.
  await nav.getByRole("link", { name: "Personas" }).click();
  await expect(page).toHaveURL("/personas");
  await expect(nav.getByRole("link", { name: "Personas" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("searchbox", { name: "Buscar personas" }).fill("ana");
  await expect(page).toHaveURL(/\/personas\?q=ana$/);
  const anaCard = page.getByRole("link", { name: /\bana\b/ });
  await expect(anaCard).toContainText("No amigo");

  // 3. Abre su perfil: sin ser amigo solo ve los temas públicos.
  await anaCard.click();
  await expect(page).toHaveURL(/\/persona\?id=[0-9a-f-]{36}$/);
  const profileUrl = page.url();
  await expect(page.getByRole("heading", { name: "ana", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Personas" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: "Añadir a amigos" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  const topics = page.getByRole("region", { name: "Temas de ana" });
  await expect(topics.getByRole("link").first()).toBeVisible();
  await expect(topics.getByText(title)).toHaveCount(0);
  await expect(topics.getByText("Privado")).toHaveCount(0);

  // 4. «Añadir a amigos»: aparece el tema privado con la etiqueta «Privado».
  await page.getByRole("button", { name: "Añadir a amigos" }).click();
  await expect(page.getByRole("button", { name: "Amigos" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(topics.getByText(title)).toBeVisible();
  await expect(topics.getByRole("link", { name: title })).toContainText("Privado");

  // 5. «Más puntuados»: los votos de los temas van de mayor a menor.
  await page.getByRole("button", { name: "Más puntuados" }).click();
  await expect(page.getByRole("button", { name: "Más puntuados" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect
    .poll(async () => {
      const texts = await topics.getByRole("link").allInnerTexts();
      const votes = texts.map((text) => Number(/(\d+) votos?/.exec(text)?.[1] ?? NaN));
      return votes.length > 1 && votes.every((v, i) => i === 0 || votes[i - 1] >= v);
    })
    .toBe(true);

  // 6. Vuelve a «Más recientes» (el tema nuevo va el primero), lo abre y vota.
  await page.getByRole("button", { name: "Más recientes" }).click();
  await topics.getByRole("link", { name: title }).click();
  await expect(page).toHaveURL(topicUrl);
  await page.getByRole("button", { name: "Votar a favor" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Votar" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 5_000 });

  // 7. Vuelve al perfil y pulsa «Amigos» para quitar la amistad.
  await page.goto(profileUrl);
  await page.getByRole("button", { name: "Amigos" }).click();
  await expect(page.getByRole("button", { name: "Añadir a amigos" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(topics.getByText(title)).toHaveCount(0);

  // 8. Sin amistad, la URL del tema privado responde «Tema no encontrado».
  await page.goto(topicUrl);
  await expect(page.getByRole("heading", { name: "Tema no encontrado" })).toBeVisible();
});

test("perfil inexistente: «Persona no encontrada» con enlace a Personas", async ({ page }) => {
  await register(page, newVisitor());

  await page.goto("/persona?id=00000000-0000-0000-0000-000000000000");

  await expect(page.getByRole("heading", { name: "Persona no encontrada" })).toBeVisible();
  await page.getByRole("link", { name: "Volver a Personas" }).click();
  await expect(page).toHaveURL("/personas");
});

test("propio perfil: sin botón de amistad y sin aparecer en su propia lista", async ({ page }) => {
  // Se registra un usuario y ana llega a su perfil para guardar la URL.
  const visitor = newVisitor();
  await register(page, visitor);
  await logout(page);
  await login(page, "ana@opina.test", "password123");
  await page.goto(`/personas?q=${visitor.username}`);
  await page.getByRole("link", { name: visitor.username }).click();
  await expect(page).toHaveURL(/\/persona\?id=[0-9a-f-]{36}$/);
  const ownUrl = page.url();
  await logout(page);

  // El usuario abre su propio perfil por URL: cabecera y temas, sin botón de amistad.
  await login(page, visitor.email, visitor.password);
  await page.goto(ownUrl);
  await expect(page.getByRole("heading", { name: visitor.username, exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: `Temas de ${visitor.username}` })).toBeVisible();
  await expect(page.getByRole("button", { name: /^(Amigos|Añadir a amigos)$/ })).toHaveCount(0);

  // Y no aparece en su propia lista de personas.
  await page.goto(`/personas?q=${visitor.username}`);
  await expect(page.getByText("No se han encontrado personas con ese texto.")).toBeVisible();
});
