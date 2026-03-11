# Workflow de desarrollo basado en auditorías — NEXUS DevSuite

**Objetivo:** Definir el flujo operativo del proyecto cuando el backlog de desarrollo se origina a partir de **auditorías funcionales** realizadas por el PO.

---

## 1. Origen del backlog

El **backlog de desarrollo inmediato** no se define únicamente por etapas genéricas: pasa a estar **derivado de auditorías funcionales** que el PO realiza de forma periódica sobre el producto (p. ej. frontend, API, integración).

- El PO genera un documento de auditoría (p. ej. `docs/audits/AUDITORIA_FUNCIONAL_FRONTEND_YYYY-MM.md` o `docs/AUDITORIA_FUNCIONAL_FRONTEND_YYYY-MM.md`).
- Ese documento contiene: **diagnóstico**, **brechas funcionales** y **tickets recomendados**.
- Los **tickets derivados de la auditoría** son la referencia para lo que desarrollo debe implementar a continuación.

---

## 2. Flujo en cinco pasos

```
PO → Auditoría → Tickets → Implementación → QA
```

| Paso | Responsable | Entregable |
|------|-------------|------------|
| **1. Auditoría** | PO | Documento de auditoría (diagnóstico, brechas, tickets). |
| **2. Tickets** | PO (con validación de SYSTEM ARCHITECT si hay impacto arquitectónico) | Tickets priorizados (P1, P2, P3) listos para desarrollo. |
| **3. Plan de ejecución** | MASTER DEVELOPER | Plan de implementación: agrupación por módulo, orden lógico, dependencias (p. ej. `docs/plans/PLAN_IMPLEMENTACION_AUDITORIA_FRONTEND_YYYY-MM.md`). |
| **4. Implementación** | MASTER DEVELOPER / equipo | Código y cambios en frontend/backend **sin modificar arquitectura existente**. Cada ticket se implementa según criterios de aceptación del documento de auditoría. |
| **5. QA** | QA ENGINEER | Validación funcional de cada ticket; actualización de checklists y documentación. |

Tras la implementación de cada ticket (o lote), se actualiza:

- `docs/ENDPOINTS_API_Y_USO_FRONTEND.md` (uso real de endpoints).
- `docs/project-logs/checklist-change-log.md` cuando se modifiquen checklists o tareas.

---

## 3. Referencia principal para la UI

El documento **AUDITORIA_FUNCIONAL_FRONTEND** (generado por el PO en cada iteración de auditoría) actúa como **referencia principal** para:

- Nuevas implementaciones de UI.
- Qué endpoints deben estar conectados y con qué flujo.
- Qué tickets hay que implementar y en qué orden sugerido.

Los tickets derivados de la auditoría deben implementarse **sin modificar la arquitectura existente**: se conectan endpoints, se completan flujos y se añaden vistas o controles dentro del patrón actual (vistas en `public/js/views/`, API en `public/js/api.js`, rutas hash, etc.).

---

## 4. Documentos relacionados

| Documento | Uso |
|-----------|-----|
| `docs/audits/AUDITORIA_FUNCIONAL_FRONTEND_YYYY-MM.md` (o `docs/AUDITORIA_FUNCIONAL_FRONTEND_YYYY-MM.md`) | Fuente de verdad de la auditoría del PO y tickets. |
| `docs/plans/PLAN_IMPLEMENTACION_AUDITORIA_FRONTEND_YYYY-MM.md` | Plan de ejecución: orden, dependencias, riesgos. |
| `docs/ENDPOINTS_API_Y_USO_FRONTEND.md` | Contrato API ↔ frontend; se actualiza tras cada implementación que toque endpoints. |
| `docs/project-logs/` | Trazabilidad de cambios en checklists y reportes diarios. |

---

*Este workflow aplica desde la iteración en que el PO introduce auditorías funcionales como base del backlog. Las etapas previas (por número) siguen referenciadas en docs/CHECKLIST_ETAPAS_PROYECTO.md y docs/plans/.*
