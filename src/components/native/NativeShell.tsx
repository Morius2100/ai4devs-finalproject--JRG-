"use client";

import { App } from "@capacitor/app";
import { Network } from "@capacitor/network";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { handleBackButton } from "@/components/native/back-button";
import { OfflineScreen, type OfflineReason } from "@/components/native/OfflineScreen";
import { isApiReachable } from "@/lib/platform/api-fetch";
import { NETWORK_ERROR_EVENT } from "@/lib/platform/events";
import { isNativeApp } from "@/lib/platform/native";
import { initServer, isServerConfigurable } from "@/lib/platform/server-store";

const BRAND_GREEN = "#035949";

// Cada cuánto se vuelve a probar la API mientras se muestra «Sin conexión».
const RECONNECT_INTERVAL_MS = 3000;

async function offlineReason(): Promise<OfflineReason> {
  const status = await Network.getStatus();
  return status.connected ? "server" : "network";
}

/**
 * Integración con Android (TKT-047, spec `app-movil`): botón atrás, barra de
 * estado y pantalla de arranque con la marca, y pantalla «Sin conexión» sin
 * red o cuando la API no responde. En la web solo pinta `children`.
 */
export function NativeShell({ children }: { children: ReactNode }) {
  if (!isNativeApp()) {
    return children;
  }
  return <NativeShellInner>{children}</NativeShellInner>;
}

function NativeShellInner({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [offline, setOffline] = useState<OfflineReason | null>(null);
  const [retrying, setRetrying] = useState(false);
  // Formulario «Cambiar servidor» de «Sin conexión» abierto: no se reintenta solo
  // mientras tanto, para que no se cierre mientras el usuario escribe.
  const [editingServer, setEditingServer] = useState(false);
  // Con servidor configurable, nada se pinta ni se pide hasta leer el guardado:
  // las primeras consultas irían al servidor equivocado. La pantalla de arranque sigue visible.
  const [serverReady, setServerReady] = useState(() => !isServerConfigurable());
  const offlineRef = useRef(offline);
  useEffect(() => {
    offlineRef.current = offline;
  }, [offline]);
  const editingServerRef = useRef(editingServer);
  useEffect(() => {
    editingServerRef.current = editingServer;
  }, [editingServer]);

  // Sale de «Sin conexión» solo si la API responde: que el móvil tenga red no
  // basta (servidor reiniciándose, `adb reverse` perdido…).
  const reconnect = useCallback(async () => {
    if (await isApiReachable()) {
      setOffline(null);
      await queryClient.refetchQueries({ type: "active" });
    } else {
      setOffline(await offlineReason());
    }
  }, [queryClient]);

  const retry = useCallback(async () => {
    setRetrying(true);
    try {
      await reconnect();
    } finally {
      setRetrying(false);
    }
  }, [reconnect]);

  useEffect(() => {
    StatusBar.setBackgroundColor({ color: BRAND_GREEN }).catch(() => {});
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

    const back = App.addListener("backButton", (event) =>
      handleBackButton(event, {
        goBack: () => window.history.back(),
        exitApp: () => App.exitApp(),
      }),
    );

    Network.getStatus().then((status) => {
      if (!status.connected) setOffline("network");
    });
    // El plugin avisa también en cada cambio de capacidades de la red: solo
    // interesa si ya estamos sin conexión.
    const network = Network.addListener("networkStatusChange", (status) => {
      if (!status.connected) {
        setOffline("network");
      } else if (offlineRef.current && !editingServerRef.current) {
        void reconnect();
      }
    });

    const onNetworkError = () => void offlineReason().then(setOffline);
    window.addEventListener(NETWORK_ERROR_EVENT, onNetworkError);

    return () => {
      back.then((handle) => handle.remove());
      network.then((handle) => handle.remove());
      window.removeEventListener(NETWORK_ERROR_EVENT, onNetworkError);
    };
  }, [reconnect]);

  useEffect(() => {
    let active = true;
    initServer()
      .catch(() => {})
      .then(() => active && setServerReady(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (serverReady) SplashScreen.hide().catch(() => {});
  }, [serverReady]);

  // Mientras dura «Sin conexión», vuelve a probar la API cada pocos segundos:
  // la pantalla se quita sola cuando el servidor vuelve a responder. No lo hace con
  // el formulario «Cambiar servidor» abierto.
  useEffect(() => {
    if (!offline || editingServer) return;
    let active = true;
    let timer: number;
    const tick = async () => {
      await reconnect();
      if (active) timer = window.setTimeout(tick, RECONNECT_INTERVAL_MS);
    };
    timer = window.setTimeout(tick, RECONNECT_INTERVAL_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [offline, editingServer, reconnect]);

  if (!serverReady) {
    return null;
  }

  return (
    <>
      {children}
      {offline ? (
        <OfflineScreen
          reason={offline}
          onRetry={() => void retry()}
          retrying={retrying}
          editingServer={editingServer}
          onEditServer={() => setEditingServer(true)}
          onCancelEdit={() => setEditingServer(false)}
          onServerSwitched={() => {
            setEditingServer(false);
            setOffline(null);
          }}
        />
      ) : null}
    </>
  );
}
