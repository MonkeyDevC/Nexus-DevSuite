# WAVE 2 — Sprints — Evidencia de cierre formal

**Fecha:** 2026-03-27  
**Alcance:** Cierre de observaciones sin reabrir arquitectura ni reimplementar la wave. Documentación contractual, reglas de negocio referenciadas en código, pruebas de integración y E2E mínimo UI.

**Prefijo API:** todas las rutas bajo `GET/POST/...` = **`/api/v1/...`**.

---

## 1. RESULTADO BACKEND / CONTRATOS

### 1.1 Endpoints implementados (montaje)

| Método | Ruta efectiva | Notas |
|--------|---------------|--------|
| GET | `/api/v1/sprints` | Query **`project_id`** obligatorio para listar (`listSprintsRootController`). Equivalente funcional a `GET /api/v1/projects/:projectId/sprints`. |
| POST | `/api/v1/sprints` | Cuerpo con **`project_id`** + datos del sprint (`createSprintRootController`). Paridad: **`POST /api/v1/projects/:projectId/sprints`**. |
| GET | `/api/v1/sprints/:id` | Detalle (`getSprintController`). |
| PUT | `/api/v1/sprints/:id` | Actualización (`putSprintController` → mismo flujo que PATCH). |
| DELETE | `/api/v1/sprints/:id` | Ver §1.3 (`deleteSprintController`). |
| POST | `/api/v1/sprints/:id/start` | Activa a `IN_PROGRESS` (`postStartSprintController`). |
| POST | `/api/v1/sprints/:id/close` | Cierra a `CLOSED` (`postCloseSprintController`). |
| POST | `/api/v1/stories/:id/assign-sprint` | Body `{ "sprint_id": "<uuid>" }` (`postStoryAssignSprintController`). |
| POST | `/api/v1/stories/:id/remove-sprint` | Body vacío; asignación a `null` (`postStoryRemoveSprintController`). |

**Rutas adicionales (fuera del listado mínimo contractual React, legacy/compat):**

- `GET /api/v1/sprints/:id/summary`, `GET /api/v1/sprints/:id/stories`
- `POST/DELETE /api/v1/sprints/:id/stories/:storyId` (asignación vía módulo sprint)

**Referencia:** `src/routes/v1.routes.js` (montaje `/sprints`, `/stories`), `src/modules/sprints/sprint.routes.js`, `src/modules/backlog/stories.routes.js`, `src/modules/backlog/projects.routes.js` (crear/listar por proyecto).

### 1.2 Contrato de éxito (Response Layer v1)

- **Éxito:** `success: true`, `data: <payload>`, `meta` con al menos `request_id` y `timestamp` cuando se usa `buildSuccess()` (`src/shared/responses/responseLayer.js`).
- **Error:** `success: false`, **`data: null`**, `error: { code, message }`, `meta: { request_id, timestamp }`.

### 1.3 DELETE sprint — shape exacto

El controlador fuerza cuerpo explícito (no `data: null`):

```174:183:src/modules/sprints/sprint.controller.js
async function deleteSprintController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await sprintService.deleteSprint(req.params.id, context);
    res.status(200).json({
      success: true,
      data: { id: data.id },
      meta: {}
    });
```

**Éxito DELETE:** `{ "success": true, "data": { "id": "<uuid>" }, "meta": {} }`.

---

## 2. RESULTADO REGLAS DE NEGOCIO

### 2.1 Códigos críticos solicitados

| Código | Comportamiento | Evidencia test / código |
|--------|----------------|-------------------------|
| **SPRINT_ALREADY_ACTIVE** | Segundo `start` con otro sprint ya `IN_PROGRESS` en el mismo proyecto → **409**. | `sprints.negative.test.js` — «Segundo sprint IN_PROGRESS…» |
| **SPRINT_INVALID_STATE** | `DELETE` con sprint no `PLANNED` → **409**. | Mismo archivo — «DELETE sprint IN_PROGRESS…» |
| **SPRINT_HAS_ACTIVE_WORK** | `close` con alguna story del sprint en **IN_PROGRESS** o **BLOCKED** → **409**. | Mismo archivo — «Cerrar sprint con story IN_PROGRESS…» |
| **STORY_ALREADY_IN_SPRINT** | `assign-sprint` cuando la story ya tiene otro sprint → **409**. | Mismo archivo — «Story ya en sprint…» |
| **STORY_NOT_FOUND** | `assign-sprint` con id inexistente → **404**. | Mismo archivo — «assign-sprint con story inexistente…» |
| **SPRINT_CLOSED** | Operaciones sobre sprint cerrado según capa (p. ej. asignación legacy por sprint, o transición desde cerrado). | Tests «Asignar story a sprint CLOSED», «Desasignar story de sprint CLOSED» |
| **remove-sprint idempotente** | `POST .../remove-sprint` sin `sprint_id` en story → **200** reproducible. | Test «POST remove-spring idempotente sin sprint_id» |

### 2.2 Cierre de sprint: DONE vs no-DONE (`sprint_id`)

**Implementación:** tras persistir `status: CLOSED`, se ejecuta actualización masiva solo para stories **no** DONE:

```247:254:src/modules/sprints/sprint.service.js
  if (nextStatus === "CLOSED") {
    const { getModels } = require("../../infrastructure/db/loadModels");
    const { UserStory } = getModels();
    const { Op } = require("sequelize");
    await UserStory.update(
      { sprint_id: null },
      { where: { sprint_id: sprintId, status: { [Op.ne]: "DONE" } } }
    );
```

**Prueba dedicada:** `sprints.negative.test.js` — **«Cerrar sprint: DONE conserva sprint_id; READY pierde sprint_id»**:

- Story A: asignada, flujo hasta **DONE**, al cerrar **`GET /stories/:id` mantiene `sprint_id` igual al sprint.**
- Story B: asignada, permanece **READY**, al cerrar **`sprint_id` es null / vacío.**

---

## 3. RESULTADO E2E / UI

### 3.1 Especificación

- **Archivo:** `tests/e2e/wave2-sprints-closeout.spec.js`
- **Flujo:** login API + sesión en `sessionStorage` → proyecto UI → feature/story **READY** por API → **crear sprint** (editor) → **editar** → **iniciar** (confirmación) → **detalle**: **asignar** historia → comprobar tablero → **quitar** → **cerrar** desde lista → comprobar **COMPLETED** en listado y **CLOSED** en detalle.

### 3.2 Ejecución

```bash
npm run test:e2e:wave2-sprints
```

**Requisito:** frontend en `http://localhost:3000` (o `FRONTEND_URL` / `E2E_FRONTEND_URL`) con API accesible en el mismo origen o configurado como en el resto de E2E.

**Evidencia de corrida (entre sesiones):** `npx playwright test tests/e2e/wave2-sprints-closeout.spec.js --project=chromium` → **1 passed** (ambiente local con servidor activo).

---

## 4. CAMBIOS REALIZADOS (micro-cierre)

| Artefacto | Cambio |
|-----------|--------|
| `src/tests/integration/sprints/sprints.negative.test.js` | +2 tests: **STORY_NOT_FOUND** en `assign-sprint`; **cierre DONE vs READY** en `sprint_id`. |
| `tests/e2e/wave2-sprints-closeout.spec.js` | **Nuevo** — E2E mínimo UI sprint + story. |
| `package.json` | Script **`test:e2e:wave2-sprints`**. |
| `docs/migration/wave2-sprints-evidence.md` | Este documento (cierre formal). |

**Sin** modificaciones a `httpClient`, `tokenStorage`, `refreshManager`, `legacyAdapter`, ni contrato `__nexus`.

---

## 5. VALIDACIÓN FINAL

| Prueba | Comando | Resultado |
|--------|---------|-----------|
| Integración sprints (incl. reglas + cierre `sprint_id`) | `npm test -- --testPathPattern=sprints.negative --runInBand` | **17 passed** |
| E2E WAVE2 sprints | `npm run test:e2e:wave2-sprints` | **OK** (con servidor frontend + API) |

---

## 6. CLASIFICACIÓN FINAL DE WAVE 2

**APROBADO** — Observaciones de cierre cubiertas con:

- inventario explícito de endpoints y contratos;
- DELETE con shape `{ data: { id } }` acotado;
- reglas críticas mapeadas a tests;
- **regla de cierre DONE / no-DONE** verificada en integración;
- **E2E/UI mínimo** ejecutable y documentado.
