# WAVE 4.5 — Inventario: `features.release_id`, `ReleaseFeature`, joins legacy

Barrido de código (`src/`) tras WAVE 4.5 — Canonical Alignment.  
Clasificación por fila:

- **ALINEADO WAVE 4.5** — Consumidor alineado a `user_stories.release_id` con fallback legacy explícito donde aplica.
- **LEGACY PERMITIDO TEMPORAL** — Lectura/escritura legacy esperada; sin nueva dual-write transversal fuera del módulo releases.
- **PENDIENTE DE DEPRECACIÓN** — Métricas o rutas que aún dependen solo de `features.release_id` o de `release_features` sin unión canónica; candidatas a futura wave.

---

## 1. `features.release_id` (columna legacy)

| Ubicación | Rol | Clasificación |
|-----------|-----|---------------|
| `src/modules/backlog/projects.service.js` — `validateActiveDependencies` | `EXISTS` sobre `f.release_id = r.id` **OR** `us.release_id` vía join a features del proyecto | **ALINEADO WAVE 4.5** |
| `src/modules/changeRequests/changeRequest.service.js` — `listChangeRequestsByProject` | `releaseIdsSet` incluye `f.release_id` de features del proyecto **y** `DISTINCT us.release_id` por SQL | **ALINEADO WAVE 4.5** |
| `src/modules/docs-export/providers/executiveData.provider.js` — `resolveChain` | `releaseIdToLoad = storyReleaseId \|\| featureReleaseId` (precedencia historia) | **ALINEADO WAVE 4.5** |
| `src/modules/docs-export/providers/executiveData.provider.js` — `computeReleaseCounts` | Solo `user_stories.release_id` (counts / distinct `feature_id`) | **ALINEADO WAVE 4.5** |
| `src/modules/releases/release.service.js` | Asignación/desasignación legacy en feature; comentario SSOT: canónico es `user_stories.release_id` | **LEGACY PERMITIDO TEMPORAL** |
| `src/modules/releases/release.repository.js` — `countFeaturesByReleaseId` | `Feature.count({ where: { release_id } })` — solo columna feature | **PENDIENTE DE DEPRECACIÓN** (métrica no equivalente a distinct features vía stories) |
| `src/modules/backlog/feature.repository.js` | `Feature.update({ release_id: null }, …)` al limpiar release | **LEGACY PERMITIDO TEMPORAL** |
| `src/modules/backlog/projects.service.js` — bulk | `UPDATE features SET release_id = NULL` al borrar proyectos en lote | **LEGACY PERMITIDO TEMPORAL** |
| `src/infrastructure/db/loadModels.js` | Asociación `Feature.belongsTo(Release, release_id)` | **LEGACY PERMITIDO TEMPORAL** (ORM) |
| Migraciones `features.release_id` | Esquema histórico | **LEGACY PERMITIDO TEMPORAL** |

---

## 2. `ReleaseFeature` / tabla `release_features`

| Ubicación | Rol | Clasificación |
|-----------|-----|---------------|
| `src/infrastructure/db/loadModels.js` | Asociaciones Sequelize Release ↔ ReleaseFeature ↔ Feature | **LEGACY PERMITIDO TEMPORAL** (modelo persistido) |
| `src/modules/releases/models/releaseFeature.model.js` | Definición tabla | **LEGACY PERMITIDO TEMPORAL** |
| `src/modules/orchestrator/globalConsistency.service.js` | Lista de tablas en hash global | **LEGACY PERMITIDO TEMPORAL** (no fuente de negocio release↔story) |
| `src/modules/docs-export/providers/executiveData.provider.js` | *(ningún uso)* — export ejecutivo ya no usa `ReleaseFeature` | **ALINEADO WAVE 4.5** (ausencia de dependencia) |

---

## 3. Joins / queries `releases` ↔ `features` sin `user_stories` (relevantes)

| Ubicación | Notas | Clasificación |
|-----------|-------|---------------|
| `release.repository.js` — `countFeaturesByReleaseId` | Cuenta features por `features.release_id` solamente | **PENDIENTE DE DEPRECACIÓN** |
| `release.service.js` — listados `Feature.where({ release_id })` | Operaciones de dominio releases (fuera alcance 4.5) | **LEGACY PERMITIDO TEMPORAL** |
| Tests `releases.hotfix.test.js` — `Feature.count({ release_id })` | Cobertura hotfix | **LEGACY PERMITIDO TEMPORAL** (test) |

---

## 4. Deuda documentada (sin cambio en 4.5)

- **`validateActiveDependencies`:** predicado `releases.status <> 'ARCHIVED'` mantiene paridad histórica (incluye `RELEASED` como bloqueante). Lista explícita de estados “no bloqueantes” queda para decisión de producto.

---

## 5. Referencia de pruebas

- `src/tests/integration/migration/wave4.5-canonical-alignment.integration.test.js` — proyecto / change requests / `computeReleaseCounts`.
