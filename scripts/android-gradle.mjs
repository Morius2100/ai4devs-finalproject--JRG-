// Ejecuta una tarea de Gradle del proyecto `android/` (TKT-046) con el JDK 21
// de Android Studio si JAVA_HOME no está definido.
//   node scripts/android-gradle.mjs assembleDebug
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const task = process.argv[2] ?? "assembleDebug";
const studioJdk = "C:/Program Files/Android/Android Studio/jbr";
const env = { ...process.env };
if (!env.JAVA_HOME && existsSync(studioJdk)) {
  env.JAVA_HOME = studioJdk;
}

if (!/^[A-Za-z:]+$/.test(task)) {
  console.error(`Tarea de Gradle no válida: ${task}`);
  process.exit(1);
}
const gradlew = process.platform === "win32" ? ".\\gradlew.bat" : "./gradlew";
const result = spawnSync(`${gradlew} ${task}`, {
  cwd: "android",
  stdio: "inherit",
  env,
  shell: true,
});
process.exit(result.status ?? 1);
