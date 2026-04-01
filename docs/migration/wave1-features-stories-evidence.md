# WAVE 1 — Features + Stories — Evidencia ISO (2026-03-27)

## Alcance

- Backend: `GET/POST /api/v1/features`, `PUT/DELETE /api/v1/features/:id`, `PUT/DELETE /api/v1/stories/:id` (rutas anteriores bajo proyectos/features conservadas).
- Contrato error: `success: false`, `data: null`, `error.code`, `meta`.
- Contrato DELETE éxito: `data: { id }`.
- Frontend: módulos `src/modules/features`, `src/modules/stories`, consumo vía `shared/http` (`get/post/put/del`), sin `fetch`/`axios` directo en páginas migradas.

## Política de consumo de datos — WAVE 1

El frontend **solo consume un subset contractual** definido en DTO locales; los campos adicionales que el API pueda enviar **no se propagan** a la capa de UI a través de los servicios de dominio:

- **Feature (`featureDto.js`):** `id`, `title`, `description`, `status`, `created_at`, `updated_at`, `project_id` (este último solo cuando el backend lo envía, para validación de contexto de ruta en listados/detalles).
- **Story (`storyDto.js`):** `id`, `feature_id`, `title`, `description`, `status`, `created_at`, `updated_at`.

Los servicios `featuresService` y `storiesService` aplican **mapeo explícito** tras `unwrapSuccessData`; no existe dependencia de campos extra no listados (p. ej. `assignee`, `priority`, `user_stories_count`) en las pantallas Wave 1 tras este cierre.

## Política de actualización — WAVE 1

- **PUT** (`PUT /features/:id`, `PUT /stories/:id`) es el **contrato canónico oficial** usado por el cliente React Wave 1.
- **PATCH** (`PATCH /features/:id`, `PATCH /stories/:id`, …) se mantiene como **compatibilidad temporal** con clientes o rutas existentes.
- **Verificación:** `putFeatureController` y `patchFeatureController` delegan en el mismo `featureService.updateFeature`; `putStoryController` y `patchStoryController` delegan en el mismo `userStoryService.updateStory` (**sin divergencia funcional**).
- **No** se elimina PATCH en este cierre (fuera de alcance).

## Política DELETE (hard delete)

- Feature: `409 FEATURE_HAS_STORIES`, `409 FEATURE_INVALID_STATE` si `ARCHIVED`.
- Story: `409 STORY_IN_SPRINT` si `sprint_id` presente; `409 STORY_INVALID_STATE` si estado no en `DRAFT|READY|ARCHIVED`.

## Sincronización UI

- Tras crear/editar/eliminar: refetch `listFeatures` o `getFeature` / `getStory` según pantalla; tras delete de feature: navegación a lista de features.

## UI errores

- Mensajes de usuario derivados de `errorPresentation` por `error.code` únicamente.

## Pruebas ejecutadas

- `npx jest src/tests/integration/backlog/wave1-features-stories.delete.test.js --runInBand` — PASS.
- `npm run lint` en `frontend-react` — PASS.
- `npm run build` en `frontend-react` — PASS.

## Validación funcional UI — WAVE 1

**Tipo:** suite Playwright `tests/e2e/wave1-features-stories-ui.spec.js`.

**Pasos cubiertos (resumen):**

| Paso | Acción | Resultado esperado |
|------|--------|---------------------|
| 1 | Login vía API + sesión en `sessionStorage` | Sesión lista para la SPA |
| 2 | Crear proyecto vía API | `projectId` para navegación |
| 3 | Navegar a `/projects/:id/features` | Listado visible (`features-root`) |
| 4 | Crear feature (formulario) | Fila/enlace con el título creado |
| 5 | Abrir detalle, editar descripción, guardar | Texto actualizado en tarjeta (refetch implícito vía recarga de estado) |
| 6 | Eliminar feature (confirmación modal) | Vuelta al listado |
| 7 | Crear feature + story vía API | IDs para detalle story |
| 8 | Navegar a detalle story, editar, guardar | Descripción actualizada |
| 9 | Eliminar story (confirmación) | Redirección a feature padre |

**Comando:** `npx playwright test tests/e2e/wave1-features-stories-ui.spec.js --project=chromium` (requiere app servida en `FRONTEND_URL` / `E2E_FRONTEND_URL`, por defecto `http://localhost:3000`, y credenciales válidas en el spec).

**Ejecución local (2026-03-27):** `1 passed` (chromium), ~3.4s.

**Nota:** capturas de pantalla opcionales; la trazabilidad queda en el spec + resultado de ejecución en CI/local.

## Auditoría (resumen)

| Dimensión   | Resultado |
|------------|-----------|
| Arquitectura | HTTP core único; capas backend respetadas |
| QA         | Integración DELETE + E2E UI Wave 1 |
| Seguridad  | Auth + tenant en servicios existentes |
| ISO        | Evidencia en este documento |

**Clasificación de cierre (post-observaciones):** **APROBADO (sin observaciones)** — políticas documentadas, DTO/mappers en servicios, PUT canónico + PATCH sin divergencia verificada en código, E2E UI ejecutado con PASS.
