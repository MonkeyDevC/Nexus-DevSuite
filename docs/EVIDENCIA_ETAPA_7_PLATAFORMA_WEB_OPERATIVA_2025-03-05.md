# Evidencia de implementación — ETAPA 7 Plataforma Web Operativa

**Documento:** Evidencia de cierre ETAPA 7  
**Nombre de etapa:** ETAPA 7 — Plataforma Web Operativa  
**Fecha de generación:** 2025-03-05  
**Referencia:** docs/PLAN_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md

---

## 1. Archivos creados

### Carpeta public/

| Archivo | Descripción |
|---------|-------------|
| `public/index.html` | Punto de entrada único; nav común; contenedor `#content`; carga Bootstrap 5 y todos los scripts (config, api, auth, layout, router, vistas). |
| `public/js/config.js` | `APP_CONFIG.API_BASE = "/api/v1"` (configurable). |
| `public/js/api.js` | getToken, getRefreshToken, setTokens, clearTokens (sessionStorage); fetchApi (Authorization Bearer, Response Layer v1, reintento con refresh en 401). |
| `public/js/auth.js` | redirectToLogin, requireAuth, getMe, clearUser, logout (POST /auth/logout + clearTokens + redirect). |
| `public/js/layout.js` | showNav (muestra nav, usuario, enlace Reportes solo si MASTER), hideNav, setContent, showError, showLoading. |
| `public/js/router.js` | Navegación por hash (#/login, #/dashboard, #/projects, …); getHashPath, getHashSegments; registerView; requireAuth antes de vistas protegidas. |
| `public/js/views/login.js` | Formulario email/password; POST /auth/login; setTokens(data.access_token, data.refresh_token); redirección a #/dashboard; mensaje de error si success === false. |
| `public/js/views/dashboard.js` | GET /projects; lista de proyectos y enlaces a #/projects, #/features, #/sprints, #/releases. |
| `public/js/views/projects.js` | Lista GET /projects; detalle GET /projects/:id; crear POST /projects y archivar PATCH /projects/:id/archive (solo MASTER). |
| `public/js/views/features.js` | Selector de proyecto; GET /projects/:projectId/features; enlaces a stories por feature. |
| `public/js/views/stories.js` | Selector proyecto → feature; GET /features/:featureId/stories; listado de stories. |
| `public/js/views/sprints.js` | Selector proyecto; GET /projects/:projectId/sprints; detalle GET /sprints/:id; crear POST /projects/:projectId/sprints (MASTER). |
| `public/js/views/releases.js` | GET /releases; detalle GET /releases/:id; crear POST /releases (MASTER). |
| `public/js/views/incidents.js` | Selector proyecto; GET/POST /projects/:projectId/incidents; listado y nuevo incidente. |
| `public/js/views/documents.js` | GET /documents; detalle GET /documents/:id; crear POST /documents. |
| `public/js/views/reports.js` | Resumen proyecto GET /reports/projects/:projectId/summary; listado auditoría GET /reports/audit (solo MASTER). |

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/app.js` | `app.use(express.static("public"))` **antes** de `app.use(routes)` para servir la interfaz desde `/` y no interferir con `/api/v1/*`. |

No se modificaron contratos ni rutas del backend; no se añadieron endpoints.

---

## 3. Estructura de la interfaz y rutas

- **Resolución de rutas:** Hash-based: `#/login`, `#/dashboard`, `#/projects`, `#/projects/:id`, `#/features`, `#/stories`, `#/sprints`, `#/sprints/:id`, `#/releases`, `#/releases/:id`, `#/incidents`, `#/documents`, `#/documents/:id`, `#/reports`. No se usa path-based routing; no se requiere fallback SPA en Express.
- **URL base de la interfaz:** Con el servidor en marcha, la interfaz se sirve en la raíz del mismo origen (ej. `http://localhost:3000/`). El usuario abre `/` y carga `index.html`; la navegación es por hash.
- **Layout común:** Navbar (Dashboard, Proyectos, Features, Stories, Sprints, Releases, Incidentes, Documentos, Reportes solo MASTER), email y rol del usuario, botón Salir. El nav se oculta en login.

---

## 4. Base URL de la API y almacenamiento del token

- **Base URL:** Definida en `public/js/config.js` como `window.APP_CONFIG.API_BASE = "/api/v1"`. Todas las llamadas usan esta base (mismo origen).
- **Token:** Se guarda en **sessionStorage** (claves `nexus_access_token`, `nexus_refresh_token`). No se envía nunca en la URL; en peticiones autenticadas se usa el header `Authorization: Bearer <accessToken>`. En 401 se intenta refresh con `POST /auth/refresh`; si falla, se borran tokens y se redirige a `#/login`.

---

## 5. Pantallas mínimas implementadas

| Pantalla | Ruta hash | Consumo backend |
|----------|-----------|------------------|
| Login | #/login | POST /auth/login |
| Dashboard | #/dashboard | GET /projects |
| Proyectos | #/projects, #/projects/:id | GET /projects, GET /projects/:id, POST /projects, PATCH /projects/:id/archive |
| Features | #/features | GET /projects, GET /projects/:projectId/features |
| Stories | #/stories | GET /projects, GET /projects/:id/features, GET /features/:featureId/stories |
| Sprints | #/sprints, #/sprints/:id | GET /projects/:projectId/sprints, GET /sprints/:id, POST /projects/:projectId/sprints |
| Releases | #/releases, #/releases/:id | GET /releases, GET /releases/:id, POST /releases |
| Incidentes | #/incidents | GET /projects/:projectId/incidents, POST /projects/:projectId/incidents |
| Documentos | #/documents, #/documents/:id | GET /documents, GET /documents/:id, POST /documents |
| Reportes | #/reports | GET /reports/projects/:projectId/summary, GET /reports/audit (MASTER) |

Todas interpretan Response Layer v1 (`success`, `data`/`error`, `meta`) y muestran mensajes de error al usuario cuando `success === false` o hay fallo de red.

---

## 6. Backend sin cambios de contrato y regresión

- No se ha modificado ningún contrato ni ruta del backend. Solo se añadió `express.static("public")` en `app.js` antes de `app.use(routes)`.
- **Regresión:** Ejecutadas las suites `quality.structural` y `reports.negative`: 11 tests en verde. La API sigue respondiendo en `/api/v1/*` con el mismo comportamiento.

---

## 7. Verificación manual sugerida

1. **Login:** Abrir `http://localhost:3000/`, ir a #/login (o ser redirigido si no hay token), introducir credenciales válidas → debe guardar token y redirigir a #/dashboard.
2. **Protección de rutas:** Borrar token (o abrir en ventana privada), intentar acceder a #/dashboard → debe redirigir a #/login.
3. **Flujo CRUD proyecto (MASTER):** Con usuario MASTER, #/projects → "Nuevo proyecto" → nombre y descripción → debe aparecer en la lista; entrar al detalle y "Archivar" si aplica.
4. **RBAC:** Con usuario EMPLOYEE, no debe mostrarse el enlace "Reportes" en la barra; GET /reports/audit devuelve 403. Con MASTER, "Reportes" visible y "Ver listado auditoría" operativo.

---

## 8. Incidencias o limitaciones conocidas

- **Mejoras (Improvements):** El backend expone `/api/v1/improvements`; la pantalla "Mejoras" no está implementada en esta etapa (opcional según plan).
- **Validación de formularios:** Validación básica en cliente (campos obligatorios); la validación de negocio y autorización es del backend.
- **Paginación:** Los listados consumen la API con page/limit por defecto; no se implementa paginación avanzada en la UI en esta etapa.

---

**Referencia al plan:** docs/PLAN_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md
