# Auditorías — NEXUS DevSuite

Este directorio contiene los **documentos de auditoría** generados por el PO (Product Owner) como base del backlog de desarrollo.

---

## Contenido típico de una auditoría

- **Diagnóstico** del estado actual (p. ej. madurez del frontend, cobertura de endpoints).
- **Brechas funcionales** detectadas.
- **Tickets recomendados** priorizados (P1, P2, P3).

Los tickets derivados de la auditoría son los que el equipo de desarrollo implementa en la siguiente iteración.

---

## Ubicación del documento de auditoría

El documento de auditoría de la iteración actual puede estar en:

- **`docs/audits/AUDITORIA_FUNCIONAL_FRONTEND_YYYY-MM.md`** (este directorio), o
- **`docs/AUDITORIA_FUNCIONAL_FRONTEND_YYYY-MM.md`** (raíz de `docs/`),

según cómo el PO organice la documentación. La referencia principal para desarrollo es el contenido del documento, no su ruta exacta.

---

## Flujo de trabajo

Véase **`docs/process/WORKFLOW_DESARROLLO_AUDITORIA.md`** para el flujo completo: PO → Auditoría → Tickets → Implementación → QA.
