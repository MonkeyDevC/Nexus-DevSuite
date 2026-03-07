# Prompt de implementación — ETAPA 6 Sistema de calidad interno

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_6_SISTEMA_CALIDAD_INTERNO.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_6_SISTEMA_CALIDAD_INTERNO.md  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 6 — Sistema de calidad interno** siguiendo el plan `docs/PLAN_ETAPA_6_SISTEMA_CALIDAD_INTERNO.md`.

**Propósito:** Consolidar métricas de desempeño, QA automatizado estructural (smoke) y documento de madurez organizacional. No se crean nuevas entidades ni migraciones.

---

## 2️⃣ REGLAS INNEGOCIABLES

- No romper arquitectura existente (módulo system/metrics: controller + store; no se exige capa service para métricas).
- No crear tablas ni migraciones.
- No modificar migraciones previas.
- Response Layer v1 en endpoints de sistema (buildSuccess).
- RBAC MASTER en GET /system/metrics y, si se implementa, GET /system/quality-summary.
- Cero respuestas 500 en flujos esperados.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Métricas (consolidar y documentar)

1. Verificar que GET /system/metrics usa buildSuccess y RBAC MASTER; añadir controllerUtils (buildContext) solo si se desea consistencia con otros controllers; **no es obligatorio** para un GET de snapshot.
2. Mantener en el snapshot **scope: "instance"** (compatible con escalabilidad horizontal).
3. **Opcional:** Ampliar metrics.store.js con responses_2xx, responses_4xx, responses_5xx y started_at (timestamp de arranque). Si se implementan 2xx/4xx/5xx: crear middleware que use **res.on('finish', () => { ... })** para leer res.statusCode y llamar a incrementResponseCounter; ejecutar después de que la respuesta se haya enviado; asegurar que el errorHandler ya haya establecido el statusCode antes de que se dispare el evento.
4. Criterio mínimo: documentar en SISTEMA_CALIDAD_INTERNO.md las métricas actuales (total_requests, total_errors, auth_failures, refresh_failures, origen de cada una).

### FASE 2 — QA estructural (smoke)

5. Crear **src/tests/integration/quality/quality.structural.test.js** con smoke de integración:
   - GET /health → 200 (body con success según contrato).
   - POST /api/v1/auth/login (credenciales inválidas) → 401.
   - GET /api/v1/reports/audit sin token → 401.
   - GET /api/v1/system/metrics con token MASTER → 200.
6. **Opcional:** Verificación de existencia de archivos de suite (require.resolve o fs.existsSync) con las rutas correctas relativas al proyecto. Si se implementa: documentar en comentario del test que es un **test de mantenimiento estructural**; cualquier cambio de estructura de carpetas requerirá actualizar el test. Rutas de referencia (validación arquitectónica): src/tests/integration/backlog/backlog.negative.test.js, releases/releases.negative.test.js, releases.hotfix.test.js, changeRequests/changeRequests.negative.test.js, sprints/sprints.negative.test.js, incidents/incidents.negative.test.js, improvements/improvements.negative.test.js, documents/documents.negative.test.js, reports/reports.negative.test.js, security/security.qa.test.js, contract/contract.qa.test.js.

### FASE 3 — Documento de madurez

7. Crear **docs/SISTEMA_CALIDAD_INTERNO.md** con contenido mínimo: propósito del sistema de calidad; métricas (endpoint GET /system/metrics, indicadores y origen); QA automatizado (lista de suites, comando npm test, criterio de éxito); criterios de aceptación para releases (suites en verde, sin 500, Response Layer y RBAC verificados); declaración de madurez (QA reproducible y métricas para auditoría interna).
8. Lista de suites en el documento debe coincidir con la constante/configuración usada en quality-summary si se implementa (ver FASE 4).

### FASE 4 — quality-summary (opcional)

9. **Si se implementa GET /system/quality-summary:** Solo MASTER; respuesta con metrics (snapshot actual) y **suites** (array de nombres de suites). La lista de suites debe ser **una constante o configuración en código** (p. ej. en metrics.controller o en un archivo qualitySuites.js), no hardcodeada en múltiples sitios; mantener **coherencia** con la lista documentada en SISTEMA_CALIDAD_INTERNO.md.

### FASE 5 — Documentación y QA

10. Actualizar CONTRATO_API.md (y openapi.yaml si aplica) con GET /system/metrics y, si existe, GET /system/quality-summary.
11. Ejecutar quality.structural.test.js y verificar que pasa; ejecutar suite completa y verificar regresión (todas las suites en verde).

---

## 4️⃣ REGLAS DE DOMINIO CRÍTICAS

- Métricas son contadores operativos en memoria; no estado crítico de negocio; se reinician con la instancia.
- GET /system/metrics y GET /system/quality-summary: solo MASTER.
- Snapshot incluye scope: "instance".

---

## 5️⃣ AUDITORÍA

- No se exige auditoría por consulta a métricas (solo lectura).

---

## 6️⃣ QA OBLIGATORIA (6 niveles)

- **Funcional:** GET /system/metrics devuelve snapshot; smoke (health, auth 401, reports/audit 401, metrics 200) en verde.
- **Dominio:** Sin reglas de negocio que modifiquen datos; métricas solo lectura.
- **Negativa:** Smoke cubre 401 sin token y 200 con MASTER.
- **Regresión:** Todas las suites existentes en verde.
- **Seguridad:** GET /system/metrics solo MASTER (ya implementado).
- **Contrato:** Response Layer v1 en respuestas de sistema.

---

## 7️⃣ CRITERIO DE CIERRE

- docs/SISTEMA_CALIDAD_INTERNO.md creado con contenido mínimo.
- quality.structural.test.js con smoke en verde.
- GET /system/metrics operativo con RBAC MASTER y Response Layer v1.
- Regresión en verde.
- Sin nuevas entidades ni migraciones.

---

## 8️⃣ EVIDENCIA OBLIGATORIA

**Entrega en archivo:** `docs/EVIDENCIA_ETAPA_6_SISTEMA_CALIDAD_INTERNO_<YYYY-MM-DD>.md`

Contenido mínimo: lista archivos creados/modificados, confirmación de documento de calidad y smoke en verde, regresión en verde, Response Layer v1 en endpoints de sistema.

---

## 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporadas)

| Id | Observación | Aplicación en el prompt |
|----|-------------|-------------------------|
| O1 | quality-summary y lista de suites | FASE 4: lista de suites como constante/config en código; coherencia con SISTEMA_CALIDAD_INTERNO.md. |
| O2 | Verificación de archivos en quality.structural | FASE 2 paso 6: opcional; rutas correctas; documentar que es test de mantenimiento estructural. |
| O3 | Middleware 2xx/4xx/5xx | FASE 1 paso 3: usar res.on('finish', ...) para statusCode; ejecutar después de que la respuesta se envíe; errorHandler ya habrá establecido statusCode. |
| O4 | controllerUtils en metrics.controller | FASE 1 paso 1: no obligatorio para GET de snapshot. |
| O5 | scope: "instance" | FASE 1 paso 2: mantener en snapshot; compatible con escalabilidad horizontal. |

---

**Validación:** APROBADO CON OBSERVACIONES — SYSTEM ARCHITECT. Ver docs/VALIDACION_ARQUITECTONICA_ETAPA_6_SISTEMA_CALIDAD_INTERNO.md.
