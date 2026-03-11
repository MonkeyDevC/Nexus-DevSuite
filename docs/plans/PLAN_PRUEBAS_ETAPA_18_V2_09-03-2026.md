# Plan de pruebas ETAPA 18 — V2 (exhaustivo, pulido humano)

**Versión:** 2.0  
**Fecha plan:** 2026-03-09  
**Objetivo:** Pulido humano de toda la aplicación y sus funcionalidades tras las mejoras de auditoría (tickets 001-032). Verificar que cada módulo, flujo y comportamiento reciente funciona correctamente en entorno real.  
**Referencia:** docs/ENDPOINTS_API_Y_USO_FRONTEND.md, docs/project-logs/TICKETS_IMPLEMENTADOS.md, docs/INFORME_ESTADO_Y_NORTE_NEXUS_DEVSUITE.md  
**Roles a probar:** **MASTER** (todas las pantallas y acciones) y **EMPLOYEE** (ver que Admin y acciones restringidas no estén disponibles o estén deshabilitadas).

---

## 0. Pre-requisitos y entorno

| Item | Comprobación |
|------|----------------|
| Backend | API levantada (npm start o equivalente); sin errores en consola del servidor. |
| Base de datos | MySQL accesible; migraciones aplicadas. |
| Frontend | Servido desde public/ (o build); abrir en navegador. |
| Usuarios de prueba | Al menos un usuario **MASTER** y uno **EMPLOYEE** con credenciales conocidas. |
| Consola del navegador | Abierta (F12) para detectar errores JS o fallos de red durante las pruebas. |

**Orden sugerido de ejecución:** 1 → 2 → 3 → … → 15. Dentro de cada sección, seguir el orden de la tabla. Marcar ☐ → ☑ al pasar cada caso.

---

## 1. Autenticación

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| A1 | Login con credenciales válidas | Introducir email y contraseña correctos → redirección a #/dashboard; nombre/usuario visible en topbar; GET /auth/me ejecutado. | |
| A2 | Login con credenciales inválidas | Email o contraseña incorrectos → mensaje de error claro; no redirección. | |
| A3 | Logout | Clic en cerrar sesión → redirección a login; no se puede acceder a #/dashboard sin volver a loguearse. | |
| A4 | Ruta protegida sin login | Con sesión cerrada, intentar acceder a #/projects o #/dashboard (escribiendo URL o hash) → redirección a login o mensaje de no autorizado. | |
| A5 | Refresh de token | Dejar la app abierta hasta que caduque el access token (si aplica); siguiente petición → refresh automático sin sacar al usuario (o redirección a login si falla refresh). | |

---

## 2. Layout y navegación global

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| L1 | Sidebar visible | Tras login, sidebar con enlaces: Panel, Proyectos, Features, Stories, Sprints, Lanzamientos, Incidentes, Mejoras, Documentos, Change Requests, Reportes (si MASTER). | |
| L2 | Enlace activo en sidebar | Al estar en #/projects, el enlace "Proyectos" se muestra como activo; igual en otras vistas. | |
| L3 | Menú de aplicaciones (grid) | Clic en icono de aplicaciones en topbar → dropdown con Ajustes, Reportes, Proyectos; si MASTER: Usuarios, Auditoría, Métricas, Organización. | |
| L4 | Búsqueda global (topbar) | Clic o foco en el campo "Buscar" del topbar → aparece dropdown con "Ir a": Proyectos, Releases, Documentos, Features. Clic en uno → navega al hash correcto y dropdown se cierra. | |
| L5 | Indicador de salud API (footer) | En cualquier vista con nav cargada, footer muestra "API: OK" (verde) o "API: Error" (rojo). Si se apaga el backend, debe pasar a Error sin bloquear la app. | |
| L6 | Toggle sidebar móvil | En viewport estrecho (o modo responsive), botón de menú (☰) muestra/oculta sidebar; overlay cierra sidebar al clic. | |

---

## 3. Dashboard (#/dashboard)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| D1 | Carga sin error | #/dashboard carga; breadcrumb "Panel"; no pantalla en blanco ni errores en consola. | |
| D2 | Tarjetas métricas | Se muestran tarjetas (Proyectos activos, Stories, Progreso del sprint, Incidentes críticos) con datos o "—"/0 según API; enlaces "Ver proyectos", "Ver sprints", etc. funcionan. | |
| D3 | Estado de los proyectos | Tabla con proyectos (o "No hay proyectos"); nombre del proyecto enlaza a #/projects/:id; progreso y estado coherentes. | |
| D4 | Sprint activo | Si hay sprint activo: nombre, barra de progreso, botón "Ver detalle del sprint" → #/sprints/:id. Si no hay: mensaje "No hay sprint activo" y "Ver sprints". | |
| D5 | Mis asignaciones | Si hay asignaciones: tabla con ID, tipo, título, prioridad, estado; botón "Ver" en cada fila → abre detalle de la story (#/stories?story=:id). Si no hay: "No hay asignaciones". | |
| D6 | Actividad reciente | Lista de actividad (o "No hay actividad reciente"); datos proceden de API. | |
| D7 | Proyectos recientes | Lista de proyectos con enlace a #/projects/:id; "Ver todos los proyectos" → #/projects. | |

---

## 4. Proyectos (#/projects)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| P1 | Listado carga | Lista de proyectos o empty state "Aún no hay proyectos"; sin error en consola. | |
| P2 | Selector "Ver por página" | Cambiar a 25 o 50 → lista se actualiza con el nuevo tamaño de página. | |
| P3 | Filtros y búsqueda | Filtrar por estado o buscar por nombre (si existe) → resultados coherentes. | |
| P4 | Empty state con CTA (MASTER) | Con cero proyectos, botón visible "Crear proyecto" que abre el flujo de creación. | |
| P5 | Crear proyecto (MASTER) | Botón "Nuevo proyecto" → modal con nombre (obligatorio) y descripción → Guardar → proyecto aparece en lista o mensaje de éxito. | |
| P6 | Detalle de proyecto | Clic en fila o "Ver" → #/projects/:id; breadcrumb; datos del proyecto; enlaces a Features, Sprints, Incidentes. | |
| P7 | Editar proyecto (MASTER) | En detalle o lista, "Editar" → modal con nombre y descripción → Guardar → datos actualizados (PATCH /projects/:id). | |
| P8 | Archivar proyecto (MASTER) | En detalle, Archivar → proyecto pasa a ARCHIVED; ya no en listado de activos (según filtro). | |
| P9 | Eliminar proyecto (MASTER) | Eliminar un proyecto → confirmación → proyecto desaparece de la lista. | |
| P10 | Eliminación múltiple (MASTER) | Activar selección, marcar varios, "Eliminación múltiple" → confirmación → proyectos eliminados. | |

---

## 5. Features (#/features)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| F1 | Listado por proyecto | Seleccionar proyecto en dropdown → lista de features o empty state "Seleccione un proyecto" / "No hay features". | |
| F2 | Selector "Ver por página" | Cambiar límite → lista se actualiza. | |
| F3 | Crear feature | "Nueva feature" → título y descripción → Guardar → feature en lista. | |
| F4 | Cambiar estado de feature | En la fila, dropdown de estado (DRAFT, APPROVED, IN_PROGRESS, DONE, ARCHIVED) → cambiar → PATCH /features/:id/status; lista se refresca. | |
| F5 | Navegación a Stories | Clic en "Stories" de una feature → vista Stories con esa feature seleccionada (o enlace a listado de stories de la feature). | |
| F6 | Acceso por #/features/:id | Desde un enlace externo (p. ej. Change Requests "Ver feature") con #/features/:id → vista carga el proyecto de esa feature y muestra contexto correcto. | |

---

## 6. Stories (#/stories)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| S1 | Listado por proyecto y feature | Seleccionar proyecto y feature → lista de stories o empty state; "Crear primera story" si aplica. | |
| S2 | Crear story | "Nueva story" o "Crear primera story" → formulario → Guardar → story en lista; mensaje de éxito. | |
| S3 | Abrir detalle (modal) | Clic en "Ver" de una story → modal con pestañas Vista / Edición; datos cargados con GET /stories/:id. | |
| S4 | Cambiar estado en modal | En modal, selector de estado → cambiar → PATCH /stories/:id/status; valor actualizado. | |
| S5 | Asignar usuario | En pestaña Edición, dropdown "Asignado a" → elegir usuario → PATCH /stories/:id/assign; valor actualizado. | |
| S6 | Editar título, descripción, prioridad, criterios | En Edición, modificar campos y guardar → PATCH /stories/:id; cambios visibles. | |
| S7 | Asignar a sprint | Selector de sprint en modal → elegir sprint → PATCH /stories/:id/sprint (o equivalente); asignación reflejada. | |
| S8 | Enlace a feature | En modal de detalle, enlace "Feature" o similar → navega a vista de features del proyecto. | |
| S9 | Apertura por #/stories?story=:id | Desde Dashboard "Mis asignaciones" → Ver → hash #/stories?story=:id → modal de la story se abre y hash se normaliza. | |

---

## 7. Sprints (#/sprints)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| SP1 | Listado por proyecto | Seleccionar proyecto → lista de sprints o empty state. | |
| SP2 | Crear sprint | "Nuevo sprint" → nombre y fechas (si aplica) → Guardar → sprint en lista. | |
| SP3 | Detalle de sprint | Clic en sprint → #/sprints/:id; breadcrumb; datos del sprint; sección "Stories del sprint". | |
| SP4 | Listar stories del sprint | En detalle, stories asignadas se listan; si no hay, mensaje "No hay stories en este sprint". | |
| SP5 | Asignar story al sprint (MASTER) | Si sprint no CLOSED: selector de story (candidatas del proyecto) → "Asignar" → POST /sprints/:id/stories/:storyId; story aparece en la lista. | |
| SP6 | Quitar story del sprint | "Quitar del sprint" en una story → confirmación → DELETE /sprints/:id/stories/:storyId; story desaparece de la lista. | |
| SP7 | Cerrar sprint (MASTER) | Botón "Cerrar sprint" → confirmación → PATCH /sprints/:id/status { status: "CLOSED" }; estado actualizado; botón ya no disponible. | |
| SP8 | Enlace "Volver" | "Volver" → #/sprints (o #/sprints?project=:id); listado carga correctamente. | |
| SP9 | Enlace desde story a detalle | En la lista de stories del sprint, título de la story enlaza a #/stories?story=:id y abre modal. | |

---

## 8. Releases (#/releases)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| R1 | Listado | #/releases carga; lista o empty state; selector "Ver por página". | |
| R2 | Crear release (MASTER) | "Nuevo release" → datos (versión, etc.) → Guardar → release en lista. | |
| R3 | Detalle de release | Clic en release → #/releases/:id; breadcrumb; estado, descripción, lista de features asignadas. | |
| R4 | Cambiar estado del release | Selector de estado (PLANNED, IN_PROGRESS, QA, RELEASED, ARCHIVED) → PATCH status; valor actualizado. | |
| R5 | Editar descripción (MASTER) | "Editar descripción" → texto → Guardar → PATCH /releases/:id; descripción actualizada. | |
| R6 | Asignar feature al release | Seleccionar proyecto y feature en dropdowns → "Asignar feature" → feature aparece en la lista; enlace de la feature lleva a #/features/:id o #/features?project= según tenga id. | |
| R7 | Hotfix (MASTER) | Con release en RELEASED, "Crear hotfix" → POST /releases/:id/hotfix → redirección al nuevo release. | |
| R8 | Eliminar release (MASTER) | Eliminar desde lista o detalle → confirmación → release desaparece. | |
| R9 | Eliminación múltiple (MASTER) | Selección múltiple → "Eliminación múltiple" → confirmación → releases eliminados. | |
| R10 | Volver | "Volver" → #/releases. | |

---

## 9. Incidentes (#/incidents)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| I1 | Listado por proyecto | Seleccionar proyecto → lista de incidentes o empty state "Seleccione un proyecto" / "No hay incidentes". | |
| I2 | Selector "Ver por página" y filtros | Cambiar límite; filtrar por estado si existe → resultados coherentes. | |
| I3 | Crear incidente | "Nuevo incidente" → título (y severidad si aplica) → Guardar → incidente en lista. | |
| I4 | Detalle de incidente | Clic en "Ver" → #/incidents/:id; breadcrumb incluye proyecto; título, descripción, severidad, estado, asignado, causa raíz. | |
| I5 | Cambiar estado | Selector de estado (OPEN, IN_PROGRESS, RESOLVED, CLOSED) → PATCH /incidents/:id/status; al cerrar, causa raíz enviada si está rellenada. | |
| I6 | Editar asignado y causa raíz | Modificar campos y guardar → PATCH /incidents/:id; datos actualizados. | |
| I7 | Volver con contexto | "Volver" → #/incidents?project=:projectId; listado se carga con el mismo proyecto preseleccionado. | |
| I8 | Enlace a story relacionada | Si el incidente tiene story_id, "Ver story" → #/stories?story=:id. | |

---

## 10. Mejoras (#/improvements)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| M1 | Listado | #/improvements carga; lista con paginación y filtro por estado; selector "Ver por página". | |
| M2 | Crear mejora | "Nueva mejora" → título y descripción → Guardar → mejora en lista. | |
| M3 | Detalle de mejora | Clic en "Ver" o en fila → #/improvements/:id; datos y selector de estado. | |
| M4 | Cambiar estado | Estados DRAFT, PROPOSED, APPROVED, REJECTED, IMPLEMENTED → PATCH /improvements/:id/status; valor actualizado. | |

---

## 11. Documentos (#/documents)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| DOC1 | Listado | #/documents carga; lista con búsqueda y paginación; "Ver por página". | |
| DOC2 | Buscar por código | Introducir código en "Buscar por código" → "Ir" → GET /documents/code/:code; si existe, redirección a #/documents/:id; si no, mensaje "No se encontró...". | |
| DOC3 | Crear documento | Crear → código, título, descripción (según API) → Guardar → documento en lista. | |
| DOC4 | Detalle de documento | Clic en documento → detalle; sección "Versiones" con tabla de versiones. | |
| DOC5 | Nueva versión | "Nueva versión" → change_reason y content (opcionales) → Crear → POST /documents/:id/versions; versión en la tabla. | |
| DOC6 | Ver contenido de versión | "Ver contenido" en una versión → GET por versionId → modal con contenido. | |
| DOC7 | Editar contenido (MASTER, DRAFT) | En modal "Ver contenido", si versión es DRAFT y usuario MASTER, editar y Guardar → PATCH versión; contenido actualizado. | |
| DOC8 | Aprobar / Archivar versión (MASTER) | Botones Aprobar y Archivar en versión → PATCH status APPROVED/ARCHIVED; estado actualizado. | |
| DOC9 | Enlaces Feature/Story en detalle | Si el documento tiene feature_id o story_id, enlaces "Feature relacionada" / "Story relacionada" funcionan. | |

---

## 12. Change Requests (#/change-requests)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| CR1 | Crear CR con datos válidos | Entidad (FEATURE o RELEASE), ID de entidad (UUID válido), opcionalmente título y descripción → "Crear" → mensaje de éxito y ID mostrado; enlaces "Ver feature" o "Ver release" según entity_type. | |
| CR2 | Validación UUID | Introducir ID de entidad no UUID → mensaje claro de error; no se envía POST. | |
| CR3 | Enviar a revisión | Pegar ID del CR creado → "Enviar" → PATCH submit; mensaje de éxito. | |
| CR4 | Aprobar / Rechazar (MASTER) | Con CR en estado adecuado, "Aprobar" o "Rechazar" → PATCH correspondiente; mensaje correcto. | |
| CR5 | Marcar implementado (MASTER) | "Marcar implementado" → PATCH implement; mensaje correcto. | |
| CR6 | Errores de API | Si la API devuelve error (ej. CR ya aprobado), se muestra mensaje con showApiError (modal o texto). | |

---

## 13. Reportes (#/reports)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| REP1 | Resumen por proyecto | Seleccionar proyecto → "Ver resumen" o equivalente → datos de GET /reports/projects/:id/summary; tabla o mensaje. | |
| REP2 | Resumen por sprint | Seleccionar proyecto y sprint → resumen de sprint; GET /reports/sprints/:id/summary. | |
| REP3 | Actividad por usuario | Seleccionar usuario → "Ver actividad" → tabla de actividad (GET /reports/users/:id/activity); selector "Ver por página" si existe. | |
| REP4 | Auditoría (MASTER) | Pestaña o sección Auditoría → log de auditoría (GET /reports/audit); datos o empty. | |
| REP5 | Visibilidad del menú Reportes | Con usuario MASTER, "Reportes" visible en sidebar; con EMPLOYEE, no visible (según política actual). | |

---

## 14. Admin (MASTER)

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| AD1 | Acceso a Admin | #/admin o menú "Usuarios" / "Auditoría" / "Métricas" / "Organización" accesibles con rol MASTER. | |
| AD2 | Usuarios — Listar | #/admin/users → lista de usuarios (GET /users). | |
| AD3 | Usuarios — Crear | Crear usuario → campos y roles desde GET /auth/roles → POST /users; usuario en lista. | |
| AD4 | Usuarios — Editar | Editar usuario → PUT /users/:id; foto (POST photo) y contraseña (PATCH password) si se prueban. | |
| AD5 | Usuarios — Eliminar | Eliminar usuario → DELETE /users/:id; usuario ya no en lista (soft delete). | |
| AD6 | Organización | #/admin/organization → datos de GET /organizations/current; editar nombre, plan, billing_email, next_billing_date → PATCH /organizations/:id; validación de nombre obligatorio. | |
| AD7 | Auditoría | Log de auditoría con filtros si existen; datos coherentes. | |
| AD8 | Métricas | Panel de métricas (GET /system/metrics) carga sin error. | |

---

## 15. Ajustes y rol EMPLOYEE

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| AJ1 | Ajustes (MASTER) | #/settings carga; roles y estados en solo lectura; sección "Administración" con enlaces "Gestionar organización" y "Gestionar usuarios" → navegan a #/admin/organization y #/admin/users. | |
| AJ2 | Ajustes (EMPLOYEE) | Con usuario EMPLOYEE, #/settings redirige a #/dashboard (solo MASTER). | |
| E1 | Admin no accesible (EMPLOYEE) | Con EMPLOYEE, intentar #/admin → mensaje "No tiene permisos" o redirección; enlaces Usuarios, Auditoría, Métricas, Organización no visibles en menú de aplicaciones. | |
| E2 | Acciones MASTER ocultas (EMPLOYEE) | En Projects: no "Editar", "Archivar", "Eliminar", "Eliminación múltiple" ni "Nuevo proyecto". En Releases: no "Crear release", "Editar descripción", "Crear hotfix", "Eliminar", "Eliminación múltiple". En Sprints: no "Cerrar sprint" ni "Editar". En Documents: no "Aprobar" ni "Archivar" versión. En Change Requests: no "Aprobar", "Rechazar", "Marcar implementado". | |
| E3 | Navegación operativa (EMPLOYEE) | Dashboard, Proyectos (solo ver/detalle), Features, Stories, Sprints, Releases (ver y posiblemente cambiar estado según API), Incidentes, Mejoras, Documentos, Reportes (si se abre a todos) funcionan sin errores. | |

---

## 16. Consola y red

| # | Caso | Pasos / qué verificar | ☑ |
|---|------|------------------------|---|
| C1 | Sin errores JS en consola | Durante toda la sesión de pruebas (navegación y acciones), consola del navegador sin errores JavaScript no esperados. | |
| C2 | Peticiones API correctas | En pestaña Red, las llamadas a /api/v1/* devuelven 200/201 cuando la acción es correcta; 4xx/5xx con mensaje mostrado al usuario (modal o texto). | |
| C3 | 401 y refresh | Si se simula caducidad de token, la siguiente petición dispara refresh; si refresh falla, redirección a login. | |

---

## 17. Registro de fallos

Al encontrar un fallo, anotar en esta tabla (o en documento externo: docs/project-logs/resultados-pruebas-etapa-18-v2-YYYY-MM-DD.md):

| Caso | Descripción del fallo | Pasos para reproducir | Error (consola / UI / red) | Prioridad (B/M/S) |
|------|------------------------|------------------------|-----------------------------|-------------------|
|     |                        |                        |                             |                   |

**Prioridad:** B = Bloqueante, M = Mayor, S = Menor.

---

## 18. Criterio de paso y cierre

- **Pasa:** Caso ejecutado y comportamiento correcto (o empty state / mensaje coherente con el estado de datos).
- **Falla:** Caso ejecutado pero error, pantalla en blanco, dato incorrecto o comportamiento no esperado → registrar en sección 17.

**Cierre del plan:**  
Al finalizar la ejecución, generar lista de fallos priorizada (Bloqueantes > Mayores > Menores) para el Master Developer. El PO o QA valida el criterio de cierre de la Etapa 18 según el nivel de fallos críticos restantes.

---

**Responsable de ejecución:** Equipo / QA.  
**Validación:** QA ENGINEER.  
**Cierre de etapa:** PO MASTER.
