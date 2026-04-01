# WAVE 4 — Releases — Evidencia de migración

**Fecha:** 2026-03-27  
**Alcance:** dominio Releases + relación canónica `user_stories.release_id`; frontend React vía `shared/http` únicamente.

## 1. Resumen de cambios

- **DB:** `releases.name` (NOT NULL); `user_stories.release_id` (nullable, FK a `releases`). `features.release_id` **no** se eliminó (legacy lectura / saneamiento en DELETE).
- **Canónico WAVE 4:** nuevas asignaciones de historias a release escriben solo `user_stories.release_id`; no se escribe `features.release_id` en assign de historia.
- **Workflow:** `PLANNED → IN_PROGRESS → RELEASED`; `RELEASED` terminal para transiciones de negocio WAVE 4; publicación exige al menos una historia con `release_id` (no solo conteo legacy por features).
- **Change requests:** `POST /releases/:id/start` y `POST /releases/:id/release` exigen `body.change_request_id` (CR existente, `APPROVED`, vinculado a la release).
- **DELETE:** solo si `status === PLANNED`; respuesta `{ success: true, data: { id }, meta: {} }`.
- **DTO:** `release_date` alias de `released_at`; detalle incluye `stories` (vía `user_stories.release_id` + `project_id` desde feature).
- **Versión:** validación por trim / no vacío / longitud razonable; unicidad global de `version` (sin SemVer estricto en create/update).
- **Frontend:** módulo `frontend-react/src/modules/releases/`; páginas `Releases.jsx`, `ReleaseDetail.jsx`, `ReleaseEditor.jsx`; rutas `/releases/new` y `/releases/:id/edit`. Aviso “huérfano” solo si la release ya tiene features/stories pero ninguna pertenece al proyecto de la URL (releases vacías siguen siendo editables en contexto de proyecto).

## 2. Endpoints implementados / ajustados

| Método | Ruta | Notas |
|--------|------|--------|
| POST | `/api/v1/releases` | `name`, `version` obligatorios |
| GET | `/api/v1/releases` | Lista paginada |
| GET | `/api/v1/releases/:id` | Incluye `features` (legacy), `stories` (canónico), `release_date` |
| PUT | `/api/v1/releases/:id` | Actualización; bloqueado si `RELEASED` (`RELEASE_FROZEN`) |
| PATCH | `/api/v1/releases/:id` | Restricciones según validadores (p. ej. no `name`/`version` si aplica) |
| POST | `/api/v1/releases/:id/start` | Body: `{ change_request_id }` |
| POST | `/api/v1/releases/:id/release` | Body: `{ change_request_id }`; `released_at`; valida `RELEASE_EMPTY` |
| DELETE | `/api/v1/releases/:id` | Solo `PLANNED`; limpia `user_stories.release_id` y `features.release_id` asociados |
| POST | `/api/v1/stories/:id/assign-release` | Body: `{ release_id }`; idempotente misma release |
| POST | `/api/v1/stories/:id/remove-release` | Idempotente si ya sin release |

*(Rutas legacy de asignación de features a release pueden seguir existiendo; WAVE 4 no las usa para la asignación canónica de historias.)*

## 3. Contratos (Response Layer)

- Éxito: `{ success: true, data, meta }`.
- Error: `{ success: false, code, message, details }` (vía capa estándar del proyecto).
- DELETE exitoso: `data: { id }`, `meta: {}`.

## 4. Códigos de error relevantes

- `RELEASE_FROZEN` — release `RELEASED`: sin PUT/PATCH de negocio, sin assign/remove de historia.
- `RELEASE_EMPTY` — publicar sin historias con `release_id`.
- `RELEASE_INVALID_STATE` — p. ej. DELETE fuera de `PLANNED`.
- `RELEASE_INVALID_TRANSITION` — transición no permitida (incl. salida desde `RELEASED`).
- `STORY_ALREADY_IN_RELEASE` — historia ya en otra release.
- `CHANGE_REQUEST_*` — validación/consumo de CR en start/release.

## 5. Migración Sequelize

- Archivo: `src/infrastructure/db/migrations/20260328120000-wave4-releases-name-story-release-id.js`
- Idempotencia: comprobación de columnas / índice donde aplica para re-ejecución segura.

## 6. Convivencia legacy `features.release_id` vs canónico

- **`user_stories.release_id`:** fuente canónica WAVE 4 para asignación de historias a releases.
- **`features.release_id`:** permanece en esquema; puede seguir usándose en lecturas o rutas antiguas; **no** debe poblarse en nuevos flujos de negocio WAVE 4 al asignar historias. El DELETE de release puede limpiar ambas para consistencia de datos huérfanos.

## 7. Breaking notes

- Transiciones directas que saltaban el flujo (p. ej. expectativas antiguas SemVer o `PLANNED → RELEASED` sin pasos) deben alinearse al workflow y a CR donde aplique.
- Pruebas que necesitaban estado `ARCHIVED` sin transición API: pueden usar actualización directa en DB en entorno de test (documentado en suites ajustadas).
- E2E React depende del **bundle** servido (`frontend-react` build → `public/react-app`). Tras cambios en rutas o páginas, ejecutar `npm run build` en `frontend-react` antes de Playwright contra `localhost:3000`.

## 8. Auditoría final de endurecimiento (2026-03-27)

### 8.1 Decisión de cierre

**CLOSED WITH NOTES** — Los criterios de aceptación del dominio Releases WAVE 4 quedan cubiertos por código + pruebas de integración referenciadas abajo. Se documenta un hallazgo **mayor** en consumidores que aún razonan solo con `features.release_id` para reglas transversales (no bloquea la entrega WAVE 4 si se acepta deuda explícita; sí requiere seguimiento).

### 8.2 Tabla criterios de aceptación → evidencia

| Criterio | Evidencia |
|----------|-----------|
| `releases.name` + `user_stories.release_id` en DB | Migración `src/infrastructure/db/migrations/20260328120000-wave4-releases-name-story-release-id.js`; modelo `src/modules/releases/models/release.model.js`; `src/modules/backlog/models/userStory.model.js` |
| Fuente canónica `user_stories.release_id` en asignación de historias | `assignStoryToRelease` en `src/modules/releases/release.service.js` (actualiza story, no feature) |
| Sin escritura `features.release_id` en assign historia WAVE 4 | Misma función; contraste con `assignFeatureToRelease` (ruta legacy explícita) |
| `PUT /releases/:id`, start/release con CR | Rutas/controladores `src/modules/releases/release.routes.js`, `release.controller.js`; tests en `releases.wave4.integration.test.js` |
| `POST …/assign-release`, `…/remove-release` | `backlog.controller.js` + `release.service.js`; tests idempotencia + `STORY_ALREADY_IN_RELEASE` |
| `RELEASED` terminal + `RELEASE_FROZEN` | `assertReleaseNotFrozen`, workflow; tests `RELEASE_FROZEN`, `RELEASE_INVALID_TRANSITION` |
| DELETE solo `PLANNED` + shape exacto | `deleteReleaseController` → `res.status(200).json({ success: true, data: { id: data.id }, meta: {} })`; test `toEqual` |
| `release_date` + detalle con `stories` | `toPlain` + `getReleaseById` (`UserStory.findAll({ where: { release_id: id } })`); test “get detail incluye stories y release_date” |
| React sin `fetch` en módulo Releases | `rg 'fetch\\(' frontend-react/src/modules/releases` → 0; páginas `*Release*` → 0; uso de `shared/http` en `releasesService.js` |
| Cobertura QA | `src/tests/integration/releases/releases.wave4.integration.test.js` + suites `releases.negative.test.js`, `releases.hotfix.test.js` |

### 8.3 Contratos JSON de ejemplo

**DELETE exitoso (forma exacta verificada en test)**

```json
{
  "success": true,
  "data": { "id": "8dfbaf35-e7c0-4fd4-a3e0-9341ce941cbe" },
  "meta": {}
}
```

**GET `/api/v1/releases/:id` (éxito, fragmento)**

```json
{
  "success": true,
  "data": {
    "id": "…",
    "name": "Wave4 Alpha",
    "version": "1.2.3",
    "status": "PLANNED",
    "released_at": null,
    "release_date": null,
    "stories": [],
    "features": []
  },
  "meta": { "request_id": "…" }
}
```

**Error validación sin `change_request_id` en start**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de entrada invalidos",
    "details": [{ "path": "change_request_id", "msg": "change_request_id es obligatorio en body" }]
  }
}
```

**Error `RELEASE_EMPTY`**

```json
{
  "success": false,
  "error": {
    "code": "RELEASE_EMPTY",
    "message": "No se puede publicar una release sin stories asociadas"
  }
}
```

### 8.4 Puntos blindados — referencias de código / tests

| Punto | Referencia |
|-------|------------|
| DELETE body exacto `{ success, data: { id }, meta: {} }` | `release.controller.js` `deleteReleaseController`; test `expect(del.body).toEqual({ success: true, data: { id: rid }, meta: {} })` en `releases.wave4.integration.test.js` L147–L156 |
| `assign-release` idempotente (misma release) | Doble `POST …/assign-release` con mismo `release_id` → ambos `200` L198–L207 |
| `remove-release` idempotente | Doble `POST …/remove-release` → ambos `200` L214–L223 |
| `STORY_ALREADY_IN_RELEASE` | Tercer assign a release B → `400` + código L208–L213 |
| `RELEASE_INVALID_TRANSITION` desde `RELEASED` | `PATCH …/status` a `IN_PROGRESS` tras publicar → `400` `RELEASE_INVALID_TRANSITION` L301–L343 |
| `RELEASE_EMPTY` al publicar sin stories | `POST …/release` con CR tras start, sin stories → `400` `RELEASE_EMPTY` L226–L246 |
| `getReleaseById` stories por `user_stories.release_id` | `release.service.js` `UserStory.findAll({ where: { release_id: id }, … })` L150–L168 |
| Sin `fetch` en módulo/páginas Releases | Búsqueda en repo sobre `frontend-react/src/modules/releases` y páginas Release* |

### 8.5 Consumidores que siguen usando `features.release_id` (o no ven `user_stories.release_id`)

Ubicación exacta en backend (lecturas / escrituras legacy relevantes para auditoría):

| Ubicación | Uso |
|-----------|-----|
| `src/modules/backlog/projects.service.js` (~L479–L482) | SQL `releases` ⋈ `features` ON `f.release_id = r.id` en `validateActiveDependencies` — **no considera** historias con `user_stories.release_id` al decidir si el proyecto tiene releases activas vinculadas. |
| `src/modules/changeRequests/changeRequest.service.js` (~L367–L378) | Al listar CR por proyecto, acumula `release_id` desde **features** del proyecto (`attributes: ["id", "release_id"]`), no desde historias. |
| `src/modules/backlog/backlog.service.js` (~L113) | DTO de feature en listados expone `release_id` de la tabla `features` (legacy expuesto al cliente). |
| `src/modules/releases/release.service.js` (~L144–L148, L309–L317) | Lectura/respuesta `features` con `Feature.release_id`; **escritura** en `assignFeatureToRelease` / remove feature (endpoints legacy, no WAVE 4 story assign). |
| `src/modules/releases/release.repository.js` | `Feature.count({ where: { release_id } })` exportado (helper; publicación usa `countStoriesByReleaseId` en `release.service.js` L235). |
| `src/modules/backlog/feature.repository.js` | `Feature.update({ release_id: null }, …)` al limpiar por release. |
| `src/modules/docs-export/providers/executiveData.provider.js` | Resolución de release vía tabla **`release_features`** (`ReleaseFeature`), no vía `user_stories.release_id` — riesgo de exportes ejecutivos desalineados con WAVE 4 si solo existiera vínculo canónico en historias. |

### 8.6 Regresión — suites Jest ejecutadas

| Ejecución | Resultado |
|-----------|-----------|
| `npm test` (todo `src/tests`) | **21 suites, 138 tests PASS** (2026-03-27) |
| Suites con mayor sensibilidad a Releases / backlog / CR / proyecto | `releases.*.test.js`, `backlog.negative.test.js`, `changeRequests.negative.test.js`, `global-consistency.integration.test.js`, `scope-locks.integration.test.js`, `orchestrator/*` |

Playwright WAVE 4: `tests/e2e/wave4-releases.spec.js` (validar tras `frontend-react` build).

### 8.7 Riesgos residuales (post-auditoría)

1. **Mayor:** `validateActiveDependencies` puede **no** detectar releases activas enlazadas solo por `user_stories.release_id` → riesgo de política incorrecta al borrar/archivar proyecto (dependencias “invisibles” para esa query). Mitigación futura: extender SQL con `user_stories.release_id` o unión equivalente.
2. **Mayor (documental/export):** `executiveData.provider.js` y listados de CR por `feature.release_id` pueden **omitir** el vínculo canónico historia–release.
3. **Menor:** `countFeaturesByReleaseId` sin uso actual en servicio; posible limpieza o uso futuro alineado a reporting.
4. **Menor:** E2E depende de bundle `public/react-app` actualizado.

---

## 9. Comandos ejecutados (evidencia local)

```bash
cd frontend-react
npm run build
```

```bash
cd <repo-root>
npm test -- --testPathPattern=releases
# Resultado: 3 suites, 27 tests PASS
```

```bash
cd <repo-root>
npm test
# Resultado: 21 suites, 138 tests PASS (auditoría 2026-03-27)
```

```bash
npx playwright test tests/e2e/wave4-releases.spec.js --project=chromium
# Resultado: 1 passed (tras build frontend)
```

## 10. Estado WAVE 4

Implementación validada; cierre formal: **CLOSED WITH NOTES** (ver §8.1 y §8.7).
