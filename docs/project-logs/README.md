# Sistema de trazabilidad — project-logs

**Rol responsable:** Product Owner (PO) — Gobernanza y trazabilidad del repositorio.

Este directorio contiene el **registro de cambios** en checklists y tareas, y los **reportes diarios de desarrollo**, para mantener trazabilidad del progreso y del trabajo de cada miembro del equipo.

---

## Backlog basado en auditorías

Desde la introducción del flujo de **auditorías funcionales** por el PO, el **backlog de desarrollo inmediato** se origina a partir de los **tickets recomendados** en el documento de auditoría (p. ej. `docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-03.md` o `docs/audits/AUDITORIA_FUNCIONAL_FRONTEND_YYYY-MM.md`). Los tickets se implementan según el plan de ejecución (p. ej. `docs/plans/PLAN_IMPLEMENTACION_AUDITORIA_FRONTEND_2026-03.md`) y **sin modificar la arquitectura existente**. Véase `docs/process/WORKFLOW_DESARROLLO_AUDITORIA.md`.

---

## Archivos en este directorio

| Archivo | Descripción |
|---------|-------------|
| `checklist-change-log.md` | Log de todos los cambios en archivos de checklist/tareas. Cada modificación debe añadir una entrada al final. |
| `TICKETS_IMPLEMENTADOS.md` | Registro de trazabilidad de tickets derivados de la auditoría: Ticket ID, archivos modificados, endpoints utilizados, cambios funcionales. Se actualiza tras cada implementación (véase docs/process/PROTOCOLO_IMPLEMENTACION_TICKETS.md). |
| `daily-dev-report-YYYY-MM-DD.md` | Reporte diario de desarrollo (uno por día y por desarrollador o equipo). Generar antes del commit/push al final de la jornada. |
| `README.md` | Este archivo: instrucciones y convenciones. |

---

## Archivos considerados "de seguimiento"

Se deben registrar cambios en **checklist-change-log.md** cuando se modifique alguno de estos:

- Cualquier archivo en **`docs/checklists/`**
- Cualquier archivo en **`docs/tasks/`**
- Cualquier archivo en **`docs/`** cuyo nombre o contenido incluya:
  - **checklist** (ej. `CHECKLIST_ETAPAS_PROYECTO.md`)
  - **task** / **tasks**
  - **roadmap**
  - **backlog**

**Ejemplos en este proyecto:**  
`docs/CHECKLIST_ETAPAS_PROYECTO.md`, y en general planes/evidencias que reflejen estado de tareas o etapas.

---

## Procedimiento para el desarrollador

1. **Al modificar un checklist o archivo de tareas:**  
   Añadir una entrada al final de `checklist-change-log.md` con el formato indicado en ese archivo (fecha, hora, autor, rama, archivo modificado, tipo de cambio, resumen).

2. **Antes del commit/push al final del día:**  
   Crear o actualizar el reporte diario `daily-dev-report-YYYY-MM-DD.md` con: tareas completadas, tareas modificadas, archivos modificados, resumen del progreso y notas.

3. **Formato de commit recomendado** para cambios en checklists/tareas:  
   `[CHECKLIST] Autor: <nombre> | Archivo: <archivo> | Acción: <resumen>`  
   Ejemplo:  
   `[CHECKLIST] Autor: Javier | Archivo: docs/CHECKLIST_ETAPAS_PROYECTO.md | Acción: Completadas tareas de Etapa 14`

---

## Responsabilidad del PO

- Asegurar que las modificaciones de checklists tengan trazabilidad en `checklist-change-log.md`.
- Mantener actualizados los logs y la estructura de documentación.
- Verificar que existan reportes diarios antes de considerar cerrada la jornada.
- No eliminar documentación existente; solo ampliar con el sistema de trazabilidad.
