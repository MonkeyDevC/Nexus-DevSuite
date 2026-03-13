/**
 * ----
 * Módulo: Informe de cambios y validación
 * Descripción: Evidencia auditable de ajustes ejecutados por MD Nexus para estabilizar QA,
 *              asegurar reproducibilidad y corregir defectos detectados por suites automatizadas.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-12
 * ----
 */

## 1) Alcance de la intervención

Objetivo: **validar estabilidad**, corregir fallos detectados por QA automatizada y dejar evidencia verificable.

Restricciones respetadas:

- Arquitectura en capas **controller → service → repository** intacta.
- Sin creación de endpoints nuevos.
- Migraciones: **solo incrementales** (no se modifican migraciones previas).
- Manejo de errores mediante **AppError** y Response Layer v1 (sin exponer stack traces como respuesta).

---

## 2) Problemas detectados (evidencia de causa)

### 2.1 Tests no reproducibles sin preparación de BD

- Síntoma: errores de BD por columnas/migraciones faltantes cuando las suites asumen migraciones+seed ejecutadas.
- Acción: agregar bootstrap automático de BD para entorno `test` (create DB + migrate + seed).

### 2.2 Validación de secretos bloqueaba `NODE_ENV=test`

- Síntoma: suites fallaban al iniciar por secretos JWT considerados “débiles” en `test`.
- Acción: tratar `test` como entorno no-productivo para permitir fallbacks (sin relajar producción).

### 2.3 Error contractual en reports (código de error esperado)

- Síntoma: `Reports ETAPA 5 - QA negativo` esperaba `AUTH_FORBIDDEN` para EMPLOYEE pidiendo activity de otro usuario; se devolvía `RESOURCE_OTHER_ORGANIZATION`.
- Acción: reordenar validaciones (primero RBAC, luego restricción por organización).

### 2.4 Auditoría fallando por longitud de `entity_id`

- Síntoma: `Data too long for column 'entity_id'` al auditar requests cuyo path supera 100 chars.
- Acción: migración incremental para ampliar `audit_logs.entity_id` a 255 y ajuste del modelo Sequelize.

---

## 3) Archivos modificados / creados (trazabilidad)

### Modificados

- `package.json`
  - Ajuste de configuración de Jest (setupFiles/globalSetup/globalTeardown) para suites reproducibles.
  - `forceExit: true` para evitar bloqueo de CI/terminal por handles abiertos (investigación pendiente).
- `src/config/env.js`
  - `test` tratado como no-productivo para fallbacks de secretos (sin afectar producción).
- `src/modules/reports/report.service.js`
  - Corrección de orden de validación RBAC vs organización.
- `src/modules/auth/models/auditLog.model.js`
  - `entity_id` ampliado a `STRING(255)`.
- `docs/DIA_2_QA_EVIDENCIA.md`
  - Evidencia generada por `npm run qa:dia2`.

### Creados

- `src/infrastructure/db/migrations/20260312120001-expand-audit-logs-entity-id.js`
  - Migración incremental: `audit_logs.entity_id` de 100 → 255.
- `src/tests/jest/`
  - `jest.env.js`: carga `.env` si existe y fija defaults de test.
  - `jest.globalSetup.js`: crea BD de test, ejecuta migraciones y seed.
  - `jest.globalTeardown.js`: teardown básico para no dejar recursos abiertos.
- `docs/md-nexus/README.md`
- `docs/md-nexus/INFORME_CAMBIOS_Y_VALIDACION_2026-03-12.md` (este archivo)

---

## 4) QA ejecutada (modelo de 6 niveles)

### 4.1 QA funcional / dominio / negativa / regresión / seguridad / contrato

- **Jest**: `npm test`
  - Resultado: **12/12 suites PASS, 79/79 tests PASS**.
  - Cobertura incluye suites negativas y QA de seguridad/contrato (según `src/tests/integration/*`).

### 4.2 QA Día 2 (Response Layer v1, request_id, rutas básicas)

- Comando: `npm run qa:dia2`
- Resultado: **5/5 PASS (100%)**
- Evidencia: `docs/DIA_2_QA_EVIDENCIA.md`

---

## 5) Migraciones (validación)

- Migración agregada: `20260312120001-expand-audit-logs-entity-id.js`
- Validación: ejecutada por globalSetup de Jest (entorno `test`) junto con migraciones existentes.

---

## 6) Estado final del repo (al cierre de esta intervención)

- Working tree: **con cambios locales** (pendientes de commit si el flujo lo requiere).
- Rama actual: `primera_rama_javier`

Nota: `.env` es archivo local y está ignorado por `.gitignore` (no debe versionarse).

