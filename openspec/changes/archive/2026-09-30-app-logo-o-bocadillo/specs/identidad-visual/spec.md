## ADDED Requirements

### Requirement: Logotipo de Opina

El sistema SHALL identificar la aplicación con un logotipo formado por un símbolo (la letra "O" dibujada como un anillo con cola de bocadillo de diálogo en su parte inferior izquierda) y, en su forma completa, el símbolo seguido del texto "pina" en la tipografía de la marca, leído como "Opina". El logotipo completo SHALL mostrarse en la cabecera de las pantallas con sesión y en la cabecera de las pantallas de inicio de sesión y registro, en lugar del nombre en texto, con el color de texto previsto para el fondo amarillo de marca en modo claro y oscuro. El logotipo SHALL ser un gráfico vectorial y SHALL exponer "Opina" como nombre accesible, sin que el símbolo ni las letras se anuncien por separado. El símbolo SHALL usarse como favicon (símbolo amarillo de marca sobre cuadrado verde de marca redondeado) y como icono de pantalla de inicio de 180 × 180 px. Origen: transversal a HU-00–HU-12 (identidad de la aplicación).

#### Scenario: Logotipo en la cabecera
- **WHEN** un usuario con sesión abre la pantalla principal
- **THEN** la cabecera amarilla muestra el símbolo de la "O" bocadillo seguido de "pina", y pulsarlo lleva a la pantalla principal

#### Scenario: Nombre accesible del logotipo
- **WHEN** un lector de pantalla recorre la cabecera
- **THEN** el enlace del logotipo se anuncia como "Opina"

#### Scenario: Logotipo en las pantallas de identificación
- **WHEN** un visitante abre `/login` o `/registro`
- **THEN** la cabecera amarilla muestra el logotipo completo en lugar del texto "Opina" y la página mantiene un encabezado principal con el nombre "Opina"

#### Scenario: Favicon de la aplicación
- **WHEN** el navegador carga cualquier pantalla de Opina
- **THEN** la pestaña muestra el símbolo de la "O" bocadillo en amarillo sobre fondo verde, y no el icono por defecto de Next.js

#### Scenario: Icono de pantalla de inicio
- **WHEN** un dispositivo iOS solicita el icono de la aplicación
- **THEN** el sistema sirve una imagen PNG de 180 × 180 px con el símbolo sobre fondo verde de marca
