## Context

Tras la fase 2 el usuario puede navegar a `/temas/[id]`, pero la ruta no existe. La tabla `votes` existe pero aún no se escribe (fase 4); aun así, la pantalla debe decidir entre botones y resultados según `myVote`.

## Goals / Non-Goals

**Goals:**

- Pantalla de tema fiel a la descripción: imagen (si la hay) en la mitad superior, título, dos botones abajo.
- Un único punto de decisión de acceso (`VisibilityPolicy`) reutilizable por voto, opiniones y notificaciones.

**Non-Goals:**

- Emitir el voto y mostrar opiniones (fase 4).
- Acceso de amigos a temas privados (fase 6).

## Decisions

- **`VisibilityPolicy.canAccess(topic, viewerId)`** como función pura con dependencia inyectada `areFriends`; en esta fase `areFriends` devuelve siempre `false`, de modo que la fase 6 solo sustituye la dependencia.
- **Tema inaccesible = `404`**, igual que un tema inexistente, para no revelar la existencia de temas privados.
- **`TopicDetail` incluye `myVote` y, solo si ha votado, `results`**: la UI no necesita una segunda petición para decidir qué mostrar y no se filtran totales a quien no ha votado.
- **Imagen a `50dvh`** (`h-[50dvh] w-full object-cover`) usando `dvh` para que la barra del navegador móvil no descuadre la "mitad superior"; `next/image` con `sizes="100vw"` y `priority`.
- **Botones fijos en la parte inferior** (`sticky bottom-0`), en dos columnas iguales: verde (`bg-green-600`) con 👍 y rojo (`bg-red-600`) con 👎, `aria-label` "Votar a favor" / "Votar en contra".
- **Sin imagen**: el título ocupa la parte superior y no se reserva hueco.

## Risks / Trade-offs

- [Imágenes de proporciones muy distintas] → `object-cover` recorta para mantener exactamente la mitad superior; se acepta el recorte.
- [Dominio de imágenes externo a Next] → Configurar `images.remotePatterns` con `S3_PUBLIC_URL`.
