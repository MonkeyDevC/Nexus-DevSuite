# Prompt de implementación — ETAPA 7 Plataforma Web Operativa

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md, docs/CHECKLIST_ETAPAS_PROYECTO.md  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 7 — Plataforma Web Operativa** siguiendo el plan `docs/PLAN_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md`.

**Propósito:** Crear una interfaz web administrativa (HTML5, Bootstrap, JavaScript, Fetch API) que permita operar Nexus DevSuite desde el navegador consumiendo exclusivamente los endpoints existentes del backend bajo `/api/v1`. No se modifican contratos ni rutas del backend; solo se añade la capa de presentación y, si se considera adecuado, el servido de archivos estáticos desde Express.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **No modificar contratos del backend:** Todas las respuestas se consumen tal cual (Response Layer v1: `success`, `data`/`error`, `meta`). No se añaden ni cambian endpoints en esta etapa.
- **No introducir lógica de negocio en el backend** para esta etapa; la autorización y validación siguen en el backend.
- **Token JWT:** Enviar siempre en header `Authorization: Bearer <token>` en todas las peticiones autenticadas; no enviar credenciales ni tokens en la URL.
- **Protección de rutas en cliente:** Cualquier vista distinta de login debe comprobar existencia de token; si no hay token, redirigir a `/login`.
- **Manejo de respuestas:** Interpretar siempre `success` y `data` o `error`; mostrar mensaje al usuario en errores (4xx/5xx o `success === false`).
- **Stack frontend:** HTML5, Bootstrap (v5 recomendada), JavaScript vanilla, Fetch API. No se exige React/Vue/Angular para esta etapa.
- **Cero respuestas 500 en flujos esperados:** El backend no debe degradarse; si se añade servido estático, debe hacerse sin romper rutas ni middlewares existentes.
- **No dejar TODOs críticos** en código entregado (por ejemplo, validaciones mínimas de formularios o manejo de 401).

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Estructura y servido estático

1. Crear carpeta `public/` (o `web/`) en la raíz del proyecto para alojar la interfaz web.
2. Definir punto de entrada único (ej. `index.html`) y estructura de archivos (HTML/CSS/JS). Si se usan múltiples HTML, mantener criterio coherente de navegación (hash o path).
3. **Opcional pero recomendado:** Configurar Express para servir archivos estáticos desde `public/` con `app.use(express.static('public'))`. Orden obligatorio: estáticos **antes** de `app.use(routes)` para que `/api/v1/*` no coincida con estáticos y llegue a las rutas API. Si se usa path-based routing (`/dashboard`, `/projects`) en lugar de hash, añadir fallback que sirva `index.html` para rutas no coincidentes con archivos ni con `/api` (después de express.static, antes de routes); o usar hash routing (`#/dashboard`) para evitar el fallback. Documentar en evidencia la URL base de la interfaz.
4. Definir en el frontend una **base URL** configurable para la API (ej. `/api/v1` para mismo origen, o variable en un único archivo de configuración JS).

### FASE 2 — Autenticación y layout común

5. Implementar pantalla **Login** (`/login` o `#/login`): formulario usuario/contraseña; `POST /api/v1/auth/login`; en éxito guardar `data.accessToken` (y `data.refreshToken` si se usa refresh) en `sessionStorage` o `localStorage` (elegir uno y usarlo en toda la app); redirigir a dashboard.
6. Implementar **guard de rutas:** antes de cargar cualquier vista que no sea login, comprobar existencia de token; si no hay token, redirigir a login. Si se recibe 401 en una petición, opción de intentar refresh con `POST /api/v1/auth/refresh`; si falla, borrar tokens y redirigir a login.
7. Crear **layout común** (cabecera, menú de navegación, pie si aplica). Incluir en todas las vistas protegidas. Obtener rol de usuario con `GET /api/v1/auth/me` (o decodificar JWT en cliente) para mostrar/ocultar enlaces o botones según RBAC (ej. reportes de auditoría y métricas solo para MASTER).
8. Añadir en todas las peticiones autenticadas el header `Authorization: Bearer <accessToken>` (función o módulo común de Fetch recomendado).

### FASE 3 — Pantallas CRUD y operativas

9. **Dashboard** (`/dashboard`): resumen operativo; al menos enlaces a proyectos y a las secciones principales; datos desde API (ej. lista de proyectos con `GET /projects`).
10. **Proyectos** (`/projects`): listar `GET /projects`; detalle `GET /projects/:id`; crear `POST /projects` (MASTER); archivar `PATCH /projects/:id/archive` si aplica. Manejar estados de carga y error.
11. **Features** (`/features`): selector de proyecto; listar `GET /projects/:projectId/features`; detalle y crear/editar según API. Enlace a stories por feature.
12. **Stories** (`/stories`): selector proyecto → feature; listar `GET /features/:featureId/stories`; crear/editar story; cambio de estado si la API lo expone. Manejar carga y error.
13. **Sprints** (`/sprints`): listar por proyecto `GET /projects/:projectId/sprints`; detalle con `GET /sprints/:id`; crear `POST /projects/:projectId/sprints`; asignar/desasignar stories con `POST /sprints/:id/stories/:storyId` y `DELETE /sprints/:id/stories/:storyId`. Ver CONTRATO_API.md / openapi.yaml.
14. **Releases** (`/releases`): listar `GET /releases`; detalle; crear/editar (MASTER). Respetar RBAC en botones.
15. **Incidents** (`/incidents`): listar (por proyecto o según API); crear; ver/editar estado. Pantalla operativa mínima.
16. **Documents** (`/documents`): listar `GET /documents`; ver detalle/versiones; crear documento; flujo de aprobación según API (MASTER).
17. **Reports** (`/reports`): usar **rutas exactas del contrato**: `GET /reports/projects/:projectId/summary`, `GET /reports/sprints/:sprintId/summary`, `GET /reports/users/:userId/activity`, `GET /reports/audit` (solo MASTER). Enlaces o vistas que invoquen estos endpoints y muestren datos.

### FASE 4 — Consistencia y criterios de cierre

18. Asegurar que **todas** las respuestas del backend se tratan según Response Layer v1: leer `success`, `data` o `error`, y `meta` si se usa; mostrar mensajes de error al usuario cuando `success === false` o status 4xx/5xx.
19. Revisar que no queden peticiones sin header `Authorization` en rutas que requieran autenticación (salvo login y, si existe, health).
20. Verificar que la suite de tests del backend sigue en verde (regresión: no cambiar comportamiento de la API).

---

## 4️⃣ REGLAS DE DOMINIO CRÍTICAS

- **RBAC:** El frontend debe ocultar o deshabilitar acciones que el backend restringe por rol (ej. crear proyecto, aprobar documentos, ver auditoría). La fuente de verdad del rol es `GET /api/v1/auth/me` o el payload del JWT. El backend sigue siendo la autoridad; el frontend solo mejora la UX.
- **Response Layer v1:** Toda respuesta de la API tiene la forma `{ success, data?, error?, meta? }`. El frontend no debe asumir otra estructura; los mensajes de error deben mostrarse a partir de `error.message` o equivalente documentado.
- **Sin almacenar contraseña** ni enviarla fuera del flujo de login.

---

## 5️⃣ AUDITORÍA

- No se exige que el frontend registre eventos en `audit_logs`; el backend ya audita las peticiones. La etapa no añade nuevos requisitos de auditoría en backend.

---

## 6️⃣ QA OBLIGATORIA (6 niveles)

- **Funcional:** Login correcto, navegación a todas las pantallas (login, dashboard, projects, features, stories, sprints, releases, incidents, documents, reports); listados y formularios que consumen la API y muestran datos; manejo de carga y error visible.
- **Dominio:** El frontend no debe enviar payloads inválidos conocidos (validación básica de formularios); las reglas de negocio las impone el backend.
- **Negativa:** Credenciales incorrectas → mensaje; acceso sin token → redirección a login; 403 → mensaje o acción no disponible.
- **Regresión:** Tests existentes del backend (suites de integración/contract) siguen en verde; no se modifican contratos ni rutas del backend.
- **Seguridad:** Token solo en header Authorization; no en URL; no almacenar contraseña; no exponer token en logs visibles al usuario.
- **Contrato:** Todas las peticiones y respuestas alineadas con Response Layer v1. **Fuente de verdad de rutas:** CONTRATO_API.md y openapi.yaml (métodos, paths, cuerpos y estructuras de respuesta).

---

## 7️⃣ CRITERIO DE CIERRE

- Interfaz accesible desde navegador (mismo origen o CORS ya configurado en backend).
- Login funcional con JWT; protección de rutas; token enviado en peticiones autenticadas.
- Pantallas mínimas operativas: login, dashboard, projects, features, stories, sprints, releases, incidents, documents, reports.
- Consumo correcto del backend (base URL configurable; uso de Response Layer v1; manejo de errores).
- RBAC respetado en la UI (ocultar/deshabilitar según rol).
- Backend sin cambios de contrato; suite de tests del backend en verde.

---

## 8️⃣ EVIDENCIA OBLIGATORIA

**Entrega en archivo:** `docs/EVIDENCIA_ETAPA_7_PLATAFORMA_WEB_OPERATIVA_<YYYY-MM-DD>.md`

Contenido mínimo:

1. Lista de archivos creados (carpeta `public/` o `web/` y archivos bajo ella) y archivos modificados (ej. `app.js` si se añade servido estático).
2. Descripción breve de la estructura de la interfaz: rutas/pantallas y cómo se resuelven (hash o path).
3. Cómo se configura la base URL de la API y dónde se guarda el token.
4. Confirmación de que las 10 pantallas mínimas están implementadas y consumen el backend.
5. Confirmación de que el backend no ha cambiado contratos ni rutas y que la suite de tests del backend sigue en verde.
6. Capturas o pasos para verificar login, protección de rutas y al menos un flujo CRUD (ej. listar y crear proyecto).
7. Incidencias o limitaciones conocidas (si las hay).
8. Referencia al plan: PLAN_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md.

---

## 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporadas)

| Id | Observación | Aplicación en el prompt |
|----|-------------|-------------------------|
| **O1** | Corregir rutas de Reports | Rutas correctas: `GET /reports/projects/:projectId/summary` (plural), `GET /reports/sprints/:sprintId/summary` (plural), `GET /reports/users/:userId/activity` (userId en path). FASE 3 paso 17 y plan actualizados. |
| **O2** | Fallback SPA para path routing | FASE 1 paso 3: si se usa path-based routing, configurar fallback que sirva `index.html` para rutas no estáticas ni `/api` (después de express.static, antes de routes); o usar hash routing para evitar complejidad. |
| **O3** | Orden de middleware estático | FASE 1 paso 3: `express.static('public')` antes de `app.use(routes)`; así `/api/v1/*` llega a las rutas API. |
| **O4** | Fuente de verdad de rutas | CONTRATO_API.md y openapi.yaml son vinculantes para métodos, paths, cuerpos y respuestas. Plan y prompt referencian el contrato. |
| **O5** | Pantalla Improvements (opcional) | El backend expone `/api/v1/improvements`. Pantalla `/improvements` puede añadirse como opcional en esta etapa o dejarse para Etapa 8. |

**Validación:** APROBADO CON OBSERVACIONES Y CORRECCIONES — SYSTEM ARCHITECT. Ver docs/VALIDACION_ARQUITECTONICA_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md.
