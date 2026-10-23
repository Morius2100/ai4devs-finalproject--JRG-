import { expect, test, type Page } from "@playwright/test";

// E2E de la spec `descubrimiento-temas` (TKT-015, HU-01, HU-02).
// Usa los 25 temas públicos sembrados por prisma/seed.ts (20 en la primera
// página, 5 en la segunda) y el usuario semilla ana@opina.test / password123.

async function loginAsAna(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("ana@opina.test");
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/");
}

function topicLinks(page: Page) {
  return page.locator("main ul[aria-label='Temas'] > li a");
}

test.describe("Lista scrolleable con carga continua", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAna(page);
  });

  test("Cargar más temas al hacer scroll", async ({ page }) => {
    const items = topicLinks(page);
    await expect(items).toHaveCount(20);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // No se fija un total exacto: otras pruebas (p. ej. creacion-temas.spec.ts)
    // crean temas públicos reales que se acumulan en la BD de desarrollo.
    // Lo que importa es que el scroll cargue más allá de la primera página.
    await expect(async () => {
      expect(await items.count()).toBeGreaterThan(20);
    }).toPass({ timeout: 10_000 });
  });
});

test.describe("Buscador de temas", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAna(page);
  });

  test("Buscar por parte del título", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Buscar temas" }).fill("pizza");
    await expect(page).toHaveURL(/\?q=pizza/, { timeout: 5_000 });

    const items = topicLinks(page);
    await expect(items.first()).toBeVisible();
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(items.nth(i)).toContainText(/pizza/i);
    }
  });

  test("Borrar el texto de búsqueda: vuelve a las tendencias", async ({ page }) => {
    const searchBox = page.getByRole("searchbox", { name: "Buscar temas" });
    await searchBox.fill("pizza");
    await expect(page).toHaveURL(/\?q=pizza/);

    await searchBox.fill("");
    await expect(page).toHaveURL("/", { timeout: 5_000 });
    await expect(topicLinks(page)).toHaveCount(20);
  });
});

test.describe("Navegación a un tema desde la lista", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAna(page);
  });

  test("Pulsar un tema navega a su pantalla", async ({ page }) => {
    const firstItem = topicLinks(page).first();
    const href = await firstItem.getAttribute("href");
    expect(href).toMatch(/^\/tema\?id=[0-9a-f-]{36}$/);

    await firstItem.click();
    await expect(page).toHaveURL(href!);
  });
});

test.describe("Pantalla de un tema con imagen (viewport 390×844)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAna(page);
  });

  test("La imagen mide la mitad de la altura y los botones quedan abajo", async ({ page }) => {
    // Tema sembrado por prisma/seed.ts con imagen (índice 0, múltiplo de 3).
    await page.getByRole("searchbox", { name: "Buscar temas" }).fill("crimen");
    await expect(page).toHaveURL(/\?q=crimen/, { timeout: 5_000 });

    const item = topicLinks(page).first();
    await expect(item).toBeVisible({ timeout: 5_000 });
    await item.click();

    const image = page.getByRole("img", { name: /piña en la pizza/i });
    await expect(image).toBeVisible();
    const imageBox = await image.boundingBox();
    expect(imageBox).not.toBeNull();
    expect(imageBox!.y).toBeCloseTo(0, 0);
    expect(imageBox!.height).toBeGreaterThan(400);
    expect(imageBox!.height).toBeLessThan(444);

    const upButton = page.getByRole("button", { name: "Votar a favor" });
    const downButton = page.getByRole("button", { name: "Votar en contra" });
    await expect(upButton).toBeVisible();
    await expect(downButton).toBeVisible();
    const upBox = await upButton.boundingBox();
    expect(upBox).not.toBeNull();
    // Pie flotante con 16 px de margen inferior: sigue pegado al borde de la pantalla.
    const gapToBottom = 844 - (upBox!.y + upBox!.height);
    expect(gapToBottom).toBeGreaterThanOrEqual(0);
    expect(gapToBottom).toBeLessThanOrEqual(24);
  });
});
