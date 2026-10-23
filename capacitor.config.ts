import type { CapacitorConfig } from "@capacitor/cli";

// App Android con la interfaz empaquetada (TKT-046, design.md D1/D8): carga el
// export estático de `OPINA_TARGET=mobile` y habla con la API de NEXT_PUBLIC_API_URL.
// `OPINA_MOBILE_ENV=dev`: origen http://localhost para llamar a http://localhost:3000
// por `adb reverse` sin bloqueo de contenido mixto.
const isDev = process.env.OPINA_MOBILE_ENV === "dev";

const BRAND_GREEN = "#035949";

const config: CapacitorConfig = {
  appId: "com.opina.app",
  appName: "Opina",
  webDir: "out-mobile",
  server: {
    androidScheme: isDev ? "http" : "https",
    cleartext: isDev,
  },
  android: { backgroundColor: BRAND_GREEN },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: BRAND_GREEN,
      showSpinner: false,
    },
    // Android 15+ (edge-to-edge): la barra toma el color del fondo de la ventana
    // (res/values/opina_colors.xml); aquí solo el estilo de los iconos.
    SystemBars: {
      style: "DARK",
    },
    StatusBar: {
      backgroundColor: BRAND_GREEN,
      style: "DARK",
      overlaysWebView: false,
    },
  },
};

export default config;
