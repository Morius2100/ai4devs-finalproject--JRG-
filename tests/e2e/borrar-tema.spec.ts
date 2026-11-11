import path from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";

// E2E de la spec `borrado-temas` (TKT-089, HU-23). Cada usuario se registra en su
// propio contexto de navegador, para no depender de los datos del seed.

const VIEWPORT = { width: 390, height: 844 };
const IMAGE = path.join(__dirname, "fixtures", "topic-image.png");
const TOPIC_URL = /\/tema\?id=[0-9a-f-]{36}$/;

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

async function createTopic(page: Page, title: string, options: { image?: boolean } = {}) {
  await page.goto("/temas/nuevo");
  await page.getByLabel("Título").fill(title);
  if (options.image) {
    await page.locator('input[type="file"]').setInputFiles(IMAGE);
  }
  await page.getByRole("button", { name: "Crear tema" }).click();
  await expect(page).toHaveURL(TOPIC_URL, { timeout: 10_000 });
  return page.url();
}

test.describe("Borrar un tema propio (HU-23)", () => {
  test("el autor borra su tema desde el detalle: vuelve a temas y desaparece de todas partes", async ({
    browser,
    baseURL,
  }) => {
    const eva = await registerInNewContext(browser, baseURL, "evaborra");
    const title = `¿Tema a borrar? ${Date.now().toString(36)}`;
    const topicUrl = await createTopic(eva.page, title);

    // CA-23.1 · papelera junto al título, con área táctil de al menos 44 px.
    const trash = eva.page.getByRole("button", { name: "Borrar tema" });
    await expect(trash).toBeVisible();
    const box = await trash.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);

    // CA-23.4 · cancelar no borra.
    await trash.click();
    const dialog = eva.page.getByRole("alertdialog", { name: "¿Borrar este tema?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(eva.page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    // CA-23.4 · Esc también cancela.
    await trash.click();
    await eva.page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);

    // CA-23.7 · confirmar borra y vuelve a la pantalla de temas.
    await trash.click();
    await dialog.getByRole("button", { name: "Borrar", exact: true }).click();
    await expect(eva.page).toHaveURL("/");

    // El tema desaparece de la búsqueda y de «Mis temas».
    await eva.page.getByRole("searchbox", { name: "Buscar temas" }).fill(title);
    await expect(eva.page.getByRole("link", { name: title })).toHaveCount(0);
    await eva.page.goto("/perfil");
    await expect(eva.page.getByText("Todavía no has creado temas.")).toBeVisible();

    // El enlace antiguo muestra «tema no encontrado».
    await eva.page.goto(topicUrl);
    await expect(eva.page.getByRole("heading", { name: "Tema no encontrado" })).toBeVisible();

    await eva.close();
  });

  test("otra persona no ve la papelera en un tema ajeno y no puede borrarlo por la API", async ({
    browser,
    baseURL,
  }) => {
    const owner = await registerInNewContext(browser, baseURL, "autor");
    const visitor = await registerInNewContext(browser, baseURL, "visita");
    const title = `¿Tema ajeno? ${Date.now().toString(36)}`;
    const topicUrl = await createTopic(owner.page, title);
    const topicId = new URL(topicUrl).searchParams.get("id");

    // CA-23.2 · en el detalle de un tema ajeno no hay botón.
    await visitor.page.goto(topicUrl);
    await expect(visitor.page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(visitor.page.getByRole("button", { name: "Borrar tema" })).toHaveCount(0);

    // CA-23.5 · aunque llame a la API directamente, el servidor responde 404 y no borra.
    const response = await visitor.page.request.delete(`/api/topics/${topicId}`);
    expect(response.status()).toBe(404);
    await visitor.page.reload();
    await expect(visitor.page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    // CA-23.2 · tampoco se ofrece borrar en el perfil de quien lo creó.
    await owner.page.goto("/perfil");
    await expect(owner.page.getByRole("button", { name: "Borrar tema" })).toHaveCount(0);

    await owner.close();
    await visitor.close();
  });

  test("con imagen, la papelera queda junto al título y no tapa la imagen", async ({
    browser,
    baseURL,
  }) => {
    const eva = await registerInNewContext(browser, baseURL, "evaimagen");
    const title = `¿Tema con imagen? ${Date.now().toString(36)}`;
    await createTopic(eva.page, title, { image: true });

    const image = eva.page.getByRole("img", { name: title });
    const trash = eva.page.getByRole("button", { name: "Borrar tema" });
    await expect(image).toBeVisible();
    await expect(trash).toBeVisible();

    const imageBox = await image.boundingBox();
    const trashBox = await trash.boundingBox();
    expect(imageBox).not.toBeNull();
    expect(trashBox).not.toBeNull();
    // El botón empieza donde acaba la imagen (la tarjeta del título la solapa unos píxeles).
    expect(trashBox!.y).toBeGreaterThanOrEqual(imageBox!.y + imageBox!.height - 1);
    expect(trashBox!.width).toBeGreaterThanOrEqual(44);
    expect(trashBox!.height).toBeGreaterThanOrEqual(44);

    await eva.close();
  });
});
