"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/platform/native";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!isNativeApp() && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
