// Genera en `assets/` las imágenes de origen del icono y la pantalla de
// arranque de la app Android (TKT-047) a partir del símbolo de Opina, y
// después: npx capacitor-assets generate --android
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const GREEN = "#035949";
const YELLOW = "#FFC244";
// Mismo trazo que MARK_RING / MARK_TAIL de src/components/Logo.tsx.
const mark = `<circle cx="30" cy="28" r="22" fill="none" stroke="${YELLOW}" stroke-width="11"/><path d="M12 42L5 60L26 48z" fill="${YELLOW}"/>`;

function svg(size, viewBox, background) {
  const bg = background
    ? `<rect x="-1000" y="-1000" width="3000" height="3000" fill="${background}"/>`
    : "";
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${bg}${mark}</svg>`,
  );
}

mkdirSync("assets", { recursive: true });
const outputs = [
  ["assets/icon-only.png", svg(1024, "-18 -16 96 96", GREEN)],
  // Icono adaptativo: el símbolo dentro de la zona segura (~60 %).
  ["assets/icon-foreground.png", svg(1024, "-24 -25 110 110")],
  ["assets/icon-background.png", svg(1024, "0 0 10 10", GREEN)],
  ["assets/splash.png", svg(2732, "-119 -120 300 300", GREEN)],
  ["assets/splash-dark.png", svg(2732, "-119 -120 300 300", GREEN)],
];
for (const [file, image] of outputs) {
  await sharp(image).png().toFile(file);
  console.log(`✓ ${file}`);
}
