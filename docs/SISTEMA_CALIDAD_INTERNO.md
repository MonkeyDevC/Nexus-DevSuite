# Sistema de calidad interno — NEXUS DevSuite

**Referencia:** ETAPA 6 Plan Maestro. Validación: docs/VALIDACION_ARQUITECTONICA_ETAPA_6_SISTEMA_CALIDAD_INTERNO.md

---

## 1. Propósito

El sistema de calidad interno de NEXUS DevSuite tiene como objetivo:

- Consolidar **métricas de desempeño** de la instancia (contadores operativos en memoria).
- Mantener un conjunto de **QA automatizado estructural** (smoke y suites por dominio) ejecutable y reproducible.
- Definir **criterios de aceptación** para releases y soporte a **auditoría interna** y mejora continua.

No se persisten resultados de tests en esta etapa; las métricas son por instancia y se reinician con el proceso.

---

## 2. Métricas de desempeño

### Endpoint

- **GET /api/v1/system/metrics** — Solo rol **MASTER**. Respuesta con Response Layer v1 (`buildSuccess`).

### Indicadores actuales

| Indicador           | Descripción                                      |
|---------------------|--------------------------------------------------|
| `total_requests`    | Total de peticiones HTTP recibidas por la instancia |
| `total_errors`      | Total de errores que pasaron por el errorHandler |
| `auth_failures`     | Fallos de autenticación (login, token inválido, etc.) |
| `refresh_failures`  | Fallos en refresh token (replay, expirado, etc.) |
| `scope`             | Siempre `"instance"` (compatible con escalabilidad horizontal) |

### Origen de cada indicador

| Indicador           | Origen |
|---------------------|--------|
| `total_requests`    | `metrics.middleware.js` — se incrementa por cada petición entrante |
| `total_errors`      | `errorHandler.middleware.js` — se incrementa cuando se maneja un error |
| `auth_failures`     | `authenticate.middleware.js`, `authorize.middleware.js`, flujo de login (credenciales inválidas) |
| `refresh_failures`  | `auth.service.js` — flujo de refresh token (replay, expirado, usuario inactivo) |

Las métricas son **contadores en memoria**; no son estado crítico de negocio y se reinician al reiniciar la instancia.

---

## 3. QA automatizado estructural

### Lista de suites

El conjunto de QA estructural incluye las siguientes suites de integración:

| Suite | Archivo | Descripción |
|-------|---------|-------------|
| Backlog negativo | `src/tests/integration/backlog/backlog.negative.test.js` | QA negativo ETAPA 1 (proyectos, features, stories) |
| Releases negativo | `src/tests/integration/releases/releases.negative.test.js` | QA negativo releases |
| Releases hotfix | `src/tests/integration/releases/releases.hotfix.test.js` | QA hotfix |
| Change requests negativo | `src/tests/integration/changeRequests/changeRequests.negative.test.js` | QA negativo CR |
| Sprints negativo | `src/tests/integration/sprints/sprints.negative.test.js` | QA negativo sprints |
| Incidents negativo | `src/tests/integration/incidents/incidents.negative.test.js` | QA negativo incidentes |
| Improvements negativo | `src/tests/integration/improvements/improvements.negative.test.js` | QA negativo mejoras |
| Documents negativo | `src/tests/integration/documents/documents.negative.test.js` | QA negativo documentos |
| Reports negativo | `src/tests/integration/reports/reports.negative.test.js` | QA negativo reportes |
| Security QA | `src/tests/integration/security/security.qa.test.js` | 401/403/404 y seguridad |
| Contract QA | `src/tests/integration/contract/contract.qa.test.js` | X-Response-Version y envelope |
| Quality structural (smoke) | `src/tests/integration/quality/quality.structural.test.js` | Smoke: health, auth 401, reports/audit 401, metrics 200 MASTER |

### Comando de ejecución

```bash
npm test
```

Para ejecución en banda y salida controlada:

```bash
npm test -- --runInBand --forceExit
```

### Criterio de éxito

- **Todas** las suites del QA estructural en verde.
- **0 respuestas 500** en flujos cubiertos por los tests (los tests negativos y de contrato verifican códigos esperados; no se esperan 500 no controlados).

---

## 4. Criterios de aceptación para releases

Para considerar un release listo desde el punto de vista de calidad interna:

1. **Suites en verde:** Todas las suites listadas en la sección 3 ejecutadas y pasando.
2. **Sin 500 en flujos esperados:** En los escenarios cubiertos por tests no debe haber respuestas 500 no controladas.
3. **Response Layer v1 y RBAC verificados:** La suite `contract.qa.test.js` verifica el envelope y el header `X-Response-Version`; la suite `security.qa.test.js` verifica 401/403 y comportamiento de autorización.
4. **GET /system/metrics:** Operativo con RBAC MASTER y respuesta con `scope: "instance"` y Response Layer v1.

---

## 5. Madurez

El proyecto NEXUS DevSuite mantiene un **conjunto de QA reproducible** y **métricas básicas de instancia** para soporte a auditoría interna y mejora continua. El documento presente y la suite `quality.structural.test.js` forman parte del sistema de calidad interno definido en la ETAPA 6 del Plan Maestro.

---

**Última actualización:** ETAPA 6 — Sistema de calidad interno. Sin nuevas entidades ni migraciones.
