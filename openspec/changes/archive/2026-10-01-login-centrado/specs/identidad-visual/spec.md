## ADDED Requirements

### Requirement: Pantallas de identificación centradas

El sistema SHALL mostrar las pantallas `/login` y `/registro` con la cabecera amarilla de marca y el logotipo en la parte superior, y la tarjeta del formulario debajo. La tarjeta SHALL NOT solapar la cabecera. La tarjeta SHALL quedar centrada en horizontal y en vertical dentro del espacio disponible bajo la cabecera. Cuando el contenido no quepa en la pantalla, la pantalla SHALL desplazarse sin que la tarjeta se superponga a la cabecera ni quede recortada. Origen: HU-00 (CA-00.1, CA-00.3).

#### Scenario: Tarjeta de login centrada en un móvil
- **WHEN** un visitante abre `/login` en un móvil de 390 × 844 px
- **THEN** el borde superior de la tarjeta queda por debajo del borde inferior de la cabecera amarilla
- **AND** la distancia entre la cabecera y la tarjeta difiere en menos de 16 px de la distancia entre la tarjeta y el borde inferior de la pantalla

#### Scenario: Registro con más campos
- **WHEN** un visitante abre `/registro` en un móvil de 390 × 844 px
- **THEN** la tarjeta no solapa la cabecera y queda centrada en el espacio restante con el mismo criterio que en `/login`

#### Scenario: Pantalla baja o teclado abierto
- **WHEN** la altura disponible es menor que la de la cabecera más la tarjeta (por ejemplo, 390 × 500 px)
- **THEN** la tarjeta empieza justo debajo de la cabecera, sin solaparla, y el usuario puede desplazarse hasta el botón de envío
