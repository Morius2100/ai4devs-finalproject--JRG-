import { expect, test } from "@playwright/test";

// La pantalla /servidor es solo de la app de desarrollo (TKT-068, spec `app-movil`):
// en la web no está disponible.

test("sin sesión, /servidor redirige al inicio de sesión", async ({ page }) => {
  await page.goto("/servidor");

  await expect(page).toHaveURL("/login");
  await expect(page.getByText("Servidor:")).toHaveCount(0);
});

test("con sesión, /servidor indica que solo existe en la app de desarrollo y el menú no la ofrece", async ({
  page,
}) => {
  const username = `serv${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  await page.goto("/registro");
  await page.getByLabel("Nombre de usuario").fill(username);
  await page.getByLabel("Email").fill(`${username}@example.com`);
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: "Abrir menú principal" }).click();
  await expect(page.getByRole("menuitem", { name: "Servidor" })).toHaveCount(0);

  await page.goto("/servidor");
  await expect(page.getByText(/solo está disponible en la app de desarrollo/i)).toBeVisible();
  await expect(page.getByLabel("Dirección del servidor")).toHaveCount(0);
});

test("las rutas públicas de la API responden sin sesión", async ({ request }) => {
  expect((await request.get("/api/health")).status()).toBe(200);
  expect(
    (await request.get("/api/media/avatars/00000000-0000-4000-8000-000000000000.png")).status(),
  ).toBe(404);
  expect((await request.get("/api/topics")).status()).toBe(401);
});
