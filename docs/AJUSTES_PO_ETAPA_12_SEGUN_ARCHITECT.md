# Ajustes para el PO — Etapa 12 Sistema de diseño (según SYSTEM ARCHITECT)

**Destinatario:** PO MASTER  
**Origen:** Validación arquitectónica SYSTEM ARCHITECT  
**Documentos de referencia:**  
- `docs/VALIDACION_ARQUITECTONICA_ETAPA_12_SISTEMA_DISENO.md`  
- `docs/PLAN_ETAPA_12_SISTEMA_DISENO.md`  
- `docs/PROMPT_MASTER_DEVELOPER_ETAPA_12_SISTEMA_DISENO.md`

**Estado de la etapa:** APROBADA. Un ajuste de nomenclatura garantiza alineación con el backend.

---

## 1. Resumen del análisis del arquitecto

- La etapa es solo frontend: design system en CSS (variables y clases) sin tocar backend ni API.
- Integración con Bootstrap y criterios de regresión están bien definidos.
- **Única corrección:** El plan indica para Incident el estado "INVESTIGATING"; en el backend el estado es **IN_PROGRESS**. Las clases de badges deben usar los mismos nombres que la API para que las vistas puedan mapear `data.status` directamente.

---

## 2. Ajuste al PLAN (PLAN_ETAPA_12_SISTEMA_DISENO.md)

| Dónde | Ajuste |
|-------|--------|
| **Sección 3.7 (Badges y pills) — Incident** | Sustituir "INVESTIGATING" por **IN_PROGRESS**. Dejar: "Incident: OPEN, IN_PROGRESS, RESOLVED, CLOSED; severidad: CRITICAL, HIGH, MEDIUM, LOW." |

Así los nombres de estados del design system coinciden con los valores que devuelve la API (`incident.workflow.constants.js`, `incident.model.js`).

---

## 3. Ajuste al PROMPT (opcional)

En la **FASE 3**, punto 8 (Badges), las clases para incidentes deben incluir **IN_PROGRESS** (no INVESTIGATING). El prompt ya menciona `.nexus-badge-in-progress`; conviene dejar explícito que para **Incident** los estados son OPEN, IN_PROGRESS, RESOLVED, CLOSED (mismos que en la API).

Ejemplo de aclaración que el PO puede añadir en el prompt (o como sección 9):

**Badges de Incident:** Usar exactamente los estados del backend: OPEN, IN_PROGRESS, RESOLVED, CLOSED (no INVESTIGATING). Las clases (ej. `.nexus-badge-open`, `.nexus-badge-in-progress`, etc.) deben poder mapearse 1:1 con el valor de `status` que devuelve la API.

---

## 4. Checklist para el PO

- [x] Corregir en el **plan** sección 3.7: INVESTIGATING → IN_PROGRESS para Incident. — **incorporado**.
- [x] Opcional: añadir en el **prompt** la aclaración de estados de Incident (apartado 3). — **incorporado** (FASE 3 punto 8 y sección 9).
- [ ] Enviar el prompt al MASTER DEVELOPER cuando corresponda.

---

## 5. Referencia a la validación completa

Para el detalle de la validación: **`docs/VALIDACION_ARQUITECTONICA_ETAPA_12_SISTEMA_DISENO.md`**
