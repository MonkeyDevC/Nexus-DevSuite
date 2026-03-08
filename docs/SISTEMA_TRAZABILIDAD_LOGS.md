# Sistema de trazabilidad — Logs y reportes (PO)

**Rol:** Product Owner (PO) — Gobernanza y trazabilidad del repositorio.  
**Objetivo:** Garantizar que toda modificación relevante en checklists y tareas quede documentada antes de que se suba al repositorio. Los desarrolladores realizan commit y push manualmente al final de la jornada.

---

## 1. Estructura creada

| Ruta | Contenido |
|------|------------|
| `docs/project-logs/` | Log de cambios y reportes diarios. |
| `docs/project-logs/checklist-change-log.md` | Registro de cada modificación en archivos de checklist/tareas. |
| `docs/project-logs/daily-dev-report-TEMPLATE.md` | Plantilla para el reporte diario. |
| `docs/project-logs/README.md` | Instrucciones para desarrolladores y PO. |
| `docs/checklists/` | Carpeta para checklists por área (opcional). |
| `docs/tasks/` | Carpeta para listados de tareas por sprint/módulo (opcional). |

---

## 2. Archivos considerados "de seguimiento"

Se debe registrar un cambio en **checklist-change-log.md** cuando se modifique:

- Cualquier archivo en **`docs/checklists/`**
- Cualquier archivo en **`docs/tasks/`**
- Cualquier archivo en `docs/` que contenga o se relacione con:
  - **checklist**
  - **task** / **tasks**
  - **roadmap**
  - **backlog**

**En este proyecto,** el documento principal de seguimiento es **`docs/CHECKLIST_ETAPAS_PROYECTO.md`**. También se consideran los planes de etapa y documentos de evidencia/QA que reflejen estado de tareas.

---

## 3. Formato del registro de cambio

Cada modificación en un checklist/tarea debe añadir **una entrada al final** de `docs/project-logs/checklist-change-log.md` con este formato:

```markdown
---
## Registro de Cambio

**Fecha:** YYYY-MM-DD
**Hora:** HH:MM
**Autor:** <git user.name o nombre>
**Rama:** <nombre de la rama>
**Archivo modificado:** <ruta del archivo>

**Tipo de cambio:**
- [ ] Nueva tarea agregada
- [ ] Tarea modificada
- [ ] Tarea completada
- [ ] Checklist reorganizado
- [ ] Actualización de documentación

**Resumen del cambio:**
Descripción breve de lo que fue modificado.

---
```

---

## 4. Reporte diario de desarrollo

Antes del commit o push al final del día, el desarrollador debe tener generado en `docs/project-logs/` el archivo:

**`daily-dev-report-YYYY-MM-DD.md`**

Contenido mínimo (ver plantilla `daily-dev-report-TEMPLATE.md`):

- **Fecha**
- **Desarrollador** (nombre)
- **Tareas completadas** (lista)
- **Tareas modificadas** (lista)
- **Archivos modificados** (lista)
- **Resumen del progreso** (breve)
- **Notas** (observaciones, bloqueos, pendientes)

---

## 5. Formato de commit recomendado

Para commits que afecten checklists o tareas:

```
[CHECKLIST] Autor: <nombre> | Archivo: <archivo> | Acción: <resumen>
```

**Ejemplo:**

```
[CHECKLIST] Autor: Javier | Archivo: docs/CHECKLIST_ETAPAS_PROYECTO.md | Acción: Completadas tareas de Etapa 14
```

---

## 6. Responsabilidades del agente PO

- **Trazabilidad:** Asegurar que todas las modificaciones de checklists queden registradas en `checklist-change-log.md`.
- **Logs actualizados:** Los registros de cambio se mantienen al día; las entradas se agregan al final del archivo.
- **Reportes diarios:** Verificar que exista el reporte diario correspondiente antes de dar por cerrada la jornada (o recordar al equipo que lo genere antes del push).
- **Estructura:** Mantener organizada la documentación del proyecto (`docs/`, `docs/checklists/`, `docs/tasks/`, `docs/project-logs/`).
- **Sin eliminar:** No eliminar documentación existente; solo ampliar el repositorio con el sistema de trazabilidad descrito.

---

**Referencia rápida:** Instrucciones detalladas para el desarrollador en `docs/project-logs/README.md`.
