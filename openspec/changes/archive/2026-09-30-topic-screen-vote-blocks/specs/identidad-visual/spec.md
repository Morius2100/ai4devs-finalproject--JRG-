## ADDED Requirements

### Requirement: Bloques de voto en la pantalla de un tema

El sistema SHALL presentar los dos botones de voto de un tema no votado como dos bloques grandes, uno junto al otro, fijos en la parte inferior de la pantalla: a la izquierda el bloque verde de pulgar arriba con el texto "A favor" y a la derecha el bloque rojo de pulgar abajo con el texto "En contra". Cada bloque SHALL medir al menos 96 px de alto, mostrar un icono de pulgar y su texto, conservar su etiqueta accesible ("Votar a favor" / "Votar en contra") y dejar libre el área segura inferior del dispositivo. Origen: HU-03 (CA-03.4), HU-04 (CA-04.1).

#### Scenario: Tema aún no votado
- **WHEN** el usuario abre un tema que no ha votado en un móvil de 390 × 844 px
- **THEN** en la parte inferior aparecen dos bloques de al menos 96 px de alto: el verde con pulgar arriba y el texto "A favor" y el rojo con pulgar abajo y el texto "En contra"

#### Scenario: Pulsar un bloque inicia el voto
- **WHEN** el usuario pulsa el bloque "En contra"
- **THEN** se abre el diálogo de justificación del voto negativo, igual que con el botón anterior

### Requirement: Bloques de resultados tras votar

El sistema SHALL sustituir, tras votar, los bloques de voto por dos bloques de resultados situados bajo el título del tema: el de la izquierda para los votos a favor (verde) y el de la derecha para los votos en contra (rojo). Cada bloque SHALL mostrar el porcentaje redondeado a entero y el número total de votos de su lado. El bloque correspondiente al voto del usuario SHALL mostrarse relleno con su color y la etiqueta "Tu voto"; el otro SHALL mostrarse en un tono claro del mismo color. Los porcentajes de ambos bloques SHALL sumar 100. Origen: HU-06 (CA-06.1–CA-06.3), HU-03 (CA-03.5).

#### Scenario: Resultados con voto positivo propio
- **WHEN** un tema tiene 5 votos positivos y 2 negativos y el voto del usuario es positivo
- **THEN** el bloque verde aparece relleno con "71 %", "5 votos" y "Tu voto", y el bloque rojo aparece en tono claro con "29 %" y "2 votos"

#### Scenario: Un único voto
- **WHEN** el usuario emite el primer voto de un tema y es negativo
- **THEN** el bloque rojo muestra "100 %", "1 voto" y "Tu voto", y el bloque verde muestra "0 %" y "0 votos"

#### Scenario: Opiniones bajo los resultados
- **WHEN** el usuario ha votado un tema con opiniones
- **THEN** la lista de opiniones aparece debajo de los bloques de resultados y se desplaza con el contenido de la pantalla
