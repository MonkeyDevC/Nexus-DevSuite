# Checklist de etapas del proyecto — NEXUS DevSuite

**Versión:** 1.4  
**Fecha:** 2026-03-06  
**Base:** Plan Maestro Estratégico ISO 9001 Ready (nexus-plan-maestro-etapas.mdc)

---

## Resumen de estado

| Etapa / Iniciativa | Estado | Siguiente acción |
|--------------------|--------|-------------------|
| **Correcciones de auditoría** | ✅ COMPLETADA | — |
| **ETAPA 0** | ✅ Completada | — |
| **ETAPA 1** | ✅ Completada | — |
| **ETAPA 2 Sprints** | ✅ Completada | — |
| **ETAPA 3** | ✅ Completada (Change Control) | — |
| **ETAPA 3 siguiente (Incidentes y Mejoras)** | ✅ Completada | — |
| **ETAPA 4 (Sistema documental ISO)** | ✅ Completada | — |
| **ETAPA 5 (Trazabilidad y reportes)** | ✅ Completada | — |
| **ETAPA 6 (Sistema de calidad interno)** | ✅ Completada | — |
| **ETAPA 7 (Plataforma Web Operativa)** | ✅ Completada | — |
| **ETAPA 8 (UX Operativa)** | ✅ Completada | — |
| **ETAPA 9 (Panel Administrativo)** | ✅ Completada | — |
| **ETAPA 10 (Preparación SaaS)** | ✅ Completada | — |
| **ETAPA 11 (Estilización del login)** | ✅ Completada | — |
| **ETAPA 12 (Sistema de diseño)** | ✅ Completada | — |
| **ETAPA 13 (Rediseño Dashboard)** | ✅ Completada | — |
| **ETAPA 14 (Rediseño módulos operativos)** | ✅ Completada | — |
| **ETAPA 15 (Panel administrativo UI)** | ✅ Completada | — |
| **ETAPA 16 (Reportes y analítica visual)** | ✅ Completada | — |
| **ETAPA 17 (Hardening UX y responsive)** | ✅ Completada | — |

---

## Correcciones de auditoría ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado |
| 2. MASTER DEVELOPER entrega evidencia (9 elementos) | MASTER DEVELOPER | ✅ Entregado |
| 3. QA ENGINEER valida calidad (6 niveles) | QA ENGINEER | ✅ Aprobado |
| 4. PO MASTER audita cierre | PO MASTER | ✅ Aprobado |

**Evidencia:** docs/EVIDENCIA_CORRECCIONES_AUDITORIA_2026.md, docs/QA_VALIDACION_CORRECCIONES_AUDITORIA_2026.md

---

## ETAPA 0 — Infraestructura base ✅ COMPLETADA

| Criterio | Estado |
|----------|--------|
| Autenticación robusta con JWT | ✅ |
| RBAC básico (MASTER / EMPLOYEE) | ✅ |
| Response Layer v1 estandarizado | ✅ (tras correcciones auditoría) |
| Catálogo formal de Error Codes | ✅ |
| Rate limiting y shutdown controlado | ✅ |
| Auditoría persistente (tabla audit_logs) | ✅ |
| OpenAPI 3.0.3 documentado | ✅ |
| QA reproducible Día 2 | ✅ |

---

## ETAPA 1 — Gobernanza base ✅ COMPLETADA

| Criterio | Estado |
|----------|--------|
| Entidad Project | ✅ |
| Entidad Feature | ✅ |
| Entidad UserStory | ✅ |
| Workflows auditables | ✅ |
| Transiciones con STATUS_CHANGE | ✅ |
| Base estructural del Product Backlog ISO-ready | ✅ |

---

## ETAPA 2 — Gestión formal de Sprints ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Plan creado (docs/PLAN_ETAPA_2_SPRINTS.md) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado con observaciones (incorporadas) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPA_2_SPRINTS.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado |

| Criterio | Estado |
|----------|--------|
| Entidad Sprint | ✅ |
| Asignación de UserStories a Sprint | ✅ |
| Cierre formal exclusivo por MASTER | ✅ |
| **Releases** | ✅ |
| SemVer, anti-downgrade, hotfix | ✅ |

**Evidencia:** docs/EVIDENCIA_ETAPA_2_SPRINTS_2025-03-03.md, docs/QA_VALIDACION_ETAPA_2_SPRINTS.md

---

## ETAPA 3 — Change Control ISO Mode (C) ✅ COMPLETADA

| Criterio | Estado |
|----------|--------|
| Entidad ChangeRequest | ✅ |
| entity_type, entity_id obligatorios | ✅ |
| Workflow DRAFT → SUBMITTED → APPROVED \| REJECTED → IMPLEMENTED | ✅ |
| validateAndConsumeChangeRequest en Release/Feature | ✅ |
| markAsImplemented tras éxito | ✅ |
| Suite changeRequests.negative en verde | ✅ |
| Auditoría de cierre aprobada | ✅ |

---

## ETAPA 3 siguiente — Gestión de Incidentes y Mejoras ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Plan creado (docs/PLAN_ETAPA_3_INCIDENTES_MEJORAS.md) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado con observaciones (incorporadas) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPA_3_INCIDENTES_MEJORAS.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado |

| Criterio | Estado |
|----------|--------|
| Entidad Incident (workflow, root_cause_analysis) | ✅ |
| Cierre formal incident solo MASTER | ✅ |
| Entidad Improvement (workflow, aprobación MASTER) | ✅ |
| Sistema formal de gestión de calidad | ✅ |

**Evidencia:** docs/EVIDENCIA_ETAPA_3_INCIDENTES_MEJORAS_2025-03-03.md, docs/QA_VALIDACION_ETAPA_3_INCIDENTES_MEJORAS.md

---

## ETAPA 4 — Sistema documental ISO ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Plan creado (docs/PLAN_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado con observaciones (incorporadas) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado |

| Criterio | Estado |
|----------|--------|
| Entidad Document (code, title, project_id, created_by) | ✅ |
| Entidad DocumentVersion (version_number, status, change_reason, approved_by) | ✅ |
| Versionado obligatorio (incremental, historial inmutable) | ✅ |
| Aprobación por MASTER (DRAFT→APPROVED, APPROVED→ARCHIVED) | ✅ |

**Evidencia:** docs/EVIDENCIA_ETAPA_4_SISTEMA_DOCUMENTAL_ISO_2025-03-03.md, docs/QA_VALIDACION_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md  

**Nota para backlog:** Observación QA no bloqueante: ajustar auditoría HTTP_REQUEST cuando entity_id (path) supera 100 caracteres (truncar o ampliar columna audit_logs.entity_id).

---

## ETAPA 5 — Trazabilidad y reportes ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Plan creado (docs/PLAN_ETAPA_5_TRAZABILIDAD_REPORTES.md) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado con observaciones (incorporadas) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPA_5_TRAZABILIDAD_REPORTES.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado |

| Criterio | Estado |
|----------|--------|
| Reportes por proyecto (summary) | ✅ |
| Reportes por sprint (summary) | ✅ |
| Reportes por usuario (activity / audit_logs) | ✅ |
| Reporte auditoría (GET /reports/audit, solo MASTER) | ✅ |
| Preparación para auditoría externa | ✅ |

**Evidencia:** docs/EVIDENCIA_ETAPA_5_TRAZABILIDAD_REPORTES_2025-03-05.md, docs/QA_VALIDACION_ETAPA_5_TRAZABILIDAD_REPORTES.md  

**Nota para backlog:** Incluir paths /reports/* en openapi.yaml en iteración futura (observación QA no bloqueante).

---

## ETAPA 6 — Sistema de calidad interno ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Plan creado (docs/PLAN_ETAPA_6_SISTEMA_CALIDAD_INTERNO.md) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado con observaciones (incorporadas) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPA_6_SISTEMA_CALIDAD_INTERNO.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado |

| Criterio | Estado |
|----------|--------|
| Métricas de desempeño (consolidadas y documentadas) | ✅ |
| QA automatizado estructural (suite quality.structural + doc) | ✅ |
| Documento SISTEMA_CALIDAD_INTERNO.md | ✅ |
| Madurez organizacional formal | ✅ |

**Evidencia:** docs/EVIDENCIA_ETAPA_6_SISTEMA_CALIDAD_INTERNO_2025-03-05.md, docs/QA_VALIDACION_ETAPA_6_SISTEMA_CALIDAD_INTERNO.md

---

## ✅ Plan Maestro (Etapas 0–6) — COMPLETADO

Con el cierre de la ETAPA 6 — Sistema de calidad interno se completa el **Plan Maestro Estratégico ISO 9001 Ready** (nexus-plan-maestro-etapas.mdc). Todas las etapas han sido diseñadas, validadas por SYSTEM ARCHITECT, implementadas por MASTER DEVELOPER, validadas por QA ENGINEER y auditadas por PO MASTER. **Las ETAPAS 0–6 permanecen intactas y no se renumeran.**

---

## FASE DE EVOLUCIÓN DEL PRODUCTO — Plataforma Web Operativa

Las **ETAPAS 7 a 10** representan la evolución de Nexus DevSuite desde un backend gobernado (ya completo hasta Etapa 6) hacia una **plataforma web operativa** utilizable desde navegador: interfaz administrativa, mejora de UX, panel administrativo avanzado y preparación para despliegue SaaS multi-organización. El backend existente no se sustituye; la interfaz web consume los endpoints actuales respetando Response Layer v1 y RBAC.

---

## ETAPA 7 — Plataforma Web Operativa ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Plan y prompt creados (docs/PLAN_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado con observaciones (incorporadas en plan y prompt) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado |

| Criterio | Estado |
|----------|--------|
| Interfaz web administrativa operativa desde navegador | ✅ |
| Stack frontend: HTML5, Bootstrap, JavaScript, Fetch API | ✅ |
| Login web con JWT y protección de rutas | ✅ |
| Dashboard operativo | ✅ |
| CRUD Projects, Features, UserStories (pantallas /projects, /features, /stories) | ✅ |
| Gestión visual Sprints, Releases, Change Requests, Incidents | ✅ |
| Sistema documental web y panel de reportes (/documents, /reports) | ✅ |
| Pantallas mínimas: /login, /dashboard, /projects, /features, /stories, /sprints, /releases, /incidents, /documents, /reports | ✅ |
| Consumo correcto del backend sin romper Response Layer v1 ni RBAC | ✅ |

**Objetivo:** Crear la interfaz web que permita operar Nexus DevSuite desde navegador consumiendo los endpoints existentes.

**Evidencia:** docs/EVIDENCIA_ETAPA_7_PLATAFORMA_WEB_OPERATIVA_2025-03-05.md, docs/QA_VALIDACION_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md

**Documentos:** docs/PLAN_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md

---

## ETAPA 8 — UX Operativa ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Plan y prompt creados (docs/PLAN_ETAPA_8_UX_OPERATIVA.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_8_UX_OPERATIVA.md) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado (observaciones O1–O3 incorporadas en prompt) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPA_8_UX_OPERATIVA.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado |

| Criterio | Estado |
|----------|--------|
| Tablas dinámicas en la plataforma web | ✅ |
| Filtros, búsqueda y paginación | ✅ |
| Indicadores de estado (visuales) | ✅ |
| Mejoras visuales de navegación | ✅ |

**Objetivo:** Mejorar la experiencia de usuario de la plataforma web (UX) una vez operativa la Etapa 7.

**Evidencia:** docs/EVIDENCIA_ETAPA_8_UX_OPERATIVA_2025-03-05.md, docs/QA_VALIDACION_ETAPA_8_UX_OPERATIVA.md

**Documentos:** docs/PLAN_ETAPA_8_UX_OPERATIVA.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_8_UX_OPERATIVA.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_8_UX_OPERATIVA.md

---

## ETAPA 9 — Panel Administrativo ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Plan y prompt creados (docs/PLAN_ETAPA_9_PANEL_ADMINISTRATIVO.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_9_PANEL_ADMINISTRATIVO.md) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado con observaciones (O1–O4 incorporadas en plan y prompt) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPA_9_PANEL_ADMINISTRATIVO.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado |

| Criterio | Estado |
|----------|--------|
| Herramientas administrativas avanzadas para rol MASTER | ✅ |
| Gestión de usuarios y gestión de roles | ✅ |
| Auditoría visual (consulta de audit_logs desde la web) | ✅ |
| Métricas del sistema en panel de control administrativo | ✅ |

**Objetivo:** Crear el panel administrativo para usuarios MASTER (usuarios, roles, auditoría visual, métricas).

**Evidencia:** docs/EVIDENCIA_ETAPA_9_PANEL_ADMINISTRATIVO_2025-03-06.md, docs/QA_VALIDACION_ETAPA_9_PANEL_ADMINISTRATIVO.md

**Documentos:** docs/PLAN_ETAPA_9_PANEL_ADMINISTRATIVO.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_9_PANEL_ADMINISTRATIVO.md, docs/AJUSTES_PO_ETAPA_9_SEGUN_ARCHITECT.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_9_PANEL_ADMINISTRATIVO.md

---

## ETAPA 10 — Preparación SaaS ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Plan y prompt creados (docs/PLAN_ETAPA_10_PREPARACION_SAAS.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_10_PREPARACION_SAAS.md) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado con observaciones (O1–O6 incorporadas en plan y prompt) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado con observaciones (docs/QA_VALIDACION_ETAPA_10_PREPARACION_SAAS.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado |

| Criterio | Estado |
|----------|--------|
| Multi-tenant (multi-organización) | ✅ |
| Configuración por organización y subdominios | ✅ |
| Aislamiento de datos entre organizaciones | ✅ |
| Preparación para billing | ✅ |
| Configuración de despliegue productivo | ✅ |

**Objetivo:** Preparar Nexus DevSuite para despliegue SaaS multi-organización (multi-tenant, aislamiento, billing, producción).

**Evidencia:** docs/EVIDENCIA_ETAPA_10_PREPARACION_SAAS_2026-03-06.md, docs/QA_VALIDACION_ETAPA_10_PREPARACION_SAAS.md

**Documentos:** docs/PLAN_ETAPA_10_PREPARACION_SAAS.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_10_PREPARACION_SAAS.md, docs/AJUSTES_PO_ETAPA_10_SEGUN_ARCHITECT.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_10_PREPARACION_SAAS.md

**Nota para backlog:** Observación QA no bloqueante: registrar como mejora futura el alargado de la columna `entity_id` en `audit_logs` (o truncado en middleware para acciones HTTP_REQUEST) para evitar fallos esporádicos con paths muy largos.

---

## ETAPA 11 — Estilización del login ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Plan y prompt creados (docs/PLAN_ETAPA_11_ESTILIZACION_LOGIN.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_11_ESTILIZACION_LOGIN.md) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado (docs/VALIDACION_ARQUITECTONICA_ETAPA_11_ESTILIZACION_LOGIN.md); ajustes opcionales incorporados (docs/AJUSTES_PO_ETAPA_11_SEGUN_ARCHITECT.md) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado (login estilizado: tarjeta, dos columnas, panel visual) |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (cierre por decisión PO) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado — Cierre por decisión del PO MASTER: login ya estilizado según evidencia visual. |

| Criterio | Estado |
|----------|--------|
| Layout de dos columnas (formulario ~40% izquierda, bloque visual ~60% derecha) | ✅ |
| Formulario minimalista con marca, título, email, contraseña, botón de acento, mensaje de error | ✅ |
| Panel derecho con ilustración, gradiente o composición visual (temática NEXUS DevSuite) | ✅ |
| Diseño responsive (formulario usable en móvil) | ✅ |
| Login funcional sin cambios en backend | ✅ |

**Objetivo:** Rediseñar la pantalla de login con estética moderna tipo “split”: formulario a la izquierda, bloque visual a la derecha, identidad NEXUS DevSuite.

**Cierre:** Por decisión del PO MASTER (2026-03-06). Login estilizado: tarjeta central con sombra, fondo decorativo, panel izquierdo (formulario) y derecho (gradiente + marca NEXUS).

**Documentos:** docs/PLAN_ETAPA_11_ESTILIZACION_LOGIN.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_11_ESTILIZACION_LOGIN.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_11_ESTILIZACION_LOGIN.md, docs/AJUSTES_PO_ETAPA_11_SEGUN_ARCHITECT.md, docs/EVIDENCIA_ETAPA_11_ESTILIZACION_LOGIN_2026-03-06.md

---

## FASE DE EVOLUCIÓN UX/UI DE LA PLATAFORMA

Las **ETAPAS 12 a 17** corresponden a la evolución visual y de interfaz de la plataforma web, basada en los wireframes generados para NEXUS DevSuite. **Alcance:** solo frontend (HTML, CSS, Bootstrap, JavaScript en `public/`). No se modifican backend, API, Response Layer v1, RBAC ni multi-tenant. **Ejecución etapas 14–17:** mediante el pipeline definido en **docs/NEXUS_AUTONOMOUS_DEVELOPMENT_LOOP.md** (CEO → PO MASTER → SYSTEM ARCHITECT → MASTER DEVELOPER → QA ENGINEER → PO MASTER). Referencia: docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md y plan maestro (nexus-plan-maestro-etapas.mdc).

---

## ETAPA 12 — Sistema de diseño Nexus DevSuite ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Plan y prompt creados (docs/PLAN_ETAPA_12_SISTEMA_DISENO.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_12_SISTEMA_DISENO.md) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado; ajustes incorporados (docs/VALIDACION_ARQUITECTONICA_ETAPA_12_SISTEMA_DISENO.md, docs/AJUSTES_PO_ETAPA_12_SEGUN_ARCHITECT.md) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado (docs/EVIDENCIA_ETAPA_12_SISTEMA_DISENO_2026-03-06.md) |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPA_12_SISTEMA_DISENO.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado — Cierre auditado por PO MASTER (evidencia + QA aprobado) |

| Criterio | Estado |
|----------|--------|
| Design system documentado (tipografía, color, espaciado, botones, inputs, cards, badges) | ✅ |
| Integración con Bootstrap sin romper funcionalidad | ✅ |
| Consistencia visual con login (Etapa 11) | ✅ |

**Objetivo:** Crear el design system oficial para unificar la estética de toda la plataforma.

**Evidencia:** docs/EVIDENCIA_ETAPA_12_SISTEMA_DISENO_2026-03-06.md, docs/QA_VALIDACION_ETAPA_12_SISTEMA_DISENO.md

**Documentos:** docs/PLAN_ETAPA_12_SISTEMA_DISENO.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_12_SISTEMA_DISENO.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_12_SISTEMA_DISENO.md, docs/AJUSTES_PO_ETAPA_12_SEGUN_ARCHITECT.md, docs/QA_VALIDACION_ETAPA_12_SISTEMA_DISENO.md, nexus-plan-maestro-etapas.mdc, docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md

---

## ETAPA 13 — Rediseño del Dashboard ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Ejecutado (plan + prompt) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado (docs/VALIDACION_ARQUITECTONICA_ETAPA_13_REDISENO_DASHBOARD.md, docs/AJUSTES_PO_ETAPA_13_SEGUN_ARCHITECT.md) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado (evidencia: docs/EVIDENCIA_ETAPA_13_REDISENO_DASHBOARD_2026-03-06.md) |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPA_13_REDISENO_DASHBOARD.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado — Cierre auditado por PO MASTER (evidencia + QA aprobado; recomendación QA: aprobar cierre) |

| Criterio | Estado |
|----------|--------|
| Layout y componentes del dashboard según wireframes (tarjetas, lista reciente, empty state) | ✅ |
| Integración con API existente (listado proyectos, enlaces) | ✅ |
| Consistencia con design system (Etapa 12) | ✅ |
| Navegación (sidebar/top bar) coherente | ✅ |

**Objetivo:** Aplicar wireframes al dashboard principal: métricas visuales, tarjetas de resumen, actividad reciente, navegación clara.

**Documentos:** docs/PLAN_ETAPA_13_REDISENO_DASHBOARD.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_13_REDISENO_DASHBOARD.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_13_REDISENO_DASHBOARD.md, docs/AJUSTES_PO_ETAPA_13_SEGUN_ARCHITECT.md, docs/EVIDENCIA_ETAPA_13_REDISENO_DASHBOARD_2026-03-06.md, docs/QA_VALIDACION_ETAPA_13_REDISENO_DASHBOARD.md, nexus-plan-maestro-etapas.mdc (ETAPA 13)

---

## Opción unificada Etapas 14–17 (un plan, un prompt, un ciclo)

Para ejecutar las **Etapas 14, 15, 16 y 17** en un solo ciclo (una validación con el arquitecto, un prompt para el MASTER DEVELOPER, una evidencia de cierre):

- **Plan unificado:** docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md  
- **Prompt de ejecución unificado:** docs/PROMPT_MASTER_DEVELOPER_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md  
- **Evidencia (ciclo 2026-03-06):** docs/EVIDENCIA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA_2026-03-06.md  
- **Validación QA:** docs/QA_VALIDACION_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md  

El MASTER DEVELOPER implementa en orden 14 → 15 → 16 → 17 y entrega un único archivo de evidencia. Siguen siendo válidos también los planes y prompts por etapa individual (docs/PLAN_ETAPA_14_..., etc.) si se prefiere ejecutar etapa por etapa.

---

## ETAPA 14 — Rediseño de módulos operativos ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Ejecutado (plan unificado 14–17) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado (plan unificado) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado (evidencia: docs/EVIDENCIA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA_2026-03-06.md) |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado — Cierre auditado por PO MASTER (evidencia + QA aprobado; recomendación QA: aprobar cierre) |

| Criterio | Estado |
|----------|--------|
| Projects, Features, Stories, Sprints, Releases (listado y detalle) según wireframes | ✅ |
| Incidents y Documents (listado y detalle) según wireframes si incluidos | ✅ |
| Tablas, filtros, búsqueda, paginación, breadcrumbs, badges coherentes | ✅ |
| Integración con API y RBAC sin regresión | ✅ |

**Objetivo:** Aplicar wireframes a pantallas de gestión: projects, features, stories, sprints, releases, incidents, documents.

**Documentos:** docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, docs/EVIDENCIA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA_2026-03-06.md, docs/QA_VALIDACION_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, nexus-plan-maestro-etapas.mdc (ETAPA 14)

---

## ETAPA 15 — Panel administrativo UI ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Ejecutado (plan unificado 14–17) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado (plan unificado) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado (evidencia: docs/EVIDENCIA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA_2026-03-06.md) |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado — Cierre auditado por PO MASTER (evidencia + QA aprobado; recomendación QA: aprobar cierre) |

| Criterio | Estado |
|----------|--------|
| Dashboard admin y subsecciones (Users, Audit, Metrics) según wireframes | ✅ |
| Tabla usuarios con filtros, CRUD y cambio de contraseña | ✅ |
| Auditoría y métricas con presentación visual coherente | ✅ |
| Guard de ruta MASTER y sin regresión | ✅ |

**Objetivo:** Aplicar wireframes al panel administrativo: gestión de usuarios, roles, auditoría visual, métricas del sistema.

**Documentos:** docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, docs/EVIDENCIA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA_2026-03-06.md, docs/QA_VALIDACION_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, nexus-plan-maestro-etapas.mdc (ETAPA 15)

---

## ETAPA 16 — Reportes y analítica visual ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Ejecutado (plan unificado 14–17) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado (plan unificado) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado (evidencia: docs/EVIDENCIA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA_2026-03-06.md) |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado — Cierre auditado por PO MASTER (evidencia + QA aprobado; recomendación QA: aprobar cierre) |

| Criterio | Estado |
|----------|--------|
| Pantalla Reportes con selectores y secciones según wireframes | ✅ |
| Presentación auditoría y métricas coherente con Etapa 15 | ✅ |
| Integración con GET /reports/* y GET /system/metrics sin cambios | ✅ |

**Objetivo:** Rediseñar Reportes (#/reports), auditoría y analítica visual con diseño unificado.

**Documentos:** docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, docs/EVIDENCIA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA_2026-03-06.md, docs/QA_VALIDACION_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, nexus-plan-maestro-etapas.mdc (ETAPA 16)

---

## ETAPA 17 — Hardening UX y responsive ✅ COMPLETADA

| Paso | Responsable | Estado |
|------|-------------|--------|
| 1. PO MASTER diseña etapa | PO MASTER | ✅ Ejecutado (plan unificado 14–17) |
| 2. SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ✅ Aprobado (plan unificado) |
| 3. MASTER DEVELOPER implementa | MASTER DEVELOPER | ✅ Ejecutado (evidencia: docs/EVIDENCIA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA_2026-03-06.md) |
| 4. QA ENGINEER valida | QA ENGINEER | ✅ Aprobado (docs/QA_VALIDACION_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md) |
| 5. PO MASTER audita cierre | PO MASTER | ✅ Aprobado — Cierre auditado por PO MASTER (evidencia + QA aprobado; recomendación QA: aprobar cierre) |

| Criterio | Estado |
|----------|--------|
| Layout responsive en todas las pantallas (sidebar, tablas, formularios) | ✅ |
| Mejoras de accesibilidad (contraste, etiquetas, foco) | ✅ |
| Consistencia visual y microinteracciones en toda la app | ✅ |
| Navegación y breadcrumbs correctos; sin regresión | ✅ |

**Objetivo:** Mejoras finales: responsive completo, accesibilidad, consistencia visual, microinteracciones, optimización de navegación.

**Documentos:** docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, docs/EVIDENCIA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA_2026-03-06.md, docs/QA_VALIDACION_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, nexus-plan-maestro-etapas.mdc (ETAPA 17)

---

## Sistema de agentes (configuración actual)

| Agente | Regla | Estado |
|--------|-------|--------|
| CEO | Humano | — |
| PO MASTER | nexus-po-master-gobernanza.mdc | ✅ Configurado |
| SYSTEM ARCHITECT | nexus-system-architect.mdc | ✅ Configurado |
| MASTER DEVELOPER | nexus-master-developer.mdc | ✅ Configurado |
| QA ENGINEER | nexus-qa-engineer.mdc | ✅ Configurado |
| SECURITY ENGINEER | — | 📋 Futuro |
| DEVOPS ENGINEER | — | 📋 Futuro |

---

## Flujo operativo de cierre de etapa

1. CEO solicita avance
2. PO MASTER diseña etapa
3. SYSTEM ARCHITECT valida arquitectura
4. PO MASTER genera prompt de implementación
5. MASTER DEVELOPER implementa
6. MASTER DEVELOPER entrega evidencia (9 elementos)
7. QA ENGINEER valida calidad (6 niveles)
8. PO MASTER audita cierre de etapa

---

*Documento de referencia. Actualizar al completar cada etapa.*
