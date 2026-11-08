import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// E2E de la spec `confidencialidad-usuarios` (TKT-086, S-05 y S-06): cabeceras
// de seguridad, ausencia de violaciones de CSP en el flujo completo e imagen de
// un tema privado con URL firmada. Usa los usuarios semilla: bruno es amigo de
// ana y dani no (prisma/seed.ts).

const IMAGE = path.join(__dirname, "fixtures", "topic-image.png");

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/");
}

async function logout(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú principal" }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/login");
}

test("la web responde con las cabeceras de seguridad", async ({ request }) => {
  const response = await request.get("/login");
  const headers = response.headers();

  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
});

test("tema privado con imagen: el amigo la ve sin violaciones de CSP; sin firma o sin amistad no", async ({
  page,
  request,
}) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/content security policy|violates the following/i.test(message.text())) {
      violations.push(message.text());
    }
  });

  // ana crea un tema privado con imagen.
  await login(page, "ana@opina.test");
  await page.getByRole("button", { name: "Abrir menú principal" }).click();
  await page.getByRole("menuitem", { name: "Crear tema" }).click();
  const title = `¿Imagen privada? ${Date.now().toString(36)}`;
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Privado").check();
  await page.getByLabel("Imagen (opcional)").setInputFiles(IMAGE);
  await page.getByRole("button", { name: "Crear tema" }).click();
  await expect(page).toHaveURL(/\/tema\?id=[0-9a-f-]{36}$/, { timeout: 10_000 });
  const topicUrl = page.url();
  await logout(page);

  // bruno, amigo de ana, abre el tema: la imagen carga y la URL lleva firma.
  await login(page, "bruno@opina.test");
  await page.goto(topicUrl);
  const image = page.getByRole("img", { name: title });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  const signedSrc = (await image.getAttribute("src")) ?? "";
  expect(signedSrc).toMatch(/\/api\/media\/topics\/[0-9a-f-]{36}\.\w+\?exp=\d+&sig=[0-9a-f]{64}/);
  const signedUrl = signedSrc.startsWith("http") ? signedSrc : new URL(signedSrc, topicUrl).href;

  // Con la firma, cualquiera con el enlace puede verla mientras no caduque; sin ella, no.
  expect((await request.get(signedUrl)).status()).toBe(200);
  expect((await request.get(signedUrl.split("?")[0])).status()).toBe(404);
  await logout(page);

  // dani, que no es amigo, no ve el tema.
  await login(page, "dani@opina.test");
  await page.goto(topicUrl);
  await expect(page.getByRole("heading", { name: "Tema no encontrado" })).toBeVisible();

  expect(violations, violations.join("\n")).toEqual([]);
});
