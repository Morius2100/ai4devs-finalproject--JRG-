import { expect, test, type Page } from "@playwright/test";

// E2E de la spec `votacion` (TKT-023, HU-04 a HU-07).
// Cada test registra un usuario nuevo (como en identificacion.spec.ts) para
// garantizar que nunca ha votado el tema, y usa el tema sembrado con
// "crimen" en el título (índice 0 del seed, el mismo que descubrimiento-temas.spec.ts).

async function registerFreshUser(page: Page): Promise<string> {
  const runId = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  const username = `voter${runId}`;

  await page.goto("/registro");
  await page.getByLabel("Nombre de usuario").fill(username);
  await page.getByLabel("Email").fill(`${username}@example.com`);
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/");

  return username;
}

async function openCrimenTopic(page: Page) {
  await page.getByRole("searchbox", { name: "Buscar temas" }).fill("crimen");
  await expect(page).toHaveURL(/\?q=crimen/, { timeout: 5_000 });

  const item = page.locator("main ul[aria-label='Temas'] > li a").first();
  await expect(item).toBeVisible({ timeout: 5_000 });
  await item.click();
}

test.describe("Emisión de voto y opiniones", () => {
  test("Votar positivo con justificación: totales y opinión verde, persiste al reentrar", async ({
    page,
  }) => {
    await registerFreshUser(page);
    await openCrimenTopic(page);

    await expect(page.getByRole("button", { name: "Votar a favor" })).toBeVisible();
    await page.getByRole("button", { name: "Votar a favor" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const justification = `Me convence ${Date.now()}`;
    await dialog.getByLabel("Justificación").fill(justification);
    await dialog.getByRole("button", { name: "Votar" }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: "Votar a favor" })).not.toBeVisible();

    const opinionText = page.getByText(justification);
    await expect(opinionText).toBeVisible({ timeout: 5_000 });
    const opinionItem = page.locator("li", { has: opinionText });
    await expect(opinionItem).toHaveClass(/border-green-600/);

    // Reentrar en el tema: se ven los resultados, no los botones.
    await page.reload();
    await expect(page.getByRole("button", { name: "Votar a favor" })).not.toBeVisible();
    await expect(opinionText).toBeVisible();
  });

  test("Votar negativo sin justificación: totales sin nueva opinión", async ({ page }) => {
    const username = await registerFreshUser(page);
    await openCrimenTopic(page);

    await expect(page.getByRole("button", { name: "Votar en contra" })).toBeVisible();
    await page.getByRole("button", { name: "Votar en contra" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Confirma sin escribir justificación.
    await dialog.getByRole("button", { name: "Votar" }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: "Votar en contra" })).not.toBeVisible();
    // Un voto sin justificación no genera una opinión con su usuario.
    await expect(page.getByText(username)).toHaveCount(0);
  });

  test("Cancelar el diálogo: no registra ningún voto", async ({ page }) => {
    await registerFreshUser(page);
    await openCrimenTopic(page);

    await page.getByRole("button", { name: "Votar a favor" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).not.toBeVisible();

    // Siguen visibles los dos botones: no se registró ningún voto.
    await expect(page.getByRole("button", { name: "Votar a favor" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Votar en contra" })).toBeVisible();
  });
});

// Fecha y marca de voto en las tarjetas (TKT-053, specs `identidad-visual` de
// tarjeta-tema-fecha-y-voto). El tema «crimen» lo creó ana (seed, índice 0).
test.describe("Tarjetas de tema: fecha y marca de voto", () => {
  const crimenCard = (page: Page) => page.locator("main ul[aria-label='Temas'] > li a").first();

  test("Sin votar: cada tarjeta muestra su fecha y ninguna está marcada", async ({ page }) => {
    await registerFreshUser(page);

    const cards = page.locator("main ul[aria-label='Temas'] > li a");
    await expect(cards.first()).toBeVisible({ timeout: 5_000 });
    await expect(cards.first().locator("time")).toBeVisible();
    await expect(cards.first().locator("time")).toHaveText(
      /(ahora|hace \d+ (min|h|d)|\d+ \p{L}+)/u,
    );
    await expect(
      page.locator(
        "main ul[aria-label='Temas'] > li a.bg-green-50, main ul[aria-label='Temas'] > li a.bg-red-50",
      ),
    ).toHaveCount(0);
    await expect(page.getByText(/Has votado/)).toHaveCount(0);
  });

  test("Votar a favor y volver: la tarjeta pasa a verde con el desglose", async ({ page }) => {
    await registerFreshUser(page);
    await openCrimenTopic(page);

    await page.getByRole("button", { name: "Votar a favor" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Votar" }).click();
    await expect(page.getByRole("button", { name: "Votar a favor" })).not.toBeVisible({
      timeout: 5_000,
    });

    await page.goBack();
    await expect(page).toHaveURL(/\?q=crimen/);

    const card = crimenCard(page);
    await expect(card).toHaveClass(/bg-green-50/, { timeout: 5_000 });
    await expect(card.getByText("Has votado a favor")).toBeAttached();
    await expect(card).toContainText(/\d+ a favor/);
    await expect(card).toContainText(/\d+ en contra/);
  });

  test("Votar en contra y volver: la tarjeta pasa a rojo", async ({ page }) => {
    await registerFreshUser(page);
    await openCrimenTopic(page);

    await page.getByRole("button", { name: "Votar en contra" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Votar" }).click();
    await expect(page.getByRole("button", { name: "Votar en contra" })).not.toBeVisible({
      timeout: 5_000,
    });

    await page.goBack();

    const card = crimenCard(page);
    await expect(card).toHaveClass(/bg-red-50/, { timeout: 5_000 });
    await expect(card.getByText("Has votado en contra")).toBeAttached();
  });

  test("Perfil del autor: el tema votado aparece marcado igual", async ({ page }) => {
    await registerFreshUser(page);
    await openCrimenTopic(page);
    await page.getByRole("button", { name: "Votar a favor" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Votar" }).click();
    await expect(page.getByRole("button", { name: "Votar a favor" })).not.toBeVisible({
      timeout: 5_000,
    });

    await page.goto("/personas?q=ana");
    await page.getByRole("link", { name: /\bana\b/ }).click();
    await expect(page).toHaveURL(/\/persona\?id=/);

    const topics = page.getByRole("region", { name: "Temas de ana" });
    const card = topics.getByRole("link").filter({ hasText: /crimen/ });
    await expect(card).toHaveClass(/bg-green-50/, { timeout: 5_000 });
    await expect(card.locator("time")).toBeVisible();
  });
});
