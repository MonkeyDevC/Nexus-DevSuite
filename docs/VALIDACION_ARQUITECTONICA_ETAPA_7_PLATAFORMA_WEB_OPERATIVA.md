# Validación arquitectónica — ETAPA 7 Plataforma Web Operativa

**Validador:** SYSTEM ARCHITECT (NEXUS ARCHITECT)  
**Fecha:** 2026-03-05  
**Documentos validados:** `docs/PLAN_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md`  
**Referencia:** nexus-system-architect.mdc, nexus-contexto-arquitectonico.mdc

---

## I. Resultado de la validación

**ESTADO: APROBADO CON OBSERVACIONES Y CORRECCIONES**

La etapa 7 introduce una **capa de presentación web** sin modificar el backend (salvo servido estático opcional). Respeta Response Layer v1, RBAC y la arquitectura existente. Se identifican correcciones en las rutas de la API documentadas en el plan y observaciones para la implementación.

---

## II. Naturaleza de la etapa

| Aspecto | Etapa 7 | Estado |
|---------|---------|--------|
| Modificación del backend | No (contratos, rutas, lógica) | OK |
| Nuevas entidades/migraciones | No | OK |
| Servido estático (opcional) | express.static('public') | OK |
| Frontend | HTML5, Bootstrap, JS vanilla, Fetch API | OK |
| Consumo de API | Response Layer v1, endpoints existentes | OK |

**Evidencia:** El plan es explícito: "No se modifica la API ni el backend en esta etapa; solo se añade una capa de presentación web."

---

## III. Validación de impacto en backend

### 3.1 Principios arquitectónicos

| Principio | Estado |
|-----------|--------|
| Arquitectura controller → service → repository | OK — Sin cambios |
| Response Layer v1 | OK — Frontend se adapta al contrato |
| RBAC | OK — Backend sigue siendo autoridad |
| Migraciones | OK — Sin cambios |
| Auditoría | OK — Backend ya audita; frontend no añade requisitos |

### 3.2 Servido estático (opcional)

Si se implementa `express.static('public')`:

| Requisito | Implementación | Estado |
|-----------|----------------|--------|
| Orden de middlewares | Estáticos **antes** de `app.use(routes)` para que rutas API tengan prioridad | OK |
| Rutas API intactas | `/api/v1/*` debe seguir respondiendo correctamente | OK |
| Fallback SPA (si path routing) | Si se usa `/dashboard` en lugar de `#/dashboard`, se necesita fallback a `index.html` para rutas no estáticas | Observación O2 |

**Orden recomendado en app.js:**
1. Middlewares existentes (helmet, cors, json, requestContext, etc.)
2. `app.use(express.static('public'))` — sirve archivos estáticos
3. `app.use(routes)` — rutas API en `/api/v1`
4. `notFoundMiddleware`, `errorHandlerMiddleware`

Con hash routing (`#/dashboard`), el navegador solicita `/` y el hash es cliente-side; no se requiere fallback. Con path routing, sí.

---

## IV. Correcciones de rutas de API en el plan

El plan (sección 5) contiene **errores en las rutas de Reports**. Las rutas reales del backend son:

| Plan (incorrecto) | API real (correcto) |
|-------------------|----------------------|
| `GET /reports/project/:projectId/summary` | `GET /reports/projects/:projectId/summary` |
| `GET /reports/sprint/:sprintId/summary` | `GET /reports/sprints/:sprintId/summary` |
| `GET /reports/user-activity` | `GET /reports/users/:userId/activity` |

**Acción obligatoria:** Corregir el plan y el prompt antes de la implementación. El MASTER DEVELOPER debe usar las rutas reales documentadas en CONTRATO_API.md / OpenAPI.

### 4.2 Rutas de Sprints

| Plan | API real |
|------|----------|
| `GET /projects/:projectId/sprints/:sprintId` | No existe. Usar `GET /sprints/:id` para detalle de sprint |

Listar sprints: `GET /projects/:projectId/sprints`  
Crear sprint: `POST /projects/:projectId/sprints`  
Detalle sprint: `GET /sprints/:id`  
Asignar/desasignar stories: `POST /sprints/:id/stories/:storyId`, `DELETE /sprints/:id/stories/:storyId`

---

## V. Validación de principios del frontend

| Principio | Plan | Estado |
|-----------|------|--------|
| Response Layer v1 | Interpretar `success`, `data`/`error`, `meta` | OK |
| Token en header | `Authorization: Bearer <token>`; no en URL | OK |
| Protección de rutas | Comprobar token antes de vistas protegidas | OK |
| RBAC en UI | Ocultar/deshabilitar según rol; backend es autoridad | OK |
| Sin almacenar contraseña | Solo en flujo de login | OK |
| Base URL configurable | Variable para API | OK |

---

## VI. Estructura de pantallas y endpoints

Las 10 pantallas mínimas están definidas. El plan referencia endpoints que en su mayoría existen. Resumen verificado:

| Pantalla | Endpoints principales | Estado |
|----------|-----------------------|--------|
| Login | POST /auth/login | OK |
| Dashboard | GET /projects | OK |
| Projects | GET /projects, GET /projects/:id, POST /projects, PATCH /projects/:id/archive | OK |
| Features | GET /projects/:projectId/features, GET /features/:id, POST /projects/:projectId/features, PATCH /features/:id/status | OK |
| Stories | GET /features/:featureId/stories, GET /stories/:id, POST /features/:featureId/stories, PATCH /stories/:id/status, PATCH /stories/:id/assign | OK |
| Sprints | GET /projects/:projectId/sprints, GET /sprints/:id, POST /projects/:projectId/sprints, PATCH /sprints/:id/status, POST/DELETE /sprints/:id/stories/:storyId | OK |
| Releases | GET /releases, GET /releases/:id, POST /releases, PATCH /releases/:id | OK |
| Incidents | GET /projects/:projectId/incidents, POST /projects/:projectId/incidents, PATCH /incidents/:id | OK |
| Documents | GET /documents, GET /documents/:id, POST /documents, flujo versiones | OK |
| Reports | GET /reports/projects/:projectId/summary, GET /reports/sprints/:sprintId/summary, GET /reports/users/:userId/activity, GET /reports/audit | OK (tras corrección) |

**Nota:** El backend tiene módulo **Improvements**. El plan no incluye pantalla `/improvements`. Puede dejarse para Etapa 8 o añadirse como opcional en esta etapa.

---

## VII. Observaciones para el MASTER DEVELOPER

### O1. Corregir rutas de Reports en documentación

Actualizar el plan y el prompt con las rutas correctas:
- `GET /reports/projects/:projectId/summary` (plural)
- `GET /reports/sprints/:sprintId/summary` (plural)
- `GET /reports/users/:userId/activity` (con userId en path)

### O2. Fallback SPA para path routing

Si se usa path-based routing (`/dashboard`, `/projects`) en lugar de hash (`#/dashboard`), configurar un fallback que sirva `index.html` para rutas no coincidentes con archivos estáticos ni con `/api`. Colocarlo **después** de `express.static` y **antes** de `notFoundMiddleware`, excluyendo `/api`:

```js
// Después de express.static, antes de routes
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
```

O usar hash routing para evitar esta complejidad en esta etapa.

### O3. Orden de middleware estático

El prompt indica "Colocar el middleware de estáticos **antes** de `app.use(routes)`". En `app.js` actual, `routes` incluye `/api/v1`. El orden correcto es: `express.static('public')` antes de `app.use(routes)`. Así, `/api/v1/*` no coincide con estáticos y llega a las rutas API.

### O4. Referencia a CONTRATO_API.md / OpenAPI

El MASTER DEVELOPER debe usar CONTRATO_API.md o openapi.yaml como fuente de verdad para rutas, métodos, cuerpos de petición y estructuras de respuesta. El plan es guía; el contrato es vinculante.

### O5. Pantalla Improvements (opcional)

El backend expone `/improvements`. Si el alcance lo permite, considerar una pantalla mínima `/improvements` o dejarla explícitamente para Etapa 8.

---

## VIII. Criterios de bloqueo — No aplicados

No se detectan:

- Modificación de contratos del backend
- Introducción de lógica de negocio en backend
- Rompimiento del Response Layer
- Violación de RBAC
- Cambios en migraciones o loadModels

---

## IX. Evidencia de validación

| Elemento | Confirmado |
|----------|------------|
| Backend sin cambios de contrato | Sí |
| Response Layer v1 respetado | Sí |
| Servido estático compatible con arquitectura | Sí |
| Rutas de API verificadas (con correcciones) | Sí |

---

## X. Conclusión

**La ETAPA 7 — Plataforma Web Operativa está APROBADA para implementación** por el MASTER DEVELOPER, **tras incorporar las correcciones de rutas** (sección IV) en el plan y el prompt.

Las observaciones O1–O5 deben incorporarse antes de enviar el prompt al MASTER DEVELOPER.

**Firma de validación:** SYSTEM ARCHITECT (NEXUS ARCHITECT) — 2026-03-05
