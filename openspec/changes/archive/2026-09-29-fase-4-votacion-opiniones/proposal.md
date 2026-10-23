## Why

Votar es la acción central de Opina. Al pulsar un botón de voto se pide una justificación opcional, se emite el voto y los botones se transforman en los totales de votos positivos y negativos y en la lista de opiniones, coloreadas en verde o rojo según el voto de cada autor (§5.3 de la definición del producto).

## What Changes

- Emisión transaccional del voto con justificación opcional y un único voto por usuario y tema (TKT-019).
- Listado paginado de opiniones de un tema (TKT-020).
- Diálogo de justificación y flujo de voto en la pantalla del tema (TKT-021).
- Vista de resultados (totales + lista de opiniones verde/roja) que sustituye a los botones (TKT-022).
- Pruebas (TKT-023).

## Capabilities

### New Capabilities

- `votacion`: proceso de voto con justificación opcional, voto único, resultados y lista de opiniones (HU-04, HU-05, HU-06, HU-07).

### Modified Capabilities

<!-- Ninguna: `detalle-tema` ya define que se muestran resultados si el usuario votó; este cambio implementa su contenido. -->

## Impact

- Añade `VoteService`, `POST /api/topics/:id/votes`, `GET /api/topics/:id/opinions`.
- Añade los componentes `JustificationDialog`, `VoteResults`, `OpinionList`, `OpinionItem` y conecta `VoteButtons`.
- Escribe en `votes` y actualiza los contadores de `topics`, afectando al orden de tendencias (fase 2).
