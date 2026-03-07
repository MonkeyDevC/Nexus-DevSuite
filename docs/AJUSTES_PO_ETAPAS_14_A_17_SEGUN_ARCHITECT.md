# Ajustes para el PO — Etapas 14 a 17 Fase UX/UI completa (según SYSTEM ARCHITECT)

**Destinatario:** PO MASTER  
**Origen:** Validación arquitectónica SYSTEM ARCHITECT  
**Documentos de referencia:**  
- `docs/VALIDACION_ARQUITECTONICA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md`  
- `docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md`  
- `docs/PROMPT_MASTER_DEVELOPER_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md`

**Estado:** APROBADAS con observaciones. Incorporar los ajustes siguientes antes de enviar el prompt al MASTER DEVELOPER.

---

## 1. Resumen del análisis del arquitecto

- El plan unificado (14→15→16→17) es solo frontend; no modifica API ni backend. Una sola validación y un solo ciclo de implementación son coherentes.
- **Observación crítica:** Filtros y badges deben usar los **valores de estado que devuelve la API**, no etiquetas de UX distintas (ej. Sprint: IN_PROGRESS, no "ACTIVE"; Feature: DRAFT, APPROVED, IN_PROGRESS, DONE, ARCHIVED).
- **Observación de alcance:** El módulo Improvements (#/improvements) no está en el plan; dejar explícito si queda fuera de este ciclo.

---

## 2. Ajustes al PLAN (opcional)

| Dónde | Ajuste sugerido |
|-------|------------------|
| **Sección 3 (Etapa 14)** | Añadir una línea: "Filtros 'Filter by status' y badges deben usar los valores de estado que devuelve la API (Sprint: PLANNED, IN_PROGRESS, CLOSED; Feature: DRAFT, APPROVED, IN_PROGRESS, DONE, ARCHIVED; Story: DRAFT, READY, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE, ARCHIVED). La etiqueta visible puede ser distinta (ej. 'Active' para IN_PROGRESS) pero el valor enviado y la clase de badge deben coincidir con la API." |
| **Sección 3 (Etapa 14)** | Aclarar alcance de Improvements: "El módulo Improvements (#/improvements) queda fuera del alcance de Etapas 14–17; se abordará en ciclo posterior." O, si se incluye, añadir la pantalla a la lista. |

---

## 3. Ajustes al PROMPT — Sección 9 (incorporar tras validación)

Añadir al prompt una **sección 9** con el siguiente contenido (o equivalente):

---

### 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporar en implementación)

1. **Valores de estado (filtros y badges):** Usar **exactamente** los valores que devuelve la API en filtros "Filter by status" y en clases de badge. No usar etiquetas que no existan en la API:
   - **Sprint:** PLANNED, **IN_PROGRESS**, CLOSED (no "ACTIVE"; si se muestra "Active" como texto, el valor enviado a la API debe ser IN_PROGRESS).
   - **Feature:** DRAFT, APPROVED, IN_PROGRESS, DONE, ARCHIVED (no "PLANNED" como valor de filtro; usar DRAFT y/o APPROVED según criterio de negocio).
   - **Story:** DRAFT, READY, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE, ARCHIVED (no "TODO"; usar DRAFT y/o READY si se desea un grupo "por hacer").
   Las clases del design system (`.nexus-badge-in-progress`, etc.) deben mapear 1:1 con estos valores.

2. **Módulo Improvements:** La pantalla #/improvements no está en el alcance de este ciclo (Etapas 14–17). No implementar vista de Improvements en este prompt; si ya existe una vista básica, mantenerla sin rediseño hasta ciclo posterior o documentar en evidencia.

3. **Rutas y endpoints:** Consumir solo endpoints documentados en CONTRATO_API.md. Para reportes: GET /reports/projects/:projectId/summary, GET /reports/sprints/:sprintId/summary, GET /reports/users/:userId/activity, GET /reports/audit (MASTER). No inventar rutas ni query params no documentados.

---

## 4. Checklist para el PO

Antes de enviar el prompt al MASTER DEVELOPER:

- [ ] Haber incorporado en el **plan** (opcional) la aclaración sobre valores de estado y alcance de Improvements (sección 2).
- [ ] Haber añadido al **prompt** la **sección 9** con las observaciones del arquitecto (sección 3).
- [ ] Confirmar que el orden de ejecución 14 → 15 → 16 → 17 y la evidencia única siguen siendo los acordados.

---

## 5. Referencia a la validación completa

Para el detalle de la validación: **`docs/VALIDACION_ARQUITECTONICA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md`**
