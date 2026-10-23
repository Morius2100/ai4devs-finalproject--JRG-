import { expect, test, type Page } from "@playwright/test";

// E2E del requisito «Pantallas de identificación centradas» (TKT-049, spec `identidad-visual`).

const TOLERANCE_PX = 16;

async function boxes(page: Page) {
  const header = await page.locator("h1").first().locator("xpath=..").boundingBox();
  const card = await page.locator("form").locator("xpath=..").boundingBox();
  const viewport = page.viewportSize();
  expect(header).not.toBeNull();
  expect(card).not.toBeNull();
  expect(viewport).not.toBeNull();
  return { header: header!, card: card!, viewportHeight: viewport!.height };
}

for (const route of ["/login", "/registro"]) {
  test.describe(`Pantalla ${route}`, () => {
    test("Tarjeta centrada en el espacio bajo la cabecera, sin solape (390 × 844)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route);

      const { header, card, viewportHeight } = await boxes(page);
      const headerBottom = header.y + header.height;
      const cardBottom = card.y + card.height;

      expect(card.y).toBeGreaterThanOrEqual(headerBottom);
      const above = card.y - headerBottom;
      const below = viewportHeight - cardBottom;
      expect(Math.abs(above - below)).toBeLessThan(TOLERANCE_PX);

      const cardCenterX = card.x + card.width / 2;
      expect(Math.abs(cardCenterX - 390 / 2)).toBeLessThan(1);
    });

    test("Pantalla baja (390 × 500): sin solape y botón de envío alcanzable", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 500 });
      await page.goto(route);

      const { header, card } = await boxes(page);
      expect(card.y).toBeGreaterThanOrEqual(header.y + header.height);

      const submit = page.getByRole("button", { name: /Iniciar sesión|Crear cuenta/ });
      await submit.scrollIntoViewIfNeeded();
      await expect(submit).toBeInViewport();
    });
  });
}
