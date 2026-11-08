import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Pruebas de accesibilidad (T9): axe-core sobre las pantallas principales en el
// navegador real (incluye contraste de color). Reglas WCAG 2.0/2.1 niveles A y AA.
// Usa los usuarios semilla (prisma/seed.ts).

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoViolations(page: Page, name: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help}\n` +
      violation.nodes
        .slice(0, 3)
        .map((node) => `   - ${node.target.join(" ")}`)
        .join("\n"),
  );
  expect(summary, `Infracciones de accesibilidad en «${name}»:\n${summary.join("\n")}`).toEqual([]);
}

async function login(page: Page, email = "ana@opina.test") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/");
}

test.describe("Pantallas sin sesión", () => {
  test("Inicio de sesión", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();

    await expectNoViolations(page, "Inicio de sesión");
  });

  test("Inicio de sesión con error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nadie@opina.test");
    await page.getByLabel("Contraseña").fill("incorrecta");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByRole("alert")).toBeVisible();

    await expectNoViolations(page, "Inicio de sesión con error");
  });

  test("Registro", async ({ page }) => {
    await page.goto("/registro");
    await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible();

    await expectNoViolations(page, "Registro");
  });

  test("Registro con errores de validación", async ({ page }) => {
    await page.goto("/registro");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("El email es obligatorio")).toBeVisible();

    await expectNoViolations(page, "Registro con errores");
  });
});

test("Tema sin votar y diálogo de justificación (usuario nuevo, sin votos)", async ({ page }) => {
  // Un usuario recién registrado no ha votado nada: el estado no depende de la base local.
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await page.goto("/registro");
  await page.getByLabel("Nombre de usuario").fill(`e2ea${runId}`);
  await page.getByLabel("Email").fill(`e2ea+${runId}@example.com`);
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("link", { name: /votos?/ }).first().click();
  await expect(page.getByRole("button", { name: "Votar a favor" })).toBeVisible();

  await expectNoViolations(page, "Tema sin votar");

  await page.getByRole("button", { name: "Votar a favor" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await expectNoViolations(page, "Diálogo de justificación");
});

test.describe("Pantallas con sesión", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Pantalla principal (tendencias)", async ({ page }) => {
    await expect(page.getByRole("searchbox", { name: "Buscar temas" })).toBeVisible();
    await expect(page.getByRole("link", { name: /votos?/ }).first()).toBeVisible();

    await expectNoViolations(page, "Pantalla principal");
  });

  test("Menú principal abierto", async ({ page }) => {
    await page.getByRole("button", { name: "Abrir menú principal" }).click();
    await expect(page.getByRole("menuitem", { name: "Crear tema" })).toBeVisible();

    await expectNoViolations(page, "Menú principal");
  });

  test("Tema ya votado (resultados y opiniones)", async ({ page }) => {
    const links = page.getByRole("link", { name: /votos?/ });
    await expect(links.first()).toBeVisible();
    await links.first().click();
    const vote = page.getByRole("button", { name: "Votar a favor" });
    if (await vote.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await vote.click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("textbox", { name: "Justificación" }).fill("Accesible");
      await dialog.getByRole("button", { name: "Votar" }).click();
    }
    await expect(page.getByText("Resultados", { exact: true })).toBeAttached();

    await expectNoViolations(page, "Tema votado");
  });

  test("Crear tema", async ({ page }) => {
    await page.goto("/temas/nuevo");
    await expect(page.getByRole("button", { name: "Crear tema" })).toBeVisible();

    await expectNoViolations(page, "Crear tema");
  });

  test("Crear tema con error de validación", async ({ page }) => {
    await page.goto("/temas/nuevo");
    await page.getByLabel("Título").fill("ab");
    await page.getByRole("button", { name: "Crear tema" }).click();
    await expect(page.locator("p.text-red-600, [role=alert]").first()).toBeVisible();

    await expectNoViolations(page, "Crear tema con error");
  });

  test("Notificaciones", async ({ page }) => {
    await page.goto("/notificaciones");
    await expect(page.getByRole("heading").first()).toBeVisible();

    await expectNoViolations(page, "Notificaciones");
  });

  test("Personas", async ({ page }) => {
    await page.goto("/personas");
    await expect(page.getByRole("searchbox", { name: "Buscar personas" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Amigo|No amigo/ }).first()).toBeVisible();

    await expectNoViolations(page, "Personas");
  });

  test("Perfil de otra persona", async ({ page }) => {
    await page.goto("/personas?q=bruno");
    await page.getByRole("link", { name: /bruno/ }).first().click();
    await expect(page.getByRole("heading", { name: "bruno", exact: true })).toBeVisible();

    await expectNoViolations(page, "Perfil de otra persona");
  });

  test("Mi perfil", async ({ page }) => {
    await page.goto("/perfil");
    await expect(page.getByRole("link", { name: "Editar perfil" })).toBeVisible();

    await expectNoViolations(page, "Mi perfil");
  });

  test("Editar perfil", async ({ page }) => {
    await page.goto("/perfil/editar");
    await expect(page.getByLabel("Descripción")).toBeVisible();

    await expectNoViolations(page, "Editar perfil");
  });

  test("Mis amigos", async ({ page }) => {
    await page.goto("/perfil/amigos");
    await expect(page.getByRole("heading", { name: "Amigos" })).toBeVisible();

    await expectNoViolations(page, "Mis amigos");
  });
});
