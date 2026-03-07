# DIA 2 — Evidencia QA

Generado por `scripts/qa-dia2.js`

## Tabla de resultados

| Caso | Status esperado | Status real | Envelope válido | Resultado |
|------|-----------------|------------|-----------------|-----------|
| GET /api/v1/health | 200 | 200 | Sí | PASS |
| POST /auth/login inválido (401) | 401 | 401 | Sí | PASS |
| GET ruta inexistente (404) | 404 | 404 | Sí | PASS |
| Sin token (401) | 401 | 401 | Sí | PASS |
| Unicidad request_id | different_ids | ok | Sí | PASS |

## Cumplimiento

5/5 (100%)
