import { expect, test, type Page } from "@playwright/test";

// E2E de las specs `temas-privados` y `notificaciones` (TKT-032, HU-11/HU-12).
// Usa los usuarios semilla: bruno y carla son amigos de ana; dani no lo es
// (prisma/seed.ts).

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/");
}

async function logout(page: Page) {
  // /tema no tiene MainMenu (design.md de fase-3-detalle-tema).
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú principal" }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/login");
}

test("ana crea un tema privado; bruno lo ve por notificación, vota y ve resultados; dani recibe 'tema no encontrado'", async ({
  page,
}) => {
  // ana crea el tema privado desde el menú.
  await login(page, "ana@opina.test", "password123");
  await page.getByRole("button", { name: "Abrir menú principal" }).click();
  await page.getByRole("menuitem", { name: "Crear tema" }).click();
  await expect(page).toHaveURL("/temas/nuevo");

  const title = `¿Cena el viernes? ${Date.now().toString(36)}`;
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Privado").check();
  await page.getByRole("button", { name: "Crear tema" }).click();
  await expect(page).toHaveURL(/\/tema\?id=[0-9a-f-]{36}$/, { timeout: 10_000 });
  const topicUrl = page.url();

  await logout(page);

  // bruno (amigo de ana) ve la notificación, la pulsa, vota y ve resultados.
  await login(page, "bruno@opina.test", "password123");
  await page.getByRole("button", { name: "Abrir menú principal" }).click();
  await page.getByRole("menuitem", { name: "Notificaciones" }).click();
  await expect(page).toHaveURL("/notificaciones");

  const notification = page.getByText(`ana ha creado una nueva propuesta: ${title}`);
  await expect(notification).toBeVisible();
  await notification.click();
  await expect(page).toHaveURL(topicUrl);

  await page.getByRole("button", { name: "Votar a favor" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Votar" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole("button", { name: "Votar a favor" })).not.toBeVisible();

  await logout(page);

  // dani (no es amigo de ana) recibe "tema no encontrado" en la misma URL.
  await login(page, "dani@opina.test", "password123");
  await page.goto(topicUrl);
  await expect(page.getByRole("heading", { name: "Tema no encontrado" })).toBeVisible();
});
