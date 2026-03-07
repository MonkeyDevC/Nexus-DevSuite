# Plan ETAPA 16 — Reportes y analítica visual

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase UX/UI), nexus-plan-maestro-etapas.mdc  
**Objetivo:** Rediseñar la pantalla de Reportes (#/reports) y la presentación de auditoría y métricas con foco en analítica visual (gráficos, resúmenes, filtros).  
**Estado:** Diseñado por PO MASTER — Pendiente validación SYSTEM ARCHITECT y ajustes PO tras validación.

**Alcance:** Solo frontend (HTML, CSS, JS en `public/`). Sin cambios en endpoints. Solo MASTER. Coherencia con panel admin (Etapa 15) y design system.

---

## 1. Contexto

- **Situación actual:** La vista #/reports (`public/js/views/reports.js`) ofrece reportes con layout básico. Falta diseño unificado y analítica visual (gráficos, resúmenes, filtros claros).
- **Objetivo:** Rediseñar #/reports con selectores (proyecto, sprint), secciones Resumen proyecto, Resumen sprint, Actividad usuario, Auditoría (tabla con filtros y paginación); opcionalmente gráficos (barras, líneas, donut) si el design system o wireframes lo incluyen. Coherencia con métricas/auditoría del panel admin (Etapa 15).
- **Referencia wireframes:** docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md (pantalla 13 Reportes); plan maestro ETAPA 16.

---

## 2. Alcance (solo frontend)

| Elemento | Especificación |
|----------|----------------|
| **Backend / API** | Sin cambios. Consumir GET /reports/* y GET /system/metrics (o endpoints de reportes existentes). |
| **Frontend** | Vista `public/js/views/reports.js`. Estilos desde `public/css/design-system.css`. |
| **Acceso** | Solo MASTER; misma guard que en Etapa 15. |

---

## 3. Diseño objetivo

### 3.1 Pantalla Reportes (#/reports)

- Título "Reports" o "Reportes".
- Breadcrumb: Dashboard / Reports (o equivalente).
- **Selectores:** proyecto (dropdown), sprint (dropdown, dependiente de proyecto si aplica).
- **Secciones (según API existente):**
  - **Resumen proyecto:** tarjetas o bloque con datos resumidos del proyecto seleccionado.
  - **Resumen sprint:** tarjetas o bloque con datos del sprint seleccionado.
  - **Actividad usuario:** tabla o lista de actividad por usuario (si la API lo expone).
  - **Auditoría:** tabla con filtros (entidad, usuario, fechas, acción) y paginación; coherencia visual con #/admin/audit (Etapa 15).
- Opcional: gráficos (barras, líneas, donut) para resúmenes si el design system los incluye y la API proporciona datos agregados; si no, tarjetas y tablas suficientes.
- Diseño unificado y legible; solo MASTER.

---

## 4. Criterios de aceptación

- #/reports con título, breadcrumb, selectores (proyecto, sprint) y al menos tres de: Resumen proyecto, Resumen sprint, Actividad usuario, Auditoría (tabla con filtros y paginación).
- Presentación coherente con Etapa 15 (admin): misma familia de componentes (tarjetas, tablas, filtros).
- Integración con GET /reports/* y GET /system/metrics (o endpoints actuales) sin modificar contratos.
- Design system aplicado; guard MASTER sin regresión.

---

## 5. Validación QA (6 niveles)

- **Funcional:** Selectores y secciones cargan; filtros y paginación en auditoría operativos.
- **API:** Solo endpoints existentes.
- **Diseño:** Alineado a wireframes y design system; coherencia con Etapa 15.
- **Navegación:** Breadcrumb y sidebar (Reports activo).
- **Seguridad:** Solo MASTER.
- **Regresión:** Resto de rutas operativas.

---

## 6. Referencias

- docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md (pantalla 13).
- .cursor/rules/nexus-plan-maestro-etapas.mdc (ETAPA 16).
- public/js/views/reports.js; public/css/design-system.css; coherencia con admin (Etapa 15).
