# Opina

Documentación técnica y planificación del proyecto **Opina**, preparada para desarrollarse mediante **Spec Driven Development (SDD)** con [OpenSpec](https://github.com/Fission-AI/OpenSpec).

## 1. Ficha del proyecto

| Campo                 | Valor                                                                                                                                                                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre**            | Opina                                                                                                                                                                                                                                                                                                             |
| **Descripción**       | Aplicación web y red social basada en un sistema de temas sobre los que los usuarios pueden votar (pulgar arriba / pulgar abajo) y justificar su voto de forma opcional. Funciona como un foro simplificado y dinámico. Los temas pueden ser públicos o privados (solo accesibles para los amigos de su creador). |
| **Tipo**              | Aplicación web _mobile-first_                                                                                                                                                                                                                                                                                     |
| **Repositorio / ZIP** | Pendiente de publicar. Ubicación local actual: `C:\Users\xurxo\Desktop\Opina` (sustituir por la URL del repositorio remoto o del ZIP cuando se publique).                                                                                                                                                         |
| **Metodología**       | Spec Driven Development con OpenSpec (`openspec/`)                                                                                                                                                                                                                                                                |

## 2. Índice de la documentación

| #   | Documento                                                        | Contenido                                                                     |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | [docs/01-producto.md](docs/01-producto.md)                       | Descripción general del producto: objetivo, características y funcionalidades |
| 2   | [docs/02-arquitectura.md](docs/02-arquitectura.md)               | Arquitectura del sistema, componentes y relaciones, contrato de API           |
| 3   | [docs/03-modelo-datos.md](docs/03-modelo-datos.md)               | Modelo de datos (entidades, relaciones, esquema Prisma, índices)              |
| 4   | [docs/04-historias-usuario.md](docs/04-historias-usuario.md)     | Historias de usuario con criterios de aceptación                              |
| 5   | [docs/05-tickets.md](docs/05-tickets.md)                         | Tickets de trabajo derivados de las historias                                 |
| 6   | [docs/06-stack.md](docs/06-stack.md)                             | Stack tecnológico elegido y justificación                                     |
| 7   | [docs/07-desglose-tareas-sdd.md](docs/07-desglose-tareas-sdd.md) | Desglose de tareas organizado para ejecución SDD                              |

## 3. Estructura SDD (OpenSpec)

```
openspec/
├── config.yaml                  # Contexto y reglas del proyecto para los artefactos
├── specs/                       # Specs consolidadas (se rellenan al archivar cada cambio)
└── changes/                     # Un cambio por incremento funcional, en orden de ejecución
    ├── fase-1-plataforma-base/
    ├── fase-2-listado-busqueda-temas/
    ├── fase-3-detalle-tema/
    ├── fase-4-votacion-opiniones/
    ├── fase-5-creacion-temas/
    └── fase-6-temas-privados-notificaciones/
```

Cada cambio contiene `proposal.md` (por qué), `design.md` (cómo), `specs/<capacidad>/spec.md` (qué, con escenarios verificables) y `tasks.md` (pasos de implementación).

### Cómo ejecutar el plan

```bash
openspec list
```

```bash
openspec validate --all
```

Después, en Claude Code, implementar los cambios **en orden** con `/opsx:apply fase-1-plataforma-base`, `/opsx:apply fase-2-listado-busqueda-temas`, etc., y archivar cada uno al terminar con `/opsx:archive <cambio>` para consolidar sus specs en `openspec/specs/`.

## 4. Desarrollo local

Requisitos: Node.js 22+, Docker Desktop.

```bash
cp .env.example .env
cp .env.example .env.test   # y cambiar DATABASE_URL al final en "opina_test"

docker compose up -d        # PostgreSQL (opina + opina_test) y MinIO

npm install
npm run prisma:migrate:deploy   # aplica la migración inicial
npm run prisma:seed             # usuarios y amistades de ejemplo (ver docs/03 §3.6)

npm run dev                     # http://localhost:3000
```

Otros comandos:

| Comando                         | Qué hace                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `npm run lint`                  | ESLint                                                                               |
| `npm run typecheck`             | `tsc --noEmit`                                                                       |
| `npm run format`                | Prettier (escribe)                                                                   |
| `npm test`                      | Vitest (unitarios + integración, usan `.env.test`)                                   |
| `npm run test:e2e`              | Playwright (construye y arranca la app automáticamente)                              |
| `npm run db:reset`              | Recrea la BD y vuelve a sembrar los datos                                            |
| `npm run prisma:seed:historias` | Historias de prueba para `pepito` (o `-- usuario`): 10 amigos, 5 con temas recientes |

Usuario de ejemplo (`prisma/seed.ts`): `ana@opina.test` / `password123` (también `bruno`, `carla`, `dani`, amigos de `ana` salvo `dani`).

Historias de prueba (`prisma/seed-historias.ts`): `lucia`, `marcos`, `sofia`, `hugo`, `elena`, `pablo`, `irene`, `diego`, `nora` y `alvaro` (`<nombre>@opina.test`, misma contraseña) son amigos de `pepito`; `hugo`, `lucia`, `sofia`, `marcos` y `elena` tienen de 1 a 3 temas de las últimas horas. Las historias caducan a las 24 horas y desaparecen al abrir los temas: vuelve a ejecutar el comando para regenerarlas.

## 5. App Android

La app Android lleva dentro la misma interfaz que la web (export estático de Next.js con Capacitor) y se conecta a la API de Opina. Requisitos: Android Studio (SDK y su JDK 21 en `C:\Program Files\Android\Android Studio\jbr`, o `JAVA_HOME` apuntando a un JDK 21).

**Desarrollo con el móvil conectado por cable** (depuración USB activada):

```bash
npm run build:mobile:dev
```

```bash
npm run android:apk
```

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

```bash
npm run dev:android
```

- `build:mobile:dev` apunta la app a `http://localhost:3000`, que `adb reverse` lleva al PC (el puerto 9000 sirve las imágenes de MinIO).
- `dev:android` arranca `next dev` en el puerto 3000 y hace `adb reverse` de los puertos 3000 y 9000 cada vez que el móvil se conecta. `adb reverse` vive en la conexión USB: se pierde al desconectar el cable, al volver a autorizar la depuración USB o al reiniciar adb, y sin él la app muestra «Sin conexión».
- Al autorizar la depuración USB en el móvil, marca «Permitir siempre desde este ordenador».
- Si el puerto 3000 está ocupado (un `next dev` anterior sigue vivo), `dev:android` falla en vez de usar el 3001, al que la app no llega.
- La app sale sola de «Sin conexión» en cuanto la API vuelve a responder (p. ej. al reiniciar el servidor).
- El build móvil compila en `.next` aunque exporte a `out-mobile`: lánzalo con el servidor **parado** y vuelve a arrancarlo después.

**Producción:** con la API desplegada en HTTPS:

```bash
NEXT_PUBLIC_API_URL=https://tu-dominio npm run build:mobile
```

```bash
npm run android:release
```

`android:release` genera un APK sin firmar en `android/app/build/outputs/apk/release/`; para instalarlo o publicarlo hay que firmarlo con tu keystore.

| Comando                    | Qué hace                                                         |
| -------------------------- | ---------------------------------------------------------------- |
| `npm run dev:android`      | `next dev` en el 3000 + `adb reverse` en cada conexión del móvil |
| `npm run build:mobile:dev` | Export de la interfaz contra `localhost:3000` + `cap sync`       |
| `npm run build:mobile`     | Export contra `NEXT_PUBLIC_API_URL` (obligatoria) + `cap sync`   |
| `npm run android:apk`      | APK de depuración                                                |
| `npm run android:release`  | APK de release sin firmar                                        |
| `npm run android:assets`   | Regenera icono y pantalla de arranque desde el logotipo          |

### App Android en la red local (sin cable)

El APK de desarrollo puede usar el servidor de tu PC por la red local, sin `adb reverse` y sin recompilar cuando cambia la IP.

1. Averigua la IP del PC (`ipconfig`, línea «Dirección IPv4») y, mejor, **resérvala en el DHCP del router** para que no cambie.
2. Arranca el servidor con `npm run dev` (escucha en todas las interfaces). La regla del cortafuegos de Windows para Node.js debe permitir la entrada en la red **Privada**; el puerto 9000 (MinIO) ya no hace falta para el móvil, porque las imágenes se sirven por la API.
3. En la app, en la pantalla de inicio de sesión, pulsa **Cambiar servidor**, escribe `http://<IP-del-PC>:3000` y guarda. La app comprueba que responde antes de guardarla; después se conserva al reabrirla. También está en el menú principal (cambiar de servidor cierra la sesión).
4. Móvil y PC deben estar en la misma red. Con una **VPN** en el PC, activa el acceso a la red local (en NordVPN, desactiva «Invisibilidad en LAN» o usa tunelización dividida).

Si el servidor guardado (o `localhost:3000` sin `adb reverse`) no responde, la app muestra «Sin conexión». En el APK de desarrollo, esa pantalla enseña el servidor en uso y un botón **Cambiar servidor** para escribir otro sin salir de ella (cambiar de servidor cierra la sesión).

Solo el APK de **desarrollo** (`npm run build:mobile:dev`) tiene esta opción y admite HTTP sin cifrar; el de producción usa siempre la dirección fijada al compilar y exige HTTPS.
