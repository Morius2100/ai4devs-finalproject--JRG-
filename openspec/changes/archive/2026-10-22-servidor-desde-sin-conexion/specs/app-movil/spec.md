## MODIFIED Requirements

### Requirement: Pantalla sin conexión

La app SHALL mostrar una pantalla «Sin conexión» con un botón «Reintentar» cuando el dispositivo no tenga conexión o la API no responda. Al recuperarse la conexión o al pulsar «Reintentar» con conexión, la app SHALL volver a cargar la pantalla en la que estaba. Origen: HU-16 (CA-16.5).

En el build de desarrollo, la pantalla «Sin conexión» SHALL mostrar además el servidor en uso y la opción «Cambiar servidor». Esa opción abre, en la misma pantalla y con o sin sesión iniciada, el formulario de dirección del requisito «Servidor configurable en el build de desarrollo», con las mismas reglas: validación de la dirección, comprobación de `GET <dirección>/api/health` antes de guardar, error «No se puede conectar con ese servidor», «Restablecer» y «Volver». Al guardar un servidor distinto que responde, la app SHALL quitar «Sin conexión» y aplicar el requisito «Cambio de servidor con sesión iniciada»: cerrar la sesión si la había, borrar los datos en caché y mostrar la pantalla de inicio de sesión del nuevo servidor. Mientras el formulario esté abierto, la app SHALL NOT volver a probar la API por su cuenta. El build de producción SHALL NOT mostrar el servidor ni «Cambiar servidor» en esta pantalla. Origen: HU-16 (CA-16.5), HU-22 (CA-22.5).

#### Scenario: Abrir la app en modo avión
- **WHEN** el usuario abre la app con el modo avión activado
- **THEN** la app muestra «Sin conexión» y el botón «Reintentar»

#### Scenario: Recuperar la conexión
- **WHEN** la app muestra «Sin conexión» y el usuario desactiva el modo avión
- **THEN** la app vuelve a cargar la pantalla en la que estaba

#### Scenario: Cambiar de servidor desde «Sin conexión» con sesión iniciada
- **WHEN** el APK de desarrollo, con sesión iniciada, muestra «Sin conexión» porque `http://localhost:3000` no responde, y el usuario pulsa «Cambiar servidor», escribe `http://192.168.5.101:3000` con el servidor en marcha y lo guarda
- **THEN** la app comprueba `/api/health`, guarda la dirección, quita «Sin conexión», cierra la sesión y muestra la pantalla de inicio de sesión con `192.168.5.101:3000` como servidor en uso

#### Scenario: Cambiar de servidor desde «Sin conexión» sin sesión
- **WHEN** el APK de desarrollo sin sesión muestra «Sin conexión» y el usuario guarda desde «Cambiar servidor» una dirección distinta que responde
- **THEN** la app quita «Sin conexión» y muestra la pantalla de inicio de sesión del nuevo servidor

#### Scenario: El servidor nuevo tampoco responde
- **WHEN** en «Sin conexión» el usuario escribe en «Cambiar servidor» `http://192.168.5.250:3000`, donde no hay ningún servidor, y lo guarda
- **THEN** la app muestra «No se puede conectar con ese servidor», sigue en «Sin conexión» con el formulario abierto y mantiene el servidor anterior

#### Scenario: Sin reintentos mientras se escribe
- **WHEN** en «Sin conexión» el usuario tiene abierto el formulario de «Cambiar servidor» y el servidor anterior vuelve a responder
- **THEN** la app no cierra el formulario ni la pantalla por su cuenta, y al pulsar «Volver» reanuda los reintentos automáticos

#### Scenario: Build de producción sin conexión
- **WHEN** el APK de producción muestra «Sin conexión»
- **THEN** la pantalla solo ofrece «Reintentar», sin servidor en uso ni «Cambiar servidor»
