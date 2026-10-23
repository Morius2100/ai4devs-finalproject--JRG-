import { expect, test } from "@playwright/test";

// E2E de las redirecciones de enlaces antiguos (TKT-045, specs `identidad-visual`
// y `personas` de app-movil-empaquetada). Usa el usuario semilla ana@opina.test.

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("ana@opina.test");
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/");
});

test("Enlace antiguo a un tema: /temas/{id} redirige a /tema?id={id}", async ({ page }) => {
  const href = await page
    .locator("main ul[aria-label='Temas'] > li a")
    .first()
    .getAttribute("href");
  const id = /id=([0-9a-f-]{36})/.exec(href ?? "")?.[1];
  expect(id).toBeDefined();

  await page.goto(`/temas/${id}`);

  await expect(page).toHaveURL(`/tema?id=${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tema no encontrado" })).toHaveCount(0);
});

test("Enlace antiguo a un perfil: /personas/{id} redirige a /persona?id={id}", async ({ page }) => {
  await page.goto("/personas?q=bruno");
  const card = page.getByRole("link", { name: /\bbruno\b/ });
  const href = await card.getAttribute("href");
  const id = /id=([0-9a-f-]{36})/.exec(href ?? "")?.[1];
  expect(id).toBeDefined();

  await page.goto(`/personas/${id}`);

  await expect(page).toHaveURL(`/persona?id=${id}`);
  await expect(page.getByRole("heading", { name: "bruno", exact: true })).toBeVisible();
});

test("/temas/nuevo no se redirige", async ({ page }) => {
  await page.goto("/temas/nuevo");
  await expect(page).toHaveURL("/temas/nuevo");
  await expect(page.getByRole("heading", { name: "Crear tema" })).toBeVisible();
});

test("Perfil sin id: «Persona no encontrada»", async ({ page }) => {
  await page.goto("/persona");
  await expect(page.getByRole("heading", { name: "Persona no encontrada" })).toBeVisible();
});
