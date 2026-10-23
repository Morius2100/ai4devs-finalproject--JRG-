// Desarrollo con el móvil por cable (TKT-046): `next dev` en el puerto 3000 y
// `adb reverse` de los puertos 3000 (API) y 9000 (MinIO) en cada conexión.
// `adb reverse` vive en la conexión USB: se pierde al desconectar el cable, al
// volver a autorizar la depuración USB o al reiniciar adb. Sin él, la app
// muestra «Sin conexión» aunque el servidor esté en marcha.
//   node scripts/dev-android.mjs
import { spawn, spawnSync } from "node:child_process";

const PORTS = [3000, 9000];
const RETRY_MS = 2000;
const MAX_ATTEMPTS = 5;

let stopping = false;

// Puerto fijo: con `-p`, Next falla si el 3000 está ocupado (p. ej. un
// `next dev` anterior que sigue vivo) en vez de pasarse al 3001 sin avisar.
const server = spawn("npx next dev -p 3000", { stdio: "inherit", shell: true });
server.on("exit", (code) => {
  stopping = true;
  process.exit(code ?? 0);
});

function reverse(serial, attempt = 1) {
  if (stopping) return;
  const failed = PORTS.some(
    (port) =>
      spawnSync("adb", ["-s", serial, "reverse", `tcp:${port}`, `tcp:${port}`], {
        stdio: "ignore",
      }).status !== 0,
  );
  if (!failed) {
    console.log(`[adb] ${serial}: adb reverse de los puertos ${PORTS.join(" y ")} activo.`);
  } else if (attempt < MAX_ATTEMPTS) {
    setTimeout(() => reverse(serial, attempt + 1), RETRY_MS);
  } else {
    console.warn(`[adb] ${serial}: no se pudo activar adb reverse.`);
  }
}

// `adb track-devices` escribe la lista de dispositivos cada vez que cambia:
// longitud en 4 dígitos hexadecimales y líneas `serie\testado`.
function trackDevices() {
  const states = new Map();
  let buffer = "";

  const adb = spawn("adb", ["track-devices"], { stdio: ["ignore", "pipe", "ignore"] });
  adb.stdout.setEncoding("utf8");
  adb.stdout.on("data", (chunk) => {
    // En Windows la salida llega con CRLF, que no cuenta en la longitud.
    buffer += chunk.replace(/\r/g, "");
    while (buffer.length >= 4) {
      const length = parseInt(buffer.slice(0, 4), 16);
      if (buffer.length < 4 + length) break;
      const lines = buffer
        .slice(4, 4 + length)
        .split("\n")
        .filter(Boolean);
      const seen = new Set();
      for (const line of lines) {
        const [serial, state] = line.split("\t");
        seen.add(serial);
        if (state !== states.get(serial)) {
          if (state === "device") {
            reverse(serial);
          } else if (state === "unauthorized") {
            console.warn(
              `[adb] ${serial}: acepta «Permitir depuración USB» en el móvil ` +
                "(marca «Permitir siempre desde este ordenador»).",
            );
          }
        }
        states.set(serial, state);
      }
      for (const serial of states.keys()) {
        if (!seen.has(serial)) states.delete(serial);
      }
      buffer = buffer.slice(4 + length);
    }
  });

  adb.on("error", (error) => {
    if (error.code === "ENOENT") {
      stopping = true;
      console.warn("[adb] No se encuentra adb en el PATH: haz `adb reverse` a mano.");
    }
  });
  // Termina si se reinicia el servidor de adb: se vuelve a lanzar y, al
  // reconectar, reaplica `adb reverse`.
  adb.on("exit", () => {
    if (!stopping) setTimeout(trackDevices, RETRY_MS);
  });
}

trackDevices();
