## MODIFIED Requirements

### Requirement: Interfaz empaquetada en la app Android

El sistema SHALL ofrecer una app Android (APK) que contenga todas las pantallas de Opina como archivos locales, sin cargar la interfaz desde un servidor remoto. La app SHALL obtener los datos de la API de Opina de una URL:

- en el build de producción, la URL fijada al compilar. Si al compilar no se indica ninguna, SHALL ser `https://ai4devs-finalproject-jrg.vercel.app`, el servidor publicado en Vercel;
- en el build de desarrollo, la del servidor que el usuario haya configurado en la app o, si no ha configurado ninguno, la fijada al compilar (`http://localhost:3000`, por `adb reverse`, si no se indica otra).

La web SHALL seguir usando el mismo origen que la sirve. Las pantallas, las funciones y las reglas de negocio SHALL ser las mismas que en la web. Origen: HU-16 (CA-16.1), HU-22 (CA-22.1).

#### Scenario: Arranque sin el ordenador de desarrollo
- **WHEN** el usuario abre la app instalada en un móvil sin cable, con Internet y con la API desplegada en la URL configurada
- **THEN** la app muestra la pantalla de inicio de sesión o la pantalla principal, según tenga o no la sesión iniciada

#### Scenario: Misma funcionalidad que la web
- **WHEN** el usuario vota un tema desde la app
- **THEN** el voto queda registrado igual que desde la web y los resultados se muestran con los mismos bloques

#### Scenario: Build de desarrollo sin cable, en la misma red
- **WHEN** el APK de desarrollo tiene configurado el servidor `http://192.168.5.101:3000`, el móvil está en la misma red que el PC y no está conectado por USB
- **THEN** la app inicia sesión, lista los temas y permite votar contra ese servidor

#### Scenario: APK de producción sin indicar servidor
- **WHEN** se compila el APK de producción con `npm run build:mobile` sin definir `NEXT_PUBLIC_API_URL`
- **THEN** la compilación termina sin error y la app inicia sesión y lista los temas contra `https://ai4devs-finalproject-jrg.vercel.app`

#### Scenario: APK de producción con otro servidor
- **WHEN** se compila el APK de producción con `NEXT_PUBLIC_API_URL=https://opina.example.com`
- **THEN** la app usa `https://opina.example.com` y no el servidor de Vercel

#### Scenario: La web no cambia de origen
- **WHEN** el usuario usa Opina desde el navegador, sin la app
- **THEN** las peticiones a la API van al mismo origen que sirve la página
