# Prompt — Resumen de mejoras del día e inclusión en checklist (entrega del día)

**Para:** MASTER DEVELOPER  
**Contexto:** El CEO/PO estuvo todo el día haciendo mejoras contigo (agente) en el sistema. Necesitas generar un **resumen estructurado** de todo lo que se mejoró y **incorporarlo al checklist del proyecto** y a la trazabilidad para que la entrega del día quede lista para **subir a GitHub** según el sistema de entregas del proyecto.  
**Fecha de entrega:** Hoy (usar la fecha actual en YYYY-MM-DD).

---

## 1. OBJETIVO

1. **Revisar** todo el trabajo y las mejoras realizadas durante la jornada (conversaciones, archivos modificados, decisiones, ajustes en barra superior, sistema de trazabilidad, documentación, etc.).
2. **Redactar un resumen** claro y estructurado de esas mejoras.
3. **Añadir una nueva sección** en `docs/CHECKLIST_ETAPAS_PROYECTO.md` que documente esta entrega (como una iniciativa o “etapa” de mejoras del día), con el resumen y, si aplica, lista de archivos tocados.
4. **Cumplir la trazabilidad:** crear o actualizar el reporte diario y el log de cambios según `docs/SISTEMA_TRAZABILIDAD_LOGS.md` y `docs/project-logs/README.md`, dejando la entrega lista para el **commit y push manual a GitHub** al cierre del día.

---

## 0. SISTEMA DE ENTREGAS A GITHUB (REFERENCIA OBLIGATORIA)

Este proceso debe alinearse con el **sistema para subir entregas a GitHub** del proyecto:

- **Documentos de referencia:** `docs/SISTEMA_TRAZABILIDAD_LOGS.md` y `docs/project-logs/README.md`.
- **Regla:** El **commit y el push se realizan manualmente** al final de la jornada por el desarrollador o el equipo. Tu tarea es dejar **todo documentado y listo** para ese commit/push.
- **Antes del push** debe existir:
  1. Reporte diario en `docs/project-logs/daily-dev-report-YYYY-MM-DD.md`.
  2. Entrada en `docs/project-logs/checklist-change-log.md` por cada modificación relevante en checklist/tareas.
- **Formato de commit** (según SISTEMA_TRAZABILIDAD_LOGS): `[CHECKLIST] Autor: <nombre> | Archivo: <archivo> | Acción: <resumen>`.

Al terminar este prompt, el usuario/equipo solo debe ejecutar `git add`, `git commit` (con el mensaje sugerido) y `git push` para subir la entrega del día.

---

## 2. QUÉ HACER (PASOS OBLIGATORIOS)

### Paso 1 — Resumen de mejoras del día

Redactar un **resumen** que incluya al menos:

- **Título:** "Mejoras y ajustes del día YYYY-MM-DD" (fecha de hoy).
- **Áreas tocadas:** Por ejemplo: barra superior (logo, búsqueda centrada, menú de puntos), sistema de trazabilidad (project-logs, checklist-change-log, reportes diarios), documentación (prompts, planes, checklist), etc.
- **Lista de mejoras:** Cada ítem en una línea (bullet), con descripción breve (qué se hizo y en qué archivo o componente si aplica).
- **Archivos modificados o creados:** Lista de rutas de archivos que se crearon o modificaron durante el día (revisar el historial de la sesión o los archivos que tú y el usuario tocaron).

Guarda este resumen en un bloque de texto que usarás en el Paso 2.

### Paso 2 — Nueva sección en CHECKLIST_ETAPAS_PROYECTO.md

En `docs/CHECKLIST_ETAPAS_PROYECTO.md`:

1. En la **tabla "Resumen de estado"** (al final de la tabla, antes del cierre `|---`), añadir **una fila nueva**:

   | **Mejoras y ajustes del día YYYY-MM-DD** | ✅ Entregado | — |

   (Sustituir YYYY-MM-DD por la fecha de hoy.)

2. **Después de la tabla**, añadir una **nueva sección** con el mismo título, por ejemplo:

   ```markdown
   ---

   ## Mejoras y ajustes del día YYYY-MM-DD ✅ ENTREGADO

   | Criterio | Estado |
   |----------|--------|
   | Resumen de mejoras documentado | ✅ |
   | Archivos modificados/creados listados | ✅ |
   | Trazabilidad (log + reporte diario) actualizada | ✅ |

   **Resumen del día:**  
   [Pegar aquí el resumen completo redactado en el Paso 1.]

   **Archivos modificados o creados:**  
   - `ruta/archivo1`
   - `ruta/archivo2`
   - …

   **Documentos relacionados:** docs/project-logs/daily-dev-report-YYYY-MM-DD.md, docs/project-logs/checklist-change-log.md
   ```

   Ajustar el texto según el contenido real del resumen y de la lista de archivos.

### Paso 3 — Reporte diario (requisito antes del push, según SISTEMA_TRAZABILIDAD_LOGS)

Crear el archivo **`docs/project-logs/daily-dev-report-YYYY-MM-DD.md`** (fecha de hoy) usando la plantilla `docs/project-logs/daily-dev-report-TEMPLATE.md` y rellenar:

- **Desarrollador:** Indicar "CEO/PO + MASTER DEVELOPER (agente)" o el nombre que uses para esta sesión.
- **Tareas completadas:** Las que correspondan (ej. "Ajuste barra superior", "Sistema de trazabilidad (logs y reportes)", "Documentación de prompts y checklist").
- **Tareas modificadas:** Si aplica.
- **Archivos modificados:** La misma lista que en el resumen del Paso 1.
- **Resumen del progreso:** Versión corta del resumen del día (2–4 líneas).
- **Notas:** Cualquier observación relevante para el push de hoy.

### Paso 4 — Log de cambios (requisito antes del push, según docs/project-logs/README.md)

En **`docs/project-logs/checklist-change-log.md`**, añadir **al final del archivo** (debajo de la línea "*(Las entradas se agregan debajo de esta línea)*") una entrada con el formato estándar:

- **Fecha y hora:** Fecha y hora actuales.
- **Autor:** Tu nombre o "MASTER DEVELOPER (agente)".
- **Rama:** La rama actual (si tienes acceso a git) o dejar indicado "rama actual".
- **Archivo modificado:** `docs/CHECKLIST_ETAPAS_PROYECTO.md`
- **Tipo de cambio:** Marcar "Actualización de documentación" (y si aplica "Checklist reorganizado" o "Nueva tarea agregada").
- **Resumen del cambio:** Breve descripción, por ejemplo: "Añadida sección 'Mejoras y ajustes del día YYYY-MM-DD' con resumen de mejoras del día y lista de archivos modificados/creados; entrega del día para push."

---

## 3. CRITERIOS DE ACEPTACIÓN

- [ ] Existe un resumen claro y estructurado de todo lo mejorado en el día.
- [ ] En `docs/CHECKLIST_ETAPAS_PROYECTO.md` hay una nueva fila en "Resumen de estado" y una nueva sección "Mejoras y ajustes del día YYYY-MM-DD" con el resumen y la lista de archivos.
- [ ] Existe `docs/project-logs/daily-dev-report-YYYY-MM-DD.md` para la fecha de hoy, cumpliendo la plantilla.
- [ ] Existe una entrada nueva en `docs/project-logs/checklist-change-log.md` que registra la modificación al checklist.
- [ ] Todo está listo para que el usuario/equipo haga **commit y push manual a GitHub** según el sistema de entregas (SISTEMA_TRAZABILIDAD_LOGS).

---

## 4. FORMATO DE COMMIT SUGERIDO (según sistema de entregas a GitHub)

El formato de commit del proyecto para checklists/tareas está definido en `docs/SISTEMA_TRAZABILIDAD_LOGS.md`. Para esta entrega, usar (o sugerir al usuario):

```
[CHECKLIST] Autor: <nombre> | Archivo: docs/CHECKLIST_ETAPAS_PROYECTO.md | Acción: Resumen y sección "Mejoras del día YYYY-MM-DD" + reporte diario y log de trazabilidad
```

---

## 5. NOTAS

- **Commit y push son manuales:** según el sistema de entregas a GitHub, el desarrollador/equipo ejecuta `git add`, `git commit` y `git push` al final de la jornada. Tu salida debe dejar todo listo para eso.
- Si no tienes acceso a la fecha/hora real ni a la rama de git, usa la fecha del día en que se ejecuta el prompt y deja "Rama: (no especificada)" o similar.
- El resumen debe basarse en el trabajo real realizado durante la sesión (archivos que recuerdes o que puedas listar desde el repositorio).
- No inventes mejoras que no se hayan hecho; si algo no está claro, indica en el resumen "Ajustes de documentación y gobernanza" de forma genérica y lista los archivos que sí se modificaron.
