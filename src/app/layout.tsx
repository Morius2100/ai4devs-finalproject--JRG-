import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { NativeShell } from "@/components/native/NativeShell";
import { QueryProvider } from "@/components/QueryProvider";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Opina",
  description: "Vota temas con pulgar arriba o pulgar abajo y justifica tu voto de forma opcional.",
  appleWebApp: { capable: true, title: "Opina", statusBarStyle: "black-translucent" },
};

// Mobile-first (docs/02-arquitectura.md): ancho del dispositivo, sin zoom accidental.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#035949",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface font-sans text-ink">
        <RegisterServiceWorker />
        <SessionProvider>
          <QueryProvider>
            <NativeShell>{children}</NativeShell>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
