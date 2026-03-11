# Protocolo de implementación de tickets — NEXUS DevSuite

**Objetivo:** Definir de forma disciplinada cómo se implementa un ticket derivado de la auditoría funcional, garantizando alcance controlado, trazabilidad y consistencia con el plan de implementación.

**Referencias:**  
- docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-03.md (origen de los tickets)  
- docs/plans/PLAN_IMPLEMENTACION_AUDITORIA_FRONTEND_2026-03.md (orden y dependencias)  
- docs/process/WORKFLOW_DESARROLLO_AUDITORIA.md (flujo PO → Auditoría → Tickets → Implementación → QA)

---

# SECCIÓN 1 — PRINCIPIOS DE IMPLEMENTACIÓN

Las siguientes reglas son **obligatorias** para todo ticket derivado de la auditoría:

1. **Cada ticket se implementa de forma aislada.**  
   Los cambios se limitan al objetivo del ticket; no se incluyen mejoras no solicitadas ni refactors no relacionados.

2. **No se modifican módulos no relacionados.**  
   Solo se tocan los archivos y flujos indicados en el alcance del ticket (véase Sección 3).

3. **No se cambia la arquitectura.**  
   Se mantiene el patrón actual: vistas en `public/js/views/`, API en `public/js/api.js`, rutas hash, etc. Cualquier cambio arquitectónico debe ser aprobado por SYSTEM ARCHITECT y tratado como tema separado.

4. **No se crean endpoints nuevos.**  
   El backend no se extiende con nuevas rutas o métodos para cumplir el ticket.

5. **Solo se conectan o utilizan endpoints existentes.**  
   La implementación consiste en consumir la API ya expuesta: llamar a los endpoints documentados, adaptando la UI al contrato real (cuerpo, códigos de respuesta). Si un endpoint no existe o difiere del documento, se reporta y se adapta la UI al contrato existente, no se crea uno nuevo.

---

# SECCIÓN 2 — CICLO DE VIDA DE UN TICKET

El flujo completo de implementación de un ticket es el siguiente:

| Paso | Acción | Descripción |
|------|--------|-------------|
| **1** | **Selección del ticket** | Tomar el siguiente ticket según el orden definido en docs/plans/PLAN_IMPLEMENTACION_AUDITORIA_FRONTEND_2026-03.md (Fase 1 → 2 → 3). Respetar dependencias (ej. NEXUS-AUD-006 después de NEXUS-AUD-001). |
| **2** | **Lectura del ticket original** | Abrir docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-03.md y leer la sección completa del ticket (contexto, objetivo, endpoints, tareas técnicas, criterios de aceptación, archivos posiblemente afectados). |
| **3** | **Identificación de endpoints relacionados** | Listar los endpoints que el ticket debe usar (método y ruta). Verificar en backend o en docs/ENDPOINTS_API_Y_USO_FRONTEND.md que existan y que el contrato (body, respuesta) sea el esperado. |
| **4** | **Identificación de archivos frontend involucrados** | Definir la lista explícita de **archivos permitidos** para este ticket (véase Sección 3). Incluir solo los necesarios para cumplir el objetivo (vistas, router, index.html, api.js si aplica, documentación). |
| **5** | **Implementación del ticket** | Desarrollar los cambios únicamente en los archivos permitidos. No modificar otros módulos ni añadir funcionalidad fuera del alcance. |
| **6** | **Verificación del flujo funcional** | Ejecutar el flujo de usuario descrito en el ticket; comprobar que los endpoints responden correctamente y que la UI refleja los datos y las acciones (véase Sección 5). |
| **7** | **Actualización de documentación** | Actualizar docs/ENDPOINTS_API_Y_USO_FRONTEND.md si el ticket implica uso nuevo o cambio de uso de endpoints; actualizar docs/project-logs/checklist-change-log.md si se modifican checklists o tareas (véase Sección 6). |
| **8** | **Registro de implementación** | Añadir una entrada en docs/project-logs/TICKETS_IMPLEMENTADOS.md con Ticket ID, archivos modificados, endpoints utilizados y cambios funcionales (véase Sección 4). |

---

# SECCIÓN 3 — ALCANCE CONTROLADO DEL TICKET

Cada ticket debe declarar **explícitamente** los **archivos permitidos a modificar** antes de comenzar la implementación.

## 3.1 Formato de la lista de archivos permitidos

La lista debe ser concreta y usar rutas relativas al repositorio. Ejemplo para un ticket de incidentes:

```
Archivos permitidos para este ticket:
- public/js/views/incidents.js
- public/js/router.js
- public/index.html (solo enlaces o ítem de menú si aplica)
- docs/ENDPOINTS_API_Y_USO_FRONTEND.md
```

## 3.2 Regla de restricción

- El desarrollador **no debe modificar** archivos que no estén en la lista de archivos permitidos del ticket.
- Si durante la implementación se detecta que **hacen falta otros archivos** para cumplir el objetivo (por ejemplo, un util compartido o una vista que no se había listado), se debe:
  1. **Reportar** la necesidad (en el registro del ticket o en comunicación con PO/ARCHITECT).
  2. Valorar si se amplía el alcance del ticket con una actualización documentada de la lista de archivos permitidos, o si se **genera un nuevo ticket** para ese cambio.
- No se asume por defecto que “cualquier archivo del proyecto” está permitido; la lista acota el alcance y facilita revisiones y trazabilidad.

## 3.3 Origen de la lista

La lista de archivos permitidos se toma de:

- La sección **“ARCHIVOS POSIBLEMENTE AFECTADOS”** del ticket en docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-03.md.
- La tabla **“Impacto en frontend”** y **“Partes de frontend y backend involucradas”** en docs/plans/PLAN_IMPLEMENTACION_AUDITORIA_FRONTEND_2026-03.md.

El desarrollador la consolida y, si aplica, la detalla (p. ej. “solo menú” en index.html) antes de codificar.

---

# SECCIÓN 4 — TRAZABILIDAD

Cada ticket implementado debe quedar registrado para poder rastrear cambios futuros.

## 4.1 Contenido del registro

Para cada ticket se debe registrar:

| Campo | Descripción |
|-------|-------------|
| **Ticket ID** | Identificador del ticket (ej. NEXUS-AUD-001). |
| **Archivos modificados** | Lista exacta de archivos tocados (rutas relativas). |
| **Endpoints utilizados** | Método y ruta de cada endpoint que el ticket conecta o usa (ej. PATCH /api/v1/sprints/:id/status). |
| **Cambios funcionales realizados** | Resumen breve de lo que el usuario puede hacer tras el cambio (ej. “Cerrar sprint desde detalle usando PATCH status; documentación actualizada”). |

Opcionalmente: fecha de cierre, autor, rama o commit de referencia.

## 4.2 Ubicación del registro

El registro se realiza en:

**docs/project-logs/TICKETS_IMPLEMENTADOS.md**

Cada implementación se añade como una nueva entrada (por ejemplo, una fila en una tabla o un bloque con el formato acordado). Este archivo es la fuente de trazabilidad de qué tickets se han implementado y qué archivos y endpoints han quedado afectados.

---

# SECCIÓN 5 — VALIDACIÓN FUNCIONAL

Cada ticket debe validarse desde el punto de vista **funcional** antes de darse por cerrado. No se evalúa diseño visual; solo que el flujo y los datos sean correctos.

## 5.1 Comprobaciones obligatorias

1. **El endpoint responde correctamente.**  
   Las llamadas usan la ruta y el cuerpo esperados por la API; las respuestas 2xx se procesan y las 4xx/5xx se manejan sin romper la aplicación (mensaje o estado coherente).

2. **El flujo de usuario funciona.**  
   El usuario puede completar la acción descrita en el ticket (ej. cerrar sprint, ver detalle de incidente, cambiar estado de feature) y los datos se reflejan en la UI tras la operación.

3. **No se rompen otras vistas.**  
   Los cambios no introducen regresiones en listados, detalle o acciones de otros módulos (navegación, permisos, datos mostrados). Una comprobación mínima de humo en módulos relacionados (según el plan) es recomendable.

## 5.2 Lo que no se exige en este protocolo

- Evaluación de **diseño visual** (colores, espaciado, iconografía) salvo que el ticket lo mencione explícitamente.
- Cobertura de **tests automatizados** (queda a criterio del proyecto; el protocolo se centra en validación funcional manual según criterios de aceptación del ticket).

---

# SECCIÓN 6 — ACTUALIZACIÓN DE DOCUMENTACIÓN

Después de implementar un ticket deben actualizarse los siguientes documentos cuando corresponda.

## 6.1 docs/ENDPOINTS_API_Y_USO_FRONTEND.md

- **Cuándo:** Siempre que el ticket implique **uso nuevo** de un endpoint o **cambio de uso** (ruta, método o flujo) de un endpoint ya documentado.
- **Qué hacer:**  
  - En la tabla “Endpoints usados desde el frontend”, añadir o modificar la fila del endpoint con la **vista / flujo** y una breve descripción del **uso**.  
  - Si se elimina el uso de una ruta (ej. /close), quitar o actualizar la referencia y dejar claro que se usa la ruta real (ej. /status).  
  - Actualizar el resumen de la sección 3 si cambia el conjunto de endpoints con interfaz.

## 6.2 docs/project-logs/checklist-change-log.md

- **Cuándo:** Cuando el ticket implique **modificación de checklists, tareas o archivos de seguimiento** (véase docs/project-logs/README.md para la lista de archivos considerados).
- **Qué hacer:** Añadir una entrada al final de checklist-change-log.md con el formato establecido (fecha, autor, archivo modificado, tipo de cambio, resumen).

## 6.3 docs/project-logs/TICKETS_IMPLEMENTADOS.md

- **Cuándo:** Siempre, tras cerrar cada ticket.
- **Qué hacer:** Añadir la entrada de trazabilidad descrita en la Sección 4 (Ticket ID, archivos modificados, endpoints utilizados, cambios funcionales).

---

*Este protocolo aplica a todos los tickets derivados de docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-03.md y al plan docs/plans/PLAN_IMPLEMENTACION_AUDITORIA_FRONTEND_2026-03.md. Cualquier excepción (p. ej. ampliación de alcance o nuevo endpoint) debe ser acordada con PO y/o SYSTEM ARCHITECT.*
