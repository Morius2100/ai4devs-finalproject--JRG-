import { Preferences } from "@capacitor/preferences";

const TOKEN_KEY = "opina.session-token";

// Caché en memoria: Preferences es asíncrono y se consulta en cada petición.
let cached: string | null | undefined;

/** Token de sesión de la app Android (design.md D4), guardado en SharedPreferences. */
export const tokenStore = {
  async get(): Promise<string | null> {
    if (cached === undefined) {
      cached = (await Preferences.get({ key: TOKEN_KEY })).value;
    }
    return cached;
  },
  async set(token: string): Promise<void> {
    cached = token;
    await Preferences.set({ key: TOKEN_KEY, value: token });
  },
  async clear(): Promise<void> {
    cached = null;
    await Preferences.remove({ key: TOKEN_KEY });
  },
};
