import { expect, test } from "@playwright/test";

// E2E de la spec `identificacion-usuarios` (TKT-010, HU-00).
// Usuario semilla disponible (prisma/seed.ts): ana@opina.test / password123.

test.describe("Registro de usuario", () => {
  test("Registro correcto", async ({ page }) => {
    const runId = Date.now().toString(36);

    await page.goto("/registro");
    await page.getByLabel("Nombre de usuario").fill(`e2euser${runId}`);
    await page.getByLabel("Email").fill(`e2e+${runId}@example.com`);
    await page.getByLabel("Contraseña").fill("password123");
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page).toHaveURL("/");
    // `exact: true`: por defecto el nombre accesible se busca como subcadena
    // y algunos títulos de tema sembrados (p. ej. "propina") contienen "opina".
    await expect(page.getByRole("link", { name: "Opina", exact: true })).toBeVisible();
  });
});

test.describe("Inicio de sesión", () => {
  test("Credenciales incorrectas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("no-existe@example.com");
    await page.getByLabel("Contraseña").fill("password-incorrecta");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    // `getByRole("alert")` también resuelve al route-announcer de Next.js;
    // se localiza el mensaje por texto para evitar la violación de modo estricto.
    await expect(page.getByText("Credenciales incorrectas")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });
});

test.describe("Protección de pantallas y API", () => {
  test("Visitante accede a una pantalla protegida", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("Petición a la API sin sesión", async ({ request }) => {
    const response = await request.get("/api/topics");
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

test.describe("Cierre de sesión desde el menú principal", () => {
  test("Cerrar sesión", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("ana@opina.test");
    await page.getByLabel("Contraseña").fill("password123");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("button", { name: "Abrir menú principal" }).click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();

    await expect(page).toHaveURL("/login");
  });
});
