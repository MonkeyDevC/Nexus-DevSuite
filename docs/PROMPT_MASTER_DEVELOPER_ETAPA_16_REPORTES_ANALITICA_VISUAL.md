# Prompt de ejecución — ETAPA 16 Reportes y analítica visual

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_16_REPORTES_ANALITICA_VISUAL.md, docs/CHECKLIST_ETAPAS_PROYECTO.md, nexus-plan-maestro-etapas.mdc (ETAPA 16)  
**Estructura:** nexus-engineering-execution.mdc  
**Estado:** Pendiente validación SYSTEM ARCHITECT y ajustes PO; no ejecutar hasta aprobación.

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 16 — Reportes y analítica visual** siguiendo el plan `docs/PLAN_ETAPA_16_REPORTES_ANALITICA_VISUAL.md`. Rediseñar #/reports con selectores (proyecto, sprint), secciones de resumen y auditoría, diseño unificado con Etapa 15. Solo frontend; solo MASTER; sin cambios en endpoints.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **Solo frontend:** Modificar únicamente `public/js/views/reports.js` y, si aplica, `public/css/` (design-system.css). No tocar `src/` ni API.
- **Design system:** Usar componentes y estilos de Etapa 12; coherencia visual con #/admin (Etapa 15).
- **API existente:** Consumir solo GET /reports/* y GET /system/metrics (o endpoints de reportes actuales). No crear endpoints nuevos.
- **Acceso:** Solo MASTER; no alterar guard de ruta.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Estructura y selectores

**Archivo:** `public/js/views/reports.js`.

1. Título "Reports" o "Reportes". Breadcrumb: Dashboard / Reports.
2. Selector de proyecto (dropdown); carga de datos según proyecto seleccionado.
3. Selector de sprint (dropdown); opcionalmente dependiente del proyecto; carga de datos según sprint.

### FASE 2 — Secciones de contenido

4. **Resumen proyecto:** bloque o tarjetas con datos resumidos del proyecto (según API existente). Si la API no expone resumen, mostrar placeholder o mensaje "Select a project".
5. **Resumen sprint:** bloque o tarjetas con datos del sprint (según API). Placeholder si no hay sprint o datos.
6. **Actividad usuario:** tabla o lista de actividad por usuario si la API lo expone; si no, omitir o placeholder.
7. **Auditoría:** tabla con columnas coherentes con #/admin/audit (entidad, usuario, fecha, acción). Filtros: entidad, usuario, rango de fechas, acción. Paginación. Misma familia de estilos que Etapa 15.

### FASE 3 — Analítica visual (opcional)

8. Si el design system incluye componentes de gráficos (barras, líneas, donut) y la API devuelve datos agregados, añadir una sección con gráficos para resumen proyecto o sprint. Si no, mantener tarjetas y tablas.

### FASE 4 — Verificación

9. Sidebar: ítem Reports activo en #/reports.
10. Sin errores de consola; solo llamadas a endpoints existentes.
11. Regresión: #/dashboard, #/admin, #/projects operativos.

---

## 4️⃣ CRITERIOS DE ACEPTACIÓN

- [ ] #/reports con título, breadcrumb, selectores (proyecto, sprint).
- [ ] Al menos tres secciones: Resumen proyecto, Resumen sprint, Actividad usuario, Auditoría (tabla con filtros y paginación).
- [ ] Presentación coherente con Etapa 15 (tarjetas, tablas, filtros).
- [ ] Integración con GET /reports/* y GET /system/metrics sin cambios de contrato.
- [ ] Design system aplicado; guard MASTER sin regresión.

---

## 5️⃣ QA (6 NIVELES)

Funcional, API existente, diseño y coherencia con Etapa 15, navegación, solo MASTER, regresión.

---

## 6️⃣ CRITERIO DE CIERRE

Pantalla Reportes implementada según plan; QA sin bloqueos; evidencia en `docs/EVIDENCIA_ETAPA_16_REPORTES_ANALITICA_VISUAL_YYYY-MM-DD.md` (9 elementos adaptados a frontend).

---

## 7️⃣ ENTREGABLES Y EVIDENCIA

- **Código:** Cambios en `public/js/views/reports.js` y, si aplica, CSS.
- **Evidencia:** `docs/EVIDENCIA_ETAPA_16_REPORTES_ANALITICA_VISUAL_YYYY-MM-DD.md`. Actualizar checklist Etapa 16.

---

**No ejecutar hasta validación SYSTEM ARCHITECT y ajustes PO.**

*Plan: docs/PLAN_ETAPA_16_REPORTES_ANALITICA_VISUAL.md*
