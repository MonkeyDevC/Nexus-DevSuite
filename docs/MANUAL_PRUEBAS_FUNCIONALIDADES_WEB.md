# Manual de pruebas — Funcionalidades web NEXUS DevSuite

**Versión:** 1.0  
**Fecha:** 2026-03-06  
**Alcance:** Todas las funcionalidades probables desde la interfaz web (navegador) tras Etapas 7–10.

---

## 1. Cómo acceder a la aplicación

- **URL:** Con el servidor en marcha (`npm run dev` o `node src/server.js`), abrir en el navegador la raíz del mismo origen, por ejemplo:  
  **`http://localhost:3000/`**  
  La aplicación se sirve desde la carpeta `public/`; la API está en `/api/v1`.

- **Primera vista:** Si no hay sesión, se muestra la pantalla de **Login**. Tras iniciar sesión correctamente se redirige a **Dashboard**.

- **Navegación:** Todas las rutas son por **hash** (`#/dashboard`, `#/projects`, etc.). Puedes escribir directamente en la barra de direcciones, por ejemplo: `http://localhost:3000/#/projects`.

- **Multi-tenant (Etapa 10):** Por defecto el backend asigna la organización con slug `"default"` cuando no se envía tenant. En la web no es obligatorio enviar cabecera; si en el futuro usas varias organizaciones, puedes probar con herramientas (Postman, etc.) añadiendo el header `X-Tenant-Slug: default` o `X-Organization-Id: <UUID>`.

---

## 2. Roles y permisos

| Rol       | Descripción breve | Qué ve en la web |
|----------|--------------------|-------------------|
| **MASTER** | Administrador      | Todo: Dashboard, Proyectos, Features, Stories, Sprints, Releases, Incidentes, Documentos, **Reportes**, **Administración** (usuarios, auditoría, métricas). Puede crear/archivar proyectos, crear releases, gestionar usuarios, ver auditoría y métricas. |
| **EMPLOYEE** | Usuario operativo | Dashboard, Proyectos, Features, Stories, Sprints, Releases, Incidentes, Documentos. **No** ve el menú "Reportes" ni "Administración"; si escribe `#/admin` o `#/reports` puede ser redirigido al Dashboard según implementación. |

Para probar ambos roles necesitas al menos un usuario de cada tipo (creados desde el panel Administración con usuario MASTER o desde la API/BD).

---

## 3. Login

**Ruta:** `#/login` (o abrir `/` sin sesión).

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Login correcto | Email y contraseña válidos de un usuario activo; enviar. | Mensaje de éxito (o sin error), redirección a `#/dashboard`. Barra de navegación visible con el email/rol del usuario. |
| Login incorrecto | Email o contraseña erróneos. | Mensaje de error (ej. "Credenciales inválidas" o similar según API). No se redirige; permanece en login. |
| Sin token accedes a una ruta protegida | Cerrar sesión o borrar sessionStorage y escribir `#/projects`. | Redirección a `#/login`. |
| Salir | Clic en botón **Salir** en la barra. | Cierre de sesión (tokens borrados), redirección a `#/login`. |

---

## 4. Dashboard

**Ruta:** `#/dashboard`.

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Listado de proyectos | Entrar con usuario que tenga proyectos en su organización. | Lista de proyectos con enlaces a cada uno. |
| Enlaces rápidos | Clic en "Ver todos los proyectos", "Features", "Sprints", "Releases". | Navegación a la sección correspondiente. |
| Sin proyectos | Usuario en org sin proyectos (o BD vacía). | Mensaje tipo "No hay proyectos" / empty state. |

---

## 5. Proyectos

**Ruta:** `#/projects`. Detalle: `#/projects/<id>`.

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Listar proyectos | Ir a Proyectos. | Tabla con nombre, estado (ACTIVE/ARCHIVED), enlaces a Features y al detalle. |
| Ordenar | Clic en cabecera de columna (nombre, estado). | Orden ascendente/descendente; indicador visual en la columna ordenada. |
| Filtrar por estado | Selector de estado (si existe). | Lista filtrada por ACTIVE o ARCHIVED. |
| Búsqueda | Escribir en el campo de búsqueda. | Filtrar en cliente por nombre (o campos implementados). |
| Paginación | Si hay muchos proyectos. | Controles Anterior/Siguiente o números de página; cambio de página correcto. |
| Ver detalle | Clic en nombre o "Ver" de un proyecto. | Vista de detalle con datos del proyecto, enlaces a Features, Sprints, Incidentes. |
| Crear proyecto (MASTER) | Botón "Nuevo" / "Crear proyecto"; rellenar nombre y descripción. | Proyecto creado; vuelta al listado o mensaje de éxito. |
| Archivar proyecto (MASTER) | En detalle o listado, acción "Archivar". | Proyecto pasa a ARCHIVED; badge o estado actualizado. |
| Empty state | Filtrar/buscar de forma que no haya resultados. | Mensaje tipo "No hay resultados para tu búsqueda o filtro". |

---

## 6. Features

**Ruta:** `#/features`. Con proyecto: `#/features?project=<projectId>`.

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Selector de proyecto | Elegir un proyecto del desplegable. | Se cargan las features de ese proyecto. |
| Listado | Tras elegir proyecto. | Tabla con título, estado (DRAFT/IN_PROGRESS/DONE), enlace a Stories. |
| Ordenación, filtros, búsqueda, paginación | Igual que en Proyectos (columnas y filtros según pantalla). | Comportamiento coherente con la tabla. |
| Breadcrumbs | En detalle o en la vista de features. | Ruta tipo "Proyectos > [Nombre proyecto] > Features". |
| Ir a Stories de una feature | Clic en "Stories" de una fila. | Navegación a `#/stories` con feature (o proyecto) preseleccionado. |
| Crear feature (MASTER) | Si hay botón/modal "Nueva feature"; proyecto y datos. | Feature creada y visible en la lista. |

---

## 7. Stories (User Stories)

**Ruta:** `#/stories`. Con contexto: `#/stories?feature=<id>` o `#/stories?project=<id>`.

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Selector proyecto → feature | Elegir proyecto y luego feature. | Listado de stories de esa feature. |
| Listado | Tabla con título, estado, enlaces. | Badges de estado; ordenación, filtro, búsqueda, paginación si existen. |
| Breadcrumbs | Proyectos > Proyecto > Features > Feature > Stories. | Navegación hacia atrás correcta. |
| Crear story (MASTER) | Formulario/modal nueva story. | Story creada en la feature elegida. |
| Cambiar estado | Si hay acción "Cambiar estado" o similar. | Transiciones permitidas por la API (ej. DRAFT → IN_PROGRESS). |

---

## 8. Sprints

**Ruta:** `#/sprints`. Detalle: `#/sprints/<id>`.

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Selector de proyecto | Elegir proyecto. | Lista de sprints del proyecto. |
| Listado | Tabla nombre, estado (PLANNED/IN_PROGRESS/CLOSED), enlace a detalle. | Ordenación, filtros, búsqueda, paginación, badges. |
| Ver detalle | Clic en un sprint. | Breadcrumb y datos del sprint; si aplica, stories asignadas. |
| Crear sprint (MASTER) | Botón "Nuevo sprint"; nombre y fechas si se piden. | Sprint creado en el proyecto. |
| Cerrar sprint (MASTER) | En detalle, acción "Cerrar" si el estado lo permite. | Sprint pasa a CLOSED (solo MASTER puede cerrar). |

---

## 9. Releases

**Ruta:** `#/releases`. Detalle: `#/releases/<id>`.

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Listar releases | Ir a Releases. | Tabla con versión, estado (PLANNED/RELEASED/ARCHIVED), enlace a detalle. |
| Ordenación, filtros, búsqueda, paginación | Igual que en otras listas. | Coherente con el resto de la app. |
| Ver detalle | Clic en versión o "Ver". | Breadcrumb y datos de la release. |
| Crear release (MASTER) | "Nueva release"; versión SemVer (X.Y.Z), descripción. | Release creada; lista actualizada. |

---

## 10. Incidentes

**Ruta:** `#/incidents`. Opcional: `#/incidents?project=<id>`.

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Selector de proyecto | Si la pantalla lo tiene. | Lista de incidentes del proyecto. |
| Listado | Tabla con título, estado (OPEN/IN_PROGRESS/RESOLVED/CLOSED), etc. | Badges, ordenación, filtros, búsqueda, paginación. |
| Crear incidente | "Nuevo incidente"; título y datos. | Incidente creado en el proyecto. |
| Editar / cambiar estado | Acciones por fila o en detalle. | Transiciones según API (ej. OPEN → IN_PROGRESS; RESOLVED → CLOSED solo MASTER con root_cause_analysis). |

---

## 11. Documentos

**Ruta:** `#/documents`. Detalle: `#/documents/<id>`.

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Listar documentos | Ir a Documentos. | Tabla código, título, enlace a detalle. |
| Búsqueda y paginación | Campo de búsqueda y controles de página. | Filtrado y paginación correctos. |
| Ver detalle | Clic en un documento. | Breadcrumb, datos del documento y versiones si se muestran. |
| Crear documento | "Nuevo documento"; código, título, proyecto (opcional). | Documento creado con primera versión (DRAFT). |
| Flujo de aprobación (MASTER) | Si hay acciones "Aprobar" / "Archivar" en versiones. | Solo MASTER puede aprobar o archivar según API. |

---

## 12. Reportes (solo MASTER)

**Ruta:** `#/reports`. El menú **Reportes** solo es visible para usuario con rol MASTER.

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Acceso como MASTER | Iniciar sesión con MASTER; clic en Reportes. | Pantalla de reportes: resumen de proyecto, resumen de sprint, actividad de usuario, auditoría. |
| Resumen de proyecto | Seleccionar proyecto; solicitar resumen. | Datos de resumen (conteos, etc.) según GET /reports/projects/:projectId/summary. |
| Resumen de sprint | Seleccionar sprint. | Datos según GET /reports/sprints/:sprintId/summary. |
| Auditoría | Listado de auditoría (GET /reports/audit). | Tabla con filtros (entidad, usuario, fechas, acción) y paginación (Anterior/Siguiente, números). |
| Acceso como EMPLOYEE | Usuario EMPLOYEE no debe ver menú Reportes; si escribe `#/reports`. | Menú oculto; al acceder por URL, redirección a dashboard o 403 según implementación. |

---

## 13. Administración (solo MASTER)

**Ruta:** `#/admin`. Subrutas: `#/admin/users`, `#/admin/audit`, `#/admin/metrics`. El menú **Administración** solo es visible para MASTER.

### 13.1 Dashboard Admin (#/admin)

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Acceso MASTER | Login MASTER; clic en Administración. | Tres tarjetas: Usuarios, Auditoría, Métricas; enlaces a cada subsección. |
| Acceso EMPLOYEE | Login EMPLOYEE; no debe verse "Administración". Escribir `#/admin` o `#/admin/users`. | Sin enlace en menú; al poner la URL, redirección a `#/dashboard`. |

### 13.2 Usuarios (#/admin/users)

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Listar usuarios | Ir a Administración > Usuarios. | Tabla con usuarios de la organización (email, rol, estado); filtros por email y rol; paginación. |
| Crear usuario | "Nuevo usuario"; email, contraseña, rol (MASTER/EMPLOYEE). | Usuario creado; lista actualizada. |
| Editar usuario | "Editar" en una fila; cambiar email o rol. | PUT /users/:id; datos actualizados. |
| Cambiar contraseña | "Cambiar contraseña"; contraseña actual y nueva. | PATCH /users/:id/password; mensaje de éxito. |
| Eliminar usuario | "Eliminar"; confirmar. | DELETE /users/:id (204); usuario deja de aparecer o marcado inactivo según API. |

### 13.3 Auditoría (#/admin/audit)

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Listado de auditoría | Filtros: entidad, user_id, from, to, action; paginación. | Tabla con registros de audit_logs; solo MASTER. |
| Paginación | Anterior/Siguiente o números de página. | Cambio de página correcto (GET /reports/audit?page&limit). |

### 13.4 Métricas (#/admin/metrics)

| Qué probar | Cómo | Resultado esperado |
|------------|------|--------------------|
| Ver métricas | Pantalla Métricas. | Tarjetas o tabla con total_requests, total_errors, auth_failures, refresh_failures, scope. |
| Actualizar | Botón "Actualizar". | Nueva petición GET /system/metrics; datos refrescados. |

---

## 14. Comportamiento general (UX Etapa 8)

En la mayoría de listados (Proyectos, Features, Stories, Sprints, Releases, Incidentes, Documentos):

- **Ordenación:** Clic en cabecera de columna para ordenar ascendente/descendente.
- **Filtros:** Selector por estado (y otros si existen); aplicación en cliente o vía API según implementación.
- **Búsqueda:** Campo de texto que filtra en la lista (nombre, título, código, etc.).
- **Paginación:** Controles para cambiar de página (API o cliente).
- **Indicadores de estado:** Badges de color (verde, amarillo, gris, etc.) según estado de la entidad.
- **Carga:** Spinner o indicador mientras se espera respuesta del servidor.
- **Empty state:** Mensaje cuando la lista está vacía o no hay resultados de búsqueda/filtro.
- **Breadcrumbs:** En vistas anidadas (Features, Stories, detalle de Sprints/Releases/Documents) para volver atrás.

---

## 15. Flujos sugeridos para una prueba completa

1. **Login** con MASTER → Dashboard → comprobar que se ven Proyectos, Reportes y Administración.
2. **Proyectos:** Listar → Crear uno nuevo → Ver detalle → Ir a Features de ese proyecto.
3. **Features:** Seleccionar proyecto → Crear feature → Ver Stories de la feature.
4. **Stories:** Crear una story; si aplica, cambiar estado.
5. **Sprints:** Seleccionar proyecto → Crear sprint → Ver detalle.
6. **Releases:** Crear release con versión 1.0.0 (MASTER).
7. **Incidentes:** Seleccionar proyecto → Crear incidente.
8. **Documentos:** Crear documento; ver detalle.
9. **Reportes:** Resumen de un proyecto; listado de auditoría con filtros y paginación.
10. **Administración:** Usuarios → listar, crear usuario EMPLOYEE; Auditoría → filtrar; Métricas → ver y actualizar.
11. **Cerrar sesión** → Login con el EMPLOYEE creado → comprobar que **no** ve Reportes ni Administración; navegar por Proyectos, Features, Stories (solo lectura o acciones permitidas para EMPLOYEE).
12. **Salir** → comprobar que al intentar ir a `#/projects` sin sesión se redirige a login.

---

## 16. Errores y mensajes

- Las respuestas de la API siguen **Response Layer v1** (`success`, `data` o `error`, `meta`). La interfaz debe mostrar mensajes de error al usuario cuando `success === false` (ej. en login, al crear o editar).
- Códigos típicos: `AUTH_INVALID_CREDENTIALS`, `VALIDATION_ERROR`, `NOT_FOUND`, `AUTH_FORBIDDEN` (403), `RESOURCE_OTHER_ORGANIZATION` (acceso a recurso de otra organización en multi-tenant).
- Si una petición devuelve 401 (token expirado), la app puede intentar refresh con el refresh token; si falla, se cierra sesión y se redirige a login.

---

## 17. Referencias

- **API:** `docs/CONTRATO_API.md`, `docs/openapi.yaml`.
- **Despliegue:** `docs/DESPLIEGUE_PRODUCCION.md`.
- **Evidencias de etapas:** `docs/EVIDENCIA_ETAPA_7_*`, `docs/EVIDENCIA_ETAPA_8_*`, `docs/EVIDENCIA_ETAPA_9_*`, `docs/EVIDENCIA_ETAPA_10_*`.

---

*Manual de pruebas para la interfaz web NEXUS DevSuite. Actualizar cuando se añadan nuevas pantallas o flujos.*
