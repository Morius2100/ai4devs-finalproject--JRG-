import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// E2E de la spec `creacion-temas` (TKT-027, HU-08 a HU-10).
// Sube una imagen real a MinIO (`.env`, sin IMAGE_STORAGE=memory), por lo
// que necesita `docker compose up -d` con los servicios de la fase 1.

async function registerFreshUser(page: Page): Promise<string> {
  const runId = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  const username = `creator${runId}`;

  await page.goto("/registro");
  await page.getByLabel("Nombre de usuario").fill(username);
  await page.getByLabel("Email").fill(`${username}@example.com`);
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/");

  return username;
}

test.describe("Creación de temas", () => {
  test("Crear tema público con imagen desde el menú: imagen a media pantalla y otro usuario lo encuentra al buscar", async ({
    page,
  }) => {
    await registerFreshUser(page);

    await page.getByRole("button", { name: "Abrir menú principal" }).click();
    await page.getByRole("menuitem", { name: "Crear tema" }).click();
    await expect(page).toHaveURL("/temas/nuevo");

    const uniqueWord = `cocodrilo${Date.now().toString(36)}`;
    const title = `¿Te gusta el ${uniqueWord}?`;
    await page.getByLabel("Título").fill(title);
    await page
      .getByLabel("Imagen (opcional)")
      .setInputFiles(path.join(__dirname, "fixtures", "topic-image.png"));
    await page.getByRole("button", { name: "Crear tema" }).click();

    // Redirige a /tema?id=; la imagen ocupa la mitad superior.
    await expect(page).toHaveURL(/\/tema\?id=[0-9a-f-]{36}$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    const image = page.getByRole("img", { name: title });
    await expect(image).toBeVisible();
    const box = await image.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(400);
    expect(box!.height).toBeLessThan(444);

    // Otro usuario lo encuentra al buscar (misma pestaña, sesión distinta).
    // /tema no tiene MainMenu (design.md de fase-3-detalle-tema): hay
    // que volver a la pantalla principal para poder cerrar sesión.
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú principal" }).click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL("/login");

    await registerFreshUser(page);
    await page.getByRole("searchbox", { name: "Buscar temas" }).fill(uniqueWord);
    await expect(page).toHaveURL(new RegExp(`\\?q=${uniqueWord}`), { timeout: 5_000 });
    await expect(page.getByText(title)).toBeVisible({ timeout: 5_000 });
  });

  test("Título demasiado corto: error de validación y no navega", async ({ page }) => {
    await registerFreshUser(page);
    await page.goto("/temas/nuevo");

    await page.getByLabel("Título").fill("ab");
    await page.getByRole("button", { name: "Crear tema" }).click();

    // `getByRole("alert")` también resuelve al route-announcer de Next.js.
    await expect(page.getByText("El título debe tener entre 3 y 120 caracteres")).toBeVisible();
    await expect(page).toHaveURL("/temas/nuevo");
  });
});
