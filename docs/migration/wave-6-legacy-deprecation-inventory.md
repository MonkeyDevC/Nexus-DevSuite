# WAVE 6 — Inventario legacy / deprecación / compatibilidad

**Regla:** en WAVE 6 **no se eliminó código**; solo clasificación con evidencia.

## Clasificación

| Clase | Significado |
|-------|-------------|
| REMOVE_NOW | Candidato a borrado **solo** tras verificación adicional (cero referencias); **no ejecutado** aquí. |
| DEPRECATE_NOW | Declarar obsoleto, planificar retiro; puede requerir deprecation headers o docs. |
| KEEP_TEMPORARILY | Convivencia necesaria hasta migración de datos/consumidores. |
| BLOCKED_BY_COMPATIBILITY | Quitar rompe contrato o datos aún mixtos. |
| UNKNOWN_USAGE | No se probó carga real; requiere grep/runtime antes de tocar. |

---

## 1. Rutas backend — release ↔ feature (legacy híbrido)

| Ubicación | Tipo | Uso real confirmado | Dependencia | Riesgo borrar | Clasificación |
|-----------|------|---------------------|-------------|---------------|---------------|
| `POST /api/v1/releases/:id/features/:featureId` | Ruta HTTP | **Sí** — `src/tests/integration/releases/*.test.js`, `changeRequests.negative.test.js`; `public/js/views/releases.js` (asignar/quitar feature) | Integración + UI vanilla si se montara | Alto (tests + posible script legacy) | **KEEP_TEMPORARILY** |
| `DELETE /api/v1/releases/:id/features/:featureId` | Ruta HTTP | **Sí** — mismos tests + `releases.js` | Igual | Alto | **KEEP_TEMPORARILY** |
| Nota | — | **React** (`releasesService.js`) **no** llama estos endpoints; usa `POST /stories/:id/assign-release` y remove-release | WAVE 4 canónico | — | Política explícita en doc de paridad |

| Ubicación | Tipo | Uso | Riesgo | Clasificación |
|-----------|------|-----|--------|---------------|
| `public/js/modules/releases/releases.api.js` — path `/projects/:pid/releases/:rid/features` | API cliente legacy | Posible contrato antiguo vs rutas actuales bajo `/releases` | MED | **UNKNOWN_USAGE** (no cargado desde `index.html` actual) |

---

## 2. Campos legacy

| Nombre | Ubicación | Rol | Lectura crítica | Clasificación |
|--------|-----------|-----|------------------|---------------|
| `features.release_id` | Modelo Feature, servicios releases/projects/CR | Lectura fallback / saneamiento | Sí (WAVE 4.5) | **BLOCKED_BY_COMPATIBILITY** |
| `user_stories.release_id` | Modelo UserStory | **Canónico** WAVE 4 | — | No legacy |

Ver [`wave4.5-canonical-alignment-inventory.md`](wave4.5-canonical-alignment-inventory.md).

---

## 3. DTOs / conteos híbridos

| Ítem | Ubicación | Nota | Clasificación |
|------|-----------|------|---------------|
| `countFeaturesByReleaseId` | `src/modules/releases/release.repository.js` | Cuenta por `features.release_id` solamente; puede divergir de “features con historias en release” | **DEPRECATE_NOW** (sustituir por métrica basada en `user_stories` cuando se defina consumidor) |

---

## 4. Tablas / modelos — ReleaseFeature

| Ítem | Ubicación | Uso confirmado | Clasificación |
|------|-----------|----------------|---------------|
| Modelo `ReleaseFeature`, tabla `release_features` | `src/modules/releases/models/`, `loadModels.js` | Asociaciones ORM; orquestador incluye tabla en hash (`globalConsistency.service.js`) | **KEEP_TEMPORARILY** |
| Export ejecutivo | `executiveData.provider.js` | Ya **no** usa ReleaseFeature (WAVE 4.5) | — |

---

## 5. public/js — árbol legacy (no montado en producto actual)

| Evidencia | Conclusión |
|-----------|------------|
| [`public/index.html`](../../public/index.html) solo: `<script type="module" src="/react-app/index.js">` | **No** se cargan `router.js`, `layout.js`, ni vistas hash `#/`. |
| Tests E2E (`tests/e2e/*.spec.js`) — grep **no** referencia `public/js` | Automatización actual usa **React BrowserRouter** y `localhost:3000`. |

| Componente | Ruta típica | Clasificación producto | Motivo |
|------------|-------------|------------------------|--------|
| `public/js/router.js`, `reactMount.js`, `views/*.js`, `modules/**` | ~80+ archivos bajo `public/js/` | **DEPRECATE_NOW** (como entry público) / **UNKNOWN_USAGE** (si algún proceso externo los sirve) | Desconectados del HTML servido al usuario |
| Mantener en repo | — | Archival/cleanup en **ola posterior** con grep CI “nadie importa” | **REMOVE_NOW** solo tras checklist |

**Riesgo:** borrado agresivo sin backup rompe documentación histórica o scripts locales no trackeados → no **REMOVE_NOW** en esta wave.

---

## FASE 3 — Focos rojos (conclusiones)

### Release-feature

- **Clientes activos:** tests de integración; código en `public/js/views/releases.js` **si** esa vista se cargara (hoy **no** vía `index.html`).
- **Cliente React:** **no** usa `POST/DELETE` assign-feature; usa asignación por story.
- **Deprecación:** viable como **política de producto** documentada; **no** retirar rutas hasta retirar tests dependientes o marcar deprecación en OpenAPI/readme operativo.

### public/js

- **Desconectado** del producto servido por `public/index.html` actual — evidencia en archivo.
- **Tests Playwright:** no dependen de `public/js` para navegación.

### DTOs legacy y UI React

- Respuestas API incluyen aún `feature.release_id` en payloads de feature; React puede mostrarlo indirectamente; **no** se identificó bug de “solo DTO viejo” bloqueando pantallas en esta auditoría.

### Campos legacy

- Eliminar `features.release_id` rompería compat y queries con **KEEP_TEMPORARILY** en WAVE 4.5 → **BLOCKED_BY_COMPATIBILITY** hasta saneamiento de datos y consumidores.
