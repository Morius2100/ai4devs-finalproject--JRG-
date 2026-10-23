import path from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";

// E2E de las specs `mi-perfil` y `menu-inferior` (TKT-065, HU-20, HU-21).
// Cada usuario se registra en su propio contexto de navegador.

const VIEWPORT = { width: 390, height: 844 };
const PHOTO = path.join(__dirname, "fixtures", "topic-image.png");

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

async function createTopic(page: Page, title: string, visibility: "Público" | "Privado") {
  await page.goto("/temas/nuevo");
  await page.getByLabel("Título").fill(title);
  await page.getByLabel(visibility).check();
  await page.getByRole("button", { name: "Crear tema" }).click();
  await expect(page).toHaveURL(/\/tema\?id=[0-9a-f-]{36}$/, { timeout: 10_000 });
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

const nav = (page: Page) => page.getByRole("navigation", { name: "Secciones" });

test("la pestaña Perfil muestra mis datos y mis temas, también el privado", async ({
  browser,
  baseURL,
}) => {
  const eva = await registerInNewContext(browser, baseURL, "perfeva");

  try {
    // Menú inferior con tres pestañas; «Perfil» lleva a /perfil y queda activa.
    await expect(nav(eva.page).getByRole("link")).toHaveCount(3);
    await nav(eva.page).getByRole("link", { name: "Perfil" }).click();
    await expect(eva.page).toHaveURL("/perfil");
    await expect(nav(eva.page).getByRole("link", { name: "Perfil" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Recién registrada: sin temas ni amigos.
    await expect(eva.page.getByRole("heading", { name: eva.username, exact: true })).toBeVisible();
    await expect(eva.page.getByText("0 temas")).toBeVisible();
    await expect(eva.page.getByRole("link", { name: "0 amigos" })).toBeVisible();
    await expect(eva.page.getByText("Todavía no has creado temas.")).toBeVisible();
    await expect(eva.page.getByRole("link", { name: "Crear un tema" })).toBeVisible();

    // Un tema público y uno privado: «Mis temas» los lista y el contador los cuenta.
    const publicTitle = `¿Mi tema público? ${Date.now().toString(36)}`;
    const privateTitle = `¿Mi tema privado? ${Date.now().toString(36)}`;
    await createTopic(eva.page, publicTitle, "Público");
    await createTopic(eva.page, privateTitle, "Privado");

    await eva.page.goto("/perfil");
    await expect(eva.page.getByText("2 temas")).toBeVisible();
    const mine = eva.page.getByRole("region", { name: "Mis temas" });
    await expect(mine.getByRole("link", { name: publicTitle })).toBeVisible();
    const privateCard = mine.getByRole("link", { name: privateTitle });
    await expect(privateCard).toContainText("Privado");

    // «Más puntuados» recarga la lista.
    await mine.getByRole("button", { name: "Más puntuados" }).click();
    await expect(mine.getByRole("button", { name: "Más puntuados" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(mine.getByRole("link", { name: publicTitle })).toBeVisible();
  } finally {
    await eva.close();
  }
});

test("editar el perfil: descripción y foto se ven en mi perfil y en el perfil que ven los demás", async ({
  browser,
  baseURL,
  request,
}) => {
  const eva = await registerInNewContext(browser, baseURL, "perfedi");
  const otro = await registerInNewContext(browser, baseURL, "perfotr");

  try {
    await eva.page.goto("/perfil");
    await eva.page.getByRole("link", { name: "Editar perfil" }).click();
    await expect(eva.page).toHaveURL("/perfil/editar");
    await expect(nav(eva.page).getByRole("link", { name: "Perfil" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const bio = `Cinéfila y debatidora ${Date.now().toString(36)}`;
    await eva.page.getByLabel("Descripción").fill(bio);
    await eva.page.getByLabel("Cambiar foto").setInputFiles(PHOTO);
    await expect(
      eva.page.getByRole("img", { name: "Vista previa de la nueva foto" }),
    ).toBeVisible();
    await eva.page.getByRole("button", { name: "Guardar" }).click();

    await expect(eva.page).toHaveURL("/perfil", { timeout: 10_000 });
    const header = eva.page.getByRole("region", { name: "Perfil", exact: true });
    await expect(header.getByText(bio)).toBeVisible();
    await expect(header.locator("img")).toBeVisible();
    await expect(header.getByTestId("avatar-placeholder")).toHaveCount(0);

    // La foto se sirve desde la propia API (/api/media), accesible sin sesión y con caché larga.
    const src = decodeURIComponent((await header.locator("img").getAttribute("src")) ?? "");
    const key = /\/api\/media\/(avatars\/[0-9a-f-]{36}\.\w+)/.exec(src)?.[1];
    expect(key, `la imagen debe venir de /api/media/avatars (src: ${src})`).toBeDefined();
    const direct = await request.get(`/api/media/${key}`);
    expect(direct.status()).toBe(200);
    expect(direct.headers()["content-type"]).toBe("image/png");
    expect(direct.headers()["cache-control"]).toContain("immutable");

    // Otra persona ve la descripción y la foto en el perfil de Personas.
    await otro.page.goto(`/personas?q=${eva.username}`);
    await otro.page.getByRole("link", { name: eva.username }).click();
    await expect(otro.page).toHaveURL(/\/persona\?id=/);
    const theirView = otro.page.getByRole("region", { name: "Perfil", exact: true });
    await expect(theirView.getByText(bio)).toBeVisible();
    await expect(theirView.locator("img")).toBeVisible();

    // Quitar la foto deja la inicial y vaciar la descripción la elimina.
    await eva.page.goto("/perfil/editar");
    await eva.page.getByRole("button", { name: "Quitar foto" }).click();
    await eva.page.getByLabel("Descripción").fill("");
    await eva.page.getByRole("button", { name: "Guardar" }).click();
    await expect(eva.page).toHaveURL("/perfil", { timeout: 10_000 });
    await expect(header.getByTestId("avatar-placeholder")).toBeVisible();
    await expect(header.getByText(bio)).toHaveCount(0);
  } finally {
    await Promise.all([eva.close(), otro.close()]);
  }
});

test("foto no válida: error junto al campo, sin cambios, y «Cancelar» vuelve al perfil", async ({
  browser,
  baseURL,
}) => {
  const eva = await registerInNewContext(browser, baseURL, "perfval");

  try {
    await eva.page.goto("/perfil/editar");
    await eva.page.getByLabel("Descripción").fill("No debería guardarse");
    await eva.page.getByLabel("Cambiar foto").setInputFiles({
      name: "falsa.png",
      mimeType: "image/png",
      buffer: Buffer.from("%PDF-1.4 esto no es una imagen"),
    });
    await eva.page.getByRole("button", { name: "Guardar" }).click();

    const section = eva.page.getByRole("region", { name: "Foto de perfil" });
    await expect(section.getByRole("alert")).toContainText(
      "Solo se permiten imágenes JPEG, PNG o WebP",
    );
    await expect(eva.page).toHaveURL("/perfil/editar");

    await eva.page.getByRole("link", { name: "Cancelar" }).click();
    await expect(eva.page).toHaveURL("/perfil");
    await expect(eva.page.getByText("No debería guardarse")).toHaveCount(0);
  } finally {
    await eva.close();
  }
});

test("lista de amigos: mis amigos abren su perfil y quitar uno actualiza la lista y el contador", async ({
  browser,
  baseURL,
}) => {
  const eva = await registerInNewContext(browser, baseURL, "perfami");
  const bruno = await registerInNewContext(browser, baseURL, "perfbru");

  try {
    await befriend(eva.page, bruno.username);

    await eva.page.goto("/perfil");
    await expect(eva.page.getByRole("link", { name: "1 amigo" })).toBeVisible();
    await eva.page.getByRole("link", { name: "1 amigo" }).click();
    await expect(eva.page).toHaveURL("/perfil/amigos");
    await expect(nav(eva.page).getByRole("link", { name: "Perfil" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const friendCard = eva.page.getByRole("link", { name: bruno.username });
    await expect(friendCard).toContainText("Amigo");
    await friendCard.click();
    await expect(eva.page).toHaveURL(/\/persona\?id=/);

    // Quitar la amistad y volver: la lista queda vacía y el contador baja.
    await eva.page.getByRole("button", { name: "Amigos" }).click();
    await expect(eva.page.getByRole("button", { name: "Añadir a amigos" })).toBeVisible();
    await eva.page.goto("/perfil/amigos");
    await expect(eva.page.getByText("Todavía no tienes amigos.")).toBeVisible();
    await expect(eva.page.getByRole("link", { name: "Buscar personas" })).toBeVisible();
    await eva.page.goto("/perfil");
    await expect(eva.page.getByRole("link", { name: "0 amigos" })).toBeVisible();
  } finally {
    await Promise.all([eva.close(), bruno.close()]);
  }
});
