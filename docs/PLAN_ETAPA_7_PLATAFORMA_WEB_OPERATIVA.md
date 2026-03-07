# Plan ETAPA 7 — Plataforma Web Operativa

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase de evolución del producto)  
**Objetivo:** Crear una interfaz web administrativa que permita operar Nexus DevSuite desde navegador consumiendo el backend existente.  
**Estado:** Diseñado por PO MASTER — pendiente validación SYSTEM ARCHITECT

---

## 1. Contexto

- **Situación actual:** El backend (Etapas 0–6) está completo: autenticación JWT, RBAC, Response Layer v1, auditoría, proyectos, backlog, sprints, releases, change requests, incidentes, sistema documental, reportes y métricas. No se modifica la API ni el backend en esta etapa; solo se añade una capa de presentación web.
- **Objetivo de la etapa:** Ofrecer una interfaz web (HTML5 + Bootstrap + JavaScript + Fetch API) que consuma los endpoints existentes bajo `/api/v1`, con login por JWT, protección de rutas en cliente y pantallas mínimas para operar el sistema.
- **Principios:** No romper Response Layer v1; el frontend debe interpretar `success`, `data`/`error` y `meta` de todas las respuestas. Respetar RBAC (ocultar o deshabilitar acciones según rol; la autorización real la hace el backend).

---

## 2. Stack y restricciones

| Elemento | Especificación |
|----------|----------------|
| **Frontend** | HTML5, CSS (Bootstrap 5), JavaScript vanilla |
| **Comunicación con backend** | Fetch API; base URL configurable (ej. `/api/v1` mismo origen o variable de entorno) |
| **Almacenamiento de sesión** | Token JWT en `sessionStorage` o `localStorage`; criterio único en toda la app |
| **Backend** | Sin cambios en contratos ni rutas; opcional: servir estáticos desde Express (ej. `public/` o `web/`) para despliegue unificado |
| **Sin frameworks SPA obligatorios** | React/Vue/Angular no son obligatorios para esta etapa; se prioriza simplicidad y cumplimiento de criterios |

---

## 3. Estructura del frontend

- **Ubicación recomendada:** Carpeta `public/` en la raíz del proyecto (o `web/`), de modo que el backend pueda servir la SPA/HTML estático en producción (ej. `express.static('public')`).
- **Punto de entrada:** Un `index.html` que, según ruta (hash o path), cargue la vista correspondiente (multipágina con navegación o SPA mínima con un único HTML y contenido dinámico).
- **Navegación:** Rutas de cliente mínimas: `/login`, `/dashboard`, `/projects`, `/features`, `/stories`, `/sprints`, `/releases`, `/incidents`, `/documents`, `/reports`. La implementación puede usar hash (`#/projects`) o rutas reales si el servidor está configurado para fallback a `index.html`.

---

## 4. Autenticación y protección de rutas

1. **Login:** Formulario que envía credenciales a `POST /api/v1/auth/login`. En respuesta exitosa (`success === true`), guardar `data.accessToken` (y opcionalmente `data.refreshToken`) y redirigir a `/dashboard`.
2. **Token en peticiones:** Todas las peticiones a `/api/v1/*` (salvo login y posiblemente health) deben incluir header `Authorization: Bearer <accessToken>`.
3. **Refresh (opcional pero recomendado):** Si el backend devuelve 401, intentar `POST /api/v1/auth/refresh` con `refreshToken`; si falla, borrar tokens y redirigir a `/login`.
4. **Protección de rutas:** Antes de mostrar cualquier vista distinta de `/login`, comprobar existencia de token; si no hay token válido, redirigir a `/login`.
5. **Rol del usuario:** Obtener rol desde `GET /api/v1/auth/me` (o desde payload JWT si se decodifica en cliente) para mostrar/ocultar acciones según RBAC (ej. solo MASTER ve ciertos botones; el backend sigue siendo la autoridad).

---

## 5. Endpoints del backend a consumir (referencia)

| Área | Endpoints relevantes (base `/api/v1`) |
|------|----------------------------------------|
| **Auth** | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| **Proyectos** | `GET /projects`, `GET /projects/:id`, `POST /projects`, `PATCH /projects/:id/archive` |
| **Features** | `GET /projects/:projectId/features`, `GET /features/:id`, `POST /projects/:projectId/features`, `PATCH /features/:id` |
| **Stories** | `GET /features/:featureId/stories`, `GET /stories/:id`, `POST /features/:featureId/stories`, `PATCH /stories/:id`, `PATCH /stories/:id/status` |
| **Sprints** | `GET /projects/:projectId/sprints`, `GET /sprints/:id` (detalle), `POST /projects/:projectId/sprints`, `PATCH /sprints/:id`, `POST /sprints/:id/stories/:storyId`, `DELETE /sprints/:id/stories/:storyId` |
| **Releases** | `GET /releases`, `GET /releases/:id`, `POST /releases`, `PATCH /releases/:id` (MASTER) |
| **Change Requests** | `GET /change-requests`, `POST /change-requests`, `PATCH /change-requests/:id` (transiciones) |
| **Incidents** | `GET /projects/:projectId/incidents`, `POST /projects/:projectId/incidents`, `PATCH /incidents/:id` |
| **Documents** | `GET /documents`, `GET /documents/:id`, `POST /documents`, flujo de versiones según API existente |
| **Reports** | `GET /reports/projects/:projectId/summary`, `GET /reports/sprints/:sprintId/summary`, `GET /reports/users/:userId/activity`, `GET /reports/audit` (MASTER) |

**Fuente de verdad:** CONTRATO_API.md y openapi.yaml. El frontend debe usar exactamente estas rutas.

Todas las respuestas siguen Response Layer v1: `{ success, data | error, meta }`. El frontend debe leer siempre `success` y `data` o `error` y mostrar mensajes de error al usuario cuando `success === false`.

---

## 6. Pantallas mínimas y alcance

| Ruta | Nombre | Contenido mínimo |
|------|--------|-------------------|
| `/login` | Login | Formulario usuario/contraseña; llamada a `POST /auth/login`; redirección a dashboard si OK. |
| `/dashboard` | Dashboard | Resumen operativo: enlaces a proyectos, sprints recientes o métricas básicas (datos desde API que existan, ej. lista de proyectos). |
| `/projects` | Proyectos | Listar proyectos (`GET /projects`); enlace a detalle; crear proyecto (MASTER); archivar si aplica. |
| `/features` | Features | Listar features por proyecto (selector de proyecto + `GET /projects/:id/features`); enlace a stories; crear/editar feature. |
| `/stories` | User Stories | Listar stories por feature (proyecto → feature + `GET /features/:id/stories`); crear/editar story; cambiar estado si la API lo expone. |
| `/sprints` | Sprints | Listar sprints por proyecto; crear sprint; ver detalle; asignar/desasignar stories según API. |
| `/releases` | Releases | Listar releases; ver detalle; crear/editar (MASTER). |
| `/incidents` | Incidentes | Listar incidentes (por proyecto o global según API); crear; ver/editar estado. |
| `/documents` | Documentos | Listar documentos; ver detalle/versiones; crear documento; flujo de aprobación según API (MASTER). |
| `/reports` | Reportes | Enlaces o vistas: `GET /reports/projects/:projectId/summary`, `GET /reports/sprints/:sprintId/summary`, `GET /reports/users/:userId/activity`, `GET /reports/audit` (solo MASTER). |

Cada pantalla debe manejar estados de carga y error (mensaje al usuario cuando la API devuelve error o red falla).

---

## 7. Criterios de aceptación (resumen)

- Login funcional con JWT: guardar token, enviarlo en peticiones, redirigir a login si no hay sesión.
- Protección de rutas: no acceder a vistas protegidas sin token válido (redirección a `/login`).
- Consumo correcto del backend: base URL configurable; uso de Response Layer v1 (`success`, `data`/`error`, `meta`); manejo de 401/403/4xx/5xx con mensaje al usuario.
- No romper Response Layer v1: el backend no se altera; el frontend se adapta al contrato existente.
- Respeto de RBAC: acciones restringidas a MASTER solo visibles/habilitadas para MASTER (obtenido por `/auth/me` o token); el backend sigue siendo la autoridad.
- Pantallas mínimas implementadas: login, dashboard, projects, features, stories, sprints, releases, incidents, documents, reports.
- Opcional: backend sirve la interfaz estática desde `public/` (o equivalente) para despliegue en un solo origen.

---

## 8. QA (6 niveles) — aplicación a la etapa

| Nivel | Criterio para ETAPA 7 |
|-------|------------------------|
| **Funcional** | Login, navegación a todas las pantallas, listados y formularios que consumen la API y muestran datos correctos. |
| **Dominio** | Transiciones y reglas de negocio las impone el backend; el frontend no debe permitir enviar datos inválidos conocidos (validación básica de formularios). |
| **Negativa** | Credenciales incorrectas → mensaje; sin token → redirección a login; 403 → mensaje o ocultar acción. |
| **Regresión** | No modificar contratos del backend; tests de API existentes siguen en verde. |
| **Seguridad** | Token no expuesto en URLs; envío solo por header Authorization; no almacenar contraseña. |
| **Contrato** | Todas las peticiones y respuestas alineadas con Response Layer v1 y con los endpoints documentados. |

---

## 9. Evidencia y documentación

- Listado de archivos creados/modificados (carpeta `public/` o `web/`, y cambios en `app.js` si se sirven estáticos).
- Descripción breve de la estructura de la interfaz (páginas, rutas, uso de token).
- Confirmación de que las pantallas mínimas están operativas y consumen el backend sin alterar la API.
- Si se añade servido estático: ruta desde la que se sirve (ej. `/` o `/app`) y que el backend sigue respondiendo en `/api/v1`.

---

## 10. No incluido en esta etapa

- UX avanzada (tablas dinámicas, filtros, paginación): ETAPA 8.
- Panel administrativo (gestión de usuarios/roles, auditoría visual, métricas): ETAPA 9.
- Multi-tenant y preparación SaaS: ETAPA 10.

---

*Documento de diseño ETAPA 7 — Plataforma Web Operativa. Aprobación pendiente: SYSTEM ARCHITECT.*
