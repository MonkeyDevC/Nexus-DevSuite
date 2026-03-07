# Plan ETAPA 6 — Sistema de calidad interno

**Referencia:** nexus-plan-maestro-etapas.mdc  
**Objetivo Plan Maestro:** Consolidar métricas e indicadores. Métricas de desempeño y QA automatizado estructural. Madurez organizacional formal.  
**Estado:** Diseñado por PO MASTER — pendiente validación SYSTEM ARCHITECT

---

## Contexto

- **Objetivo:** Cerrar el ciclo de calidad del sistema: métricas de desempeño consolidadas, QA estructural documentado y verificable, y documento de madurez organizacional.
- **Estado actual:** Existen métricas HTTP básicas (total_requests, total_errors, auth_failures, refresh_failures), endpoint GET /system/metrics (solo MASTER), y suites security.qa, contract.qa además de las .negative por dominio.
- **No se crean nuevas entidades ni tablas.** Se amplían indicadores en memoria, se añade documentación y una suite de QA estructural (smoke/estructural).
- **Patrones:** Respetar controller → service donde aplique; Response Layer v1; RBAC en endpoints de sistema.

---

## FASE 1 — Métricas de desempeño (consolidar)

### 1.1 Estado actual

- **metrics.store.js:** total_requests, total_errors, auth_failures, refresh_failures (contadores en memoria).
- **metrics.middleware.js:** incrementa total_requests por petición.
- **errorHandler.middleware.js:** incrementa total_errors en errores.
- **auth (login/refresh) y authorize:** incrementan auth_failures; auth.service incrementa refresh_failures.
- **GET /system/metrics:** MASTER only; devuelve snapshot con buildSuccess.

### 1.2 Ampliación (opcional pero recomendada)

- Añadir en **metrics.store.js** contadores por tipo de respuesta: **responses_2xx**, **responses_4xx**, **responses_5xx** (inicializados en 0).
- Exponer **incrementResponseCounter(status)** o similar (llamado desde un middleware de respuesta que inspeccione res.statusCode tras finalizar la petición). Si no se quiere middleware adicional, documentar las métricas actuales y dejar 2xx/4xx/5xx para iteración futura.
- Añadir al snapshot **started_at** (timestamp de arranque de la instancia) para cálculo de uptime en cliente, si se desea.
- **Criterio mínimo:** Al menos documentar en el documento de calidad (FASE 3) qué métricas se exponen y cómo se actualizan; opcionalmente ampliar con 2xx/4xx/5xx y started_at.

### 1.3 Endpoint GET /system/metrics

- Mantener RBAC: solo MASTER.
- Respuesta con Response Layer v1 (buildSuccess); controllerUtils si no está ya.
- Estructura de data: snapshot con total_requests, total_errors, auth_failures, refresh_failures, scope: "instance", y si se implementa: responses_2xx, responses_4xx, responses_5xx, started_at.

---

## FASE 2 — QA automatizado estructural

### 2.1 Objetivo

Garantizar que el conjunto mínimo de QA (suites por dominio + security + contract) está definido, es ejecutable y se puede verificar de forma repetible.

### 2.2 Suite estructural

**Archivo:** `src/tests/integration/quality/quality.structural.test.js`

**Contenido sugerido:**

- **Smoke de integración:** Peticiones HTTP mínimas para verificar que la aplicación responde y que los módulos críticos están montados.
  - GET /health → 200 (o 200 con body success).
  - POST /api/v1/auth/login (credenciales inválidas) → 401 (verifica que auth está montado).
  - GET /api/v1/reports/audit sin token → 401 (verifica que reports y auth están montados).
  - GET /api/v1/system/metrics con token MASTER → 200 (verifica que metrics está montado y RBAC).
- Opcional: verificación de que existen los archivos de suite esperados (backlog.negative, releases.negative, changeRequests.negative, sprints.negative, incidents.negative, improvements.negative, documents.negative, reports.negative, security.qa, contract.qa) mediante require.resolve o fs.existsSync; si falta alguno, el test falla. Esto fuerza el mantenimiento del conjunto estructural.

**Criterio de cierre:** Al menos el smoke de integración (health, auth 401, reports/audit 401, metrics 200 con MASTER) implementado y en verde.

### 2.3 Documentación del conjunto QA

En el documento de calidad (FASE 3) listar explícitamente todas las suites que forman parte del "QA estructural":

- backlog.negative.test.js
- releases.negative.test.js, releases.hotfix.test.js
- changeRequests.negative.test.js
- sprints.negative.test.js
- incidents.negative.test.js
- improvements.negative.test.js
- documents.negative.test.js
- reports.negative.test.js
- security.qa.test.js
- contract.qa.test.js
- quality.structural.test.js (smoke)

Y el comando de ejecución: `npm test` (o `npm test -- --runInBand --forceExit` según configuración).

---

## FASE 3 — Madurez organizacional formal (documento)

### 3.1 Documento de sistema de calidad interno

**Archivo:** `docs/SISTEMA_CALIDAD_INTERNO.md`

**Contenido mínimo:**

1. **Propósito:** Descripción del sistema de calidad interno de NEXUS DevSuite (métricas, QA automatizado, criterios de aceptación).
2. **Métricas de desempeño:**
   - Endpoint: GET /api/v1/system/metrics (solo MASTER).
   - Indicadores: total_requests, total_errors, auth_failures, refresh_failures; opcionalmente responses_2xx/4xx/5xx, started_at.
   - Origen: metrics.middleware, errorHandler, auth/authorize, auth.service.
3. **QA automatizado estructural:**
   - Lista de suites (las indicadas en 2.3).
   - Comando de ejecución.
   - Criterio de éxito: todas las suites en verde; 0 respuestas 500 en flujos esperados en las pruebas.
4. **Criterios de aceptación para releases:**
   - Todas las suites de QA estructural en verde.
   - Sin errores 500 en flujos cubiertos por tests.
   - Response Layer v1 y RBAC verificados (contract.qa, security.qa).
5. **Madurez:** Declaración de que el proyecto mantiene un conjunto de QA reproducible y métricas básicas de instancia para soporte a auditoría interna y mejora continua.

### 3.2 Opcional: endpoint de resumen de calidad

**Endpoint:** `GET /api/v1/system/quality-summary` (solo MASTER)

**Respuesta (ejemplo):**

- `metrics`: snapshot actual de métricas (mismo contenido que GET /system/metrics o subconjunto).
- `suites`: array con los nombres de las suites de QA estructural (configurado en código o constante), por ejemplo `["backlog.negative", "releases.negative", ...]`.
- Sin persistencia de "último resultado de tests" en esta etapa (eso requeriría CI o almacenamiento externo).

Si no se implementa el endpoint, el documento SISTEMA_CALIDAD_INTERNO.md es suficiente para madurez organizacional formal.

---

## FASE 4 — Error codes y documentación

- No se prevén nuevos códigos de error específicos para métricas o quality-summary (los endpoints devuelven 200 o 401/403 por RBAC).
- Actualizar CONTRATO_API.md (y openapi.yaml si aplica) con GET /system/metrics y, si se implementa, GET /system/quality-summary.

---

## FASE 5 — QA de la etapa 6

### 5.1 Tests

- **quality.structural.test.js:** smoke descrito en FASE 2 (health, auth 401, reports/audit 401, metrics 200 con MASTER). Debe pasar.
- **Regresión:** Todas las suites existentes (backlog, releases, changeRequests, sprints, incidents, improvements, documents, reports, security, contract) siguen en verde.

### 5.2 Verificación manual/documental

- Existencia y contenido mínimo de `docs/SISTEMA_CALIDAD_INTERNO.md`.
- GET /system/metrics devuelve Response Layer v1 y datos esperados.

---

## Resumen de entregables

| Entregable | Obligatorio | Descripción |
|------------|-------------|-------------|
| Métricas actuales documentadas | Sí | En SISTEMA_CALIDAD_INTERNO.md; opcional ampliar store con 2xx/4xx/5xx y started_at |
| GET /system/metrics con Response Layer v1 | Sí | Ya existe; verificar controllerUtils si aplica |
| quality.structural.test.js (smoke) | Sí | Health, auth 401, reports/audit 401, metrics 200 MASTER |
| docs/SISTEMA_CALIDAD_INTERNO.md | Sí | Métricas, lista de suites QA, criterios de aceptación, madurez |
| GET /system/quality-summary | Opcional | Snapshot + lista de nombres de suites |
| Contadores 2xx/4xx/5xx y started_at | Opcional | En metrics.store y middleware de respuesta |

---

## Criterio de cierre

- Documento SISTEMA_CALIDAD_INTERNO.md creado con contenido mínimo (métricas, QA estructural, criterios de aceptación).
- Suite quality.structural.test.js con smoke en verde.
- GET /system/metrics operativo con RBAC MASTER y Response Layer v1.
- Regresión: todas las suites existentes en verde.
- Arquitectura intacta; sin nuevas entidades ni migraciones.

---

## Archivos nuevos / modificados

| Tipo | Ruta |
|------|------|
| Nuevo | docs/SISTEMA_CALIDAD_INTERNO.md |
| Nuevo | src/tests/integration/quality/quality.structural.test.js |
| Modif (opcional) | src/system/metrics/metrics.store.js (2xx/4xx/5xx, started_at) |
| Modif (opcional) | middlewares para incrementar response counters |
| Modif (opcional) | src/system/metrics/metrics.controller.js (quality-summary) y routes |
| Modif | docs/CONTRATO_API.md (y openapi.yaml si aplica) |

No se modifican loadModels ni migraciones.
