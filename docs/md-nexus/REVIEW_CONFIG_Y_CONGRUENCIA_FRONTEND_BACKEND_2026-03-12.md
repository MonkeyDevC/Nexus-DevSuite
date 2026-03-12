/**
 * ----
 * Módulo: Review de configuración y congruencia FE/BE
 * Descripción: Revisión técnica autónoma (MD Nexus) de configuración, estabilidad y congruencia
 *              entre frontend (public/js) y backend (Express/Sequelize) + documentación contractual.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-12
 * ----
 */

## 1) Objetivo

Validar que:

- La **configuración** crítica (env/DB/tests/migraciones/QA) es coherente y operable.
- El **frontend** consume **endpoints existentes** y el contrato documental (docs) refleja el uso real.
- No existan bugs evidentes de contrato (endpoints inexistentes, paths incorrectos, códigos de error inconsistentes).

---

## 2) Configuración y estabilidad (review)

### 2.1 Entorno (`src/config/env.js`)

- Ajuste aplicado: `NODE_ENV=test` tratado como **no productivo** para permitir fallbacks de secretos JWT.
- Control de seguridad mantenido: en **producción** se siguen rechazando secretos débiles (`replace_with_*`).

### 2.2 Base de datos (Sequelize + migraciones)

- `src/infrastructure/db/sequelize-cli.config.js`: entorno `test` usa variables del entorno (misma estructura que dev).
- Se agregó migración incremental para auditoría:
  - `src/infrastructure/db/migrations/20260312120001-expand-audit-logs-entity-id.js`
  - Motivo: evitar `ER_DATA_TOO_LONG` cuando `entity_id` guarda paths largos (auditoría HTTP_REQUEST).

### 2.3 Tests reproducibles (Jest)

Se agregó bootstrap automático para que `npm test` no dependa de pasos manuales:

- `src/tests/jest/jest.globalSetup.js`: crea BD de test + corre migraciones + seed.
- `src/tests/jest/jest.env.js`: carga `.env` si existe y fija defaults de test.
- `src/tests/jest/jest.globalTeardown.js`: teardown básico (cierre de sequelize si aplica).
- `package.json`: se configuró Jest con `setupFiles/globalSetup/globalTeardown`.

Nota: se mantiene `forceExit: true` como medida de robustez ante handles abiertos no identificados con claridad; esto evita bloqueos de ejecución en CI/terminal. Se recomienda investigación específica posterior para eliminar la necesidad de `forceExit`.

---

## 3) Congruencia frontend ↔ backend (review)

### 3.1 Fuente usada

- Frontend: `public/js/api.js` y `public/js/views/*.js` (uso real de `fetchApi("/...")`).
- Backend: `src/routes/v1.routes.js` + módulos `*.routes.js`.
- Documentación contractual: `docs/ENDPOINTS_API_Y_USO_FRONTEND.md` y `docs/openapi.yaml`.

### 3.2 Hallazgos (inconsistencias detectadas)

1) **Frontend usaba endpoints existentes no documentados** en `docs/ENDPOINTS_API_Y_USO_FRONTEND.md`:
   - `PATCH /api/v1/stories/:id`
   - `PATCH /api/v1/stories/:id/sprint`
   - `PATCH /api/v1/sprints/:id`
   - `DELETE /api/v1/sprints/:id`

2) `docs/openapi.yaml` no reflejaba el set de endpoints de sprints y no incluía `PATCH /stories/{id}` ni `/stories/{id}/sprint`.

### 3.3 Correcciones aplicadas (documentales)

- `docs/ENDPOINTS_API_Y_USO_FRONTEND.md`:
  - Se añadieron las rutas faltantes en sección de Stories y Sprints.
- `docs/openapi.yaml`:
  - Se añadió `PATCH` bajo `/stories/{id}` (sin duplicar clave).
  - Se añadió `/stories/{id}/sprint`.
  - Se añadieron rutas base de Sprints:
    - `/sprints/{id}` (GET/PATCH/DELETE)
    - `/sprints/{id}/status` (PATCH)
    - `/sprints/{id}/stories` (GET)
    - `/sprints/{id}/stories/{storyId}` (POST/DELETE)

---

## 4) Validación QA (evidencia)

- `npm test`: **12/12 suites PASS, 79/79 tests PASS**.
- `npm run qa:dia2`: **5/5 PASS (100%)**.
  - Evidencia: `docs/DIA_2_QA_EVIDENCIA.md`.

---

## 5) Riesgos residuales y recomendaciones

- **Jest forceExit**: existe indicio de handles abiertos; no bloquea QA, pero debe investigarse para endurecer CI.
- **.env**: es local (ignorado por Git); el onboarding debe garantizar que el developer configure `DB_PASSWORD` correctamente.
- **OpenAPI**: se agregaron rutas mínimas para congruencia; falta completar esquemas/ejemplos para cobertura documental total.

