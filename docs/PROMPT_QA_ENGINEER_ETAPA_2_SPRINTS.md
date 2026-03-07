# Prompt de validación QA — ETAPA 2 Gestión formal de Sprints

**Para:** QA ENGINEER (NEXUS QA)  
**Regla:** nexus-qa-engineer.mdc  
**Evidencia a validar:** `docs/EVIDENCIA_ETAPA_2_SPRINTS_2025-03-03.md`  
**Referencias:** `docs/PLAN_ETAPA_2_SPRINTS.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_2_SPRINTS.md`

---

## OBJETIVO

Validar de forma **independiente** la implementación de la ETAPA 2 — Gestión formal de Sprints realizada por el MASTER DEVELOPER.

Tu única función es **validar calidad**. No implementas código ni modificas migraciones.

---

## ENTRADA

1. Lee la evidencia del MASTER DEVELOPER: `docs/EVIDENCIA_ETAPA_2_SPRINTS_2025-03-03.md`
2. Revisa el plan: `docs/PLAN_ETAPA_2_SPRINTS.md`
3. Revisa el prompt de implementación: `docs/PROMPT_MASTER_DEVELOPER_ETAPA_2_SPRINTS.md`

---

## TAREA

Ejecutar el **modelo de QA en 6 niveles** sobre la implementación de Sprints:

### 1️⃣ QA FUNCIONAL
- Verificar que los flujos principales funcionen: crear sprint, listar sprints, asignar/desasignar story, cambiar status, cerrar sprint (MASTER).
- Ejecutar los tests de sprints y confirmar que pasan.

### 2️⃣ QA DE DOMINIO
- Transiciones PLANNED→IN_PROGRESS→CLOSED válidas; transiciones inválidas rechazadas.
- Sprint CLOSED bloquea asignación/desasignación.
- Story debe pertenecer al mismo Project que el Sprint.
- Cierre (IN_PROGRESS→CLOSED) solo MASTER; EMPLOYEE → 403.

### 3️⃣ QA NEGATIVA
- Suite `sprints.negative.test.js`: 8 tests según evidencia.
- IDs inexistentes → 404.
- Transición inválida → 400.
- EMPLOYEE intenta cerrar → 403.
- Asignar/desasignar en sprint CLOSED → 400.
- Story de otro proyecto → 400.
- Sin respuestas 500 en flujos esperados.

### 4️⃣ QA DE REGRESIÓN
- Ejecutar suites existentes: backlog, releases, changeRequests.
- Confirmar que no se rompen funcionalidades previas.

### 5️⃣ QA DE SEGURIDAD
- Endpoints protegidos sin token → 401.
- EMPLOYEE no puede cerrar sprint → 403.
- RBAC respetado en todos los endpoints de sprints.

### 6️⃣ QA DE CONTRATO
- Response Layer v1 (buildSuccess) en todos los endpoints de sprints.
- Header X-Response-Version en respuestas.
- Estructura JSON coherente con openapi.yaml.

---

## VALIDACIONES TÉCNICAS ADICIONALES

- **Migraciones:** Ejecutables en BD limpia; ON DELETE RESTRICT en project_id; snake_case.
- **Auditoría:** STATUS_CHANGE, STORY_ASSIGN_SPRINT, STORY_UNASSIGN_SPRINT, SPRINT_CLOSED con entity, entity_id, action, metadata, request_id.
- **Performance:** Sin queries N+1, sin queries en loops innecesarios.

---

## CRITERIOS DE BLOQUEO

Debes **BLOQUEAR** el cierre si detectas:
- Violación de reglas de dominio
- Errores 500
- Response Layer inconsistente
- Endpoint inseguro
- Migración incorrecta
- Ruptura de regresión
- Contrato API roto

---

## ENTREGA OBLIGATORIA

Genera un **archivo de validación** en `docs/` con la siguiente nomenclatura:

```
QA_VALIDACION_ETAPA_2_SPRINTS_<YYYY-MM-DD>.md
```

Donde `<YYYY-MM-DD>` es la fecha de generación (ej. `2026-03-03`).

**Ejemplo:** `docs/QA_VALIDACION_ETAPA_2_SPRINTS_2026-03-03.md`

---

## ESTRUCTURA OBLIGATORIA DEL DOCUMENTO

El archivo debe contener:

1. **Encabezado:** Título, referencia a evidencia, fecha, estado (APROBADO / BLOQUEADO).
2. **Resumen ejecutivo:** Resultado en una frase; recomendación al PO MASTER.
3. **Validación por modelo de QA (6 niveles):** Cada nivel con estado ✅ CUMPLE / ❌ NO CUMPLE y justificación breve.
4. **Verificación técnica:** Tablas de verificación por fase (modelo, migraciones, workflow, service, controller, auditoría, tests).
5. **Resultado de ejecución de tests:** Comando usado, suites ejecutadas, conteo (passed/failed), omitidos.
6. **Notas y observaciones:** Cualquier hallazgo no bloqueante.
7. **Criterios de bloqueo — Verificación:** Tabla con cada criterio y estado (❌ No detectado / ✅ Detectado).
8. **Evidencia obligatoria — Checklist:** Los 9 elementos del QA con ✅/❌.
9. **Conclusión:** Recomendación final al PO MASTER (APROBAR cierre / BLOQUEAR hasta corrección).

**Referencia de formato:** `docs/QA_VALIDACION_CORRECCIONES_AUDITORIA_2026.md`

---

## COMANDOS SUGERIDOS PARA VERIFICACIÓN

```bash
# Tests de sprints
$env:NODE_ENV="development"; npm test -- --testPathPattern="sprints.negative" --runInBand --forceExit

# Regresión: backlog, releases, changeRequests
$env:NODE_ENV="development"; npm test -- --testPathPattern="backlog|releases|changeRequests" --runInBand --forceExit

# Seguridad y contrato (si existen)
$env:NODE_ENV="development"; npm test -- --testPathPattern="security|contract" --runInBand --forceExit
```

---

**Al finalizar, entrega únicamente el archivo `docs/QA_VALIDACION_ETAPA_2_SPRINTS_<YYYY-MM-DD>.md`.** El usuario lo presentará al PO MASTER para la auditoría de cierre.
