import { expect, test, type Browser, type Page } from "@playwright/test";

// E2E de la spec `historias` (TKT-058, HU-19). Cada usuario se registra en su
// propio contexto de navegador, para no depender de las historias del seed.

const VIEWPORT = { width: 390, height: 844 };

async function registerInNewContext(browser: Browser, baseURL: string | undefined, label: string) {
  const username = `${label}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  const context = await browser.newContext({ baseURL, viewport: VIEWPORT });
  const page = await context.newPage();

  await page.goto("/registro");
  await page.getByLabel("Nombre de usuario").fill(username);
  await page.getByLabel("Email").fill(`${username}@example.com`);
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/");

  return { username, page, close: () => context.close() };
}

async function befriend(page: Page, otherUsername: string) {
  await page.goto(`/personas?q=${otherUsername}`);
  await page.getByRole("link", { name: otherUsername }).click();
  await expect(page).toHaveURL(/\/persona\?id=/);
  await page.getByRole("button", { name: "Añadir a amigos" }).click();
  await expect(page.getByRole("button", { name: "Amigos" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
}

async function createTopic(page: Page, title: string) {
  await page.goto("/temas/nuevo");
  await page.getByLabel("Título").fill(title);
  await page.getByRole("button", { name: "Crear tema" }).click();
  await expect(page).toHaveURL(/\/tema\?id=[0-9a-f-]{36}$/, { timeout: 10_000 });
}

// Abre la pantalla de temas y espera a que las historias lleguen: sin esa espera,
// `toHaveCount(0)` se cumpliría al instante, mientras la fila aún está cargando.
async function openHomeAndWaitForStories(page: Page) {
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/stories")),
    page.goto("/"),
  ]);
}

const storiesNav = (page: Page) =>
  page.getByRole("navigation", { name: "Historias de tus amigos" });

test("amigo crea un tema: aparece su burbuja, se abre y desaparece al volver; un no amigo no genera burbuja", async ({
  browser,
  baseURL,
}) => {
  const ana = await registerInNewContext(browser, baseURL, "histana");
  const bruno = await registerInNewContext(browser, baseURL, "histbru");
  const dani = await registerInNewContext(browser, baseURL, "histdan");

  try {
    // Sin amigos ni temas: la pantalla de temas no muestra la fila de historias.
    await openHomeAndWaitForStories(ana.page);
    await expect(storiesNav(ana.page)).toHaveCount(0);

    // bruno y ana son amigos; bruno y dani (no amigo de ana) crean un tema cada uno.
    await befriend(bruno.page, ana.username);
    const brunoTitle = `¿Tema de historia? ${Date.now().toString(36)}`;
    await createTopic(bruno.page, brunoTitle);
    await createTopic(dani.page, `¿Tema de un desconocido? ${Date.now().toString(36)}`);

    // ana ve solo la burbuja de bruno.
    await openHomeAndWaitForStories(ana.page);
    const nav = storiesNav(ana.page);
    await expect(nav).toBeVisible({ timeout: 5_000 });
    await expect(nav.getByRole("link")).toHaveCount(1);
    const bubble = nav.getByRole("link", { name: `Nuevo tema de ${bruno.username}` });
    await expect(bubble).toBeVisible();

    // La búsqueda oculta la fila y al vaciarla vuelve.
    const search = ana.page.getByRole("searchbox", { name: "Buscar temas" });
    await search.fill("tema");
    await expect(ana.page).toHaveURL(/\?q=tema/, { timeout: 5_000 });
    await expect(nav).toHaveCount(0);
    await search.fill("");
    await expect(ana.page).toHaveURL("/", { timeout: 5_000 });
    await expect(bubble).toBeVisible();

    // Pulsar la burbuja abre el tema; al volver, la burbuja ya no está.
    await bubble.click();
    await expect(ana.page).toHaveURL(/\/tema\?id=[0-9a-f-]{36}$/);
    await expect(ana.page.getByRole("heading", { name: brunoTitle })).toBeVisible();
    await ana.page.goBack();
    await expect(ana.page).toHaveURL("/");
    await expect(storiesNav(ana.page)).toHaveCount(0, { timeout: 5_000 });
  } finally {
    await Promise.all([ana.close(), bruno.close(), dani.close()]);
  }
});

test("un tema abierto desde la lista, sin pasar por la burbuja, deja de contar", async ({
  browser,
  baseURL,
}) => {
  const ana = await registerInNewContext(browser, baseURL, "histana");
  const bruno = await registerInNewContext(browser, baseURL, "histbru");

  try {
    await befriend(bruno.page, ana.username);
    const title = `¿Abierto desde la lista? ${Date.now().toString(36)}`;
    await createTopic(bruno.page, title);

    await openHomeAndWaitForStories(ana.page);
    await expect(storiesNav(ana.page)).toBeVisible({ timeout: 5_000 });

    // Se abre buscando el tema en la lista, no desde la burbuja.
    await ana.page.getByRole("searchbox", { name: "Buscar temas" }).fill(title);
    await expect(ana.page).toHaveURL(/\?q=/, { timeout: 5_000 });
    await ana.page
      .getByRole("link", { name: new RegExp(title.slice(0, 18)) })
      .first()
      .click();
    await expect(ana.page.getByRole("heading", { name: title })).toBeVisible();

    await openHomeAndWaitForStories(ana.page);
    await expect(storiesNav(ana.page)).toHaveCount(0);
  } finally {
    await Promise.all([ana.close(), bruno.close()]);
  }
});
