# Evidencia ETAPA 12 — Sistema de diseño Nexus DevSuite

**Fecha:** 2026-03-06  
**Referencia:** docs/PLAN_ETAPA_12_SISTEMA_DISENO.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_12_SISTEMA_DISENO.md

---

## 1. Archivos creados o modificados

### Creados
- **public/css/design-system.css** — Sistema de diseño: variables `:root` (tipografía, paleta, espaciados, radios), integración con Bootstrap (`.btn-primary` usa acento en `#content` fuera de login), clases `.btn-nexus-primary`, `.btn-nexus-secondary`, inputs (`.nexus-input` y `.form-control` dentro de contenido no login), `.nexus-card`, `.nexus-panel`, badges por estado de dominio (active, archived, draft, planned, todo, in-progress, done, closed, blocked, open, resolved, approved, released, qa, proposed, rejected, implemented, ready; severidad critical, high, medium, low), `.nexus-nav-item-active`, `.nexus-table` hover, `.nexus-empty-state`, `.nexus-disabled`, utilidades de texto y `.nexus-page-title`, `.nexus-section-spacing`. Comentarios por sección y referencia a ETAPA 12.
- **docs/DESIGN_SYSTEM_NEXUS.md** — Resumen de variables, clases y uso para desarrolladores (Etapas 13–17).
- **docs/EVIDENCIA_ETAPA_12_SISTEMA_DISENO_2026-03-06.md** — Este documento.

### Modificados
- **public/index.html** — Inclusión de `<link href="css/design-system.css" rel="stylesheet">` después de Bootstrap y antes de `login.css`.

---

## 2. Variables y clases principales

| Grupo | Ejemplos |
|-------|----------|
| **Variables** | `--nexus-accent` (#f97316), `--nexus-accent-hover`, `--nexus-bg-page`, `--nexus-text-primary`, `--nexus-font-sans`, `--nexus-spacing-*`, `--nexus-radius-*` |
| **Botones** | `.btn-nexus-primary`, `.btn-nexus-secondary` |
| **Cards** | `.nexus-card`, `.nexus-panel` |
| **Badges** | `.nexus-badge-*` (active, archived, draft, in-progress, done, closed, open, resolved, etc.) según estados de la API |
| **Estados** | `.nexus-nav-item-active`, `.nexus-empty-state`, `.nexus-table` (hover en filas), `.nexus-disabled` |
| **Tipografía** | `.nexus-page-title`, `.nexus-text-primary`, `.nexus-text-secondary`, `.nexus-font-semibold` |

Badges de **Incident** alineados con la API: OPEN, IN_PROGRESS, RESOLVED, CLOSED (clases `nexus-badge-open`, `nexus-badge-in-progress`, `nexus-badge-resolved`, `nexus-badge-closed`).

---

## 3. Integración y regresión

- **Bootstrap:** No se elimina; el design system se carga después de Bootstrap. Los `.form-control` y `.btn-primary` dentro de `#content` (excl. login) reciben estilos coherentes con el acento; el login sigue usando `login.css` y conserva su diseño (`.login-page` tiene prioridad donde corresponda).
- **Consistencia con login (Etapa 11):** Mismo acento (#f97316), misma familia tipográfica (system-ui/sans-serif), mismos radios y enfoque de focus.
- **Regresión:** Verificar en navegador: #/login (diseño intacto), #/dashboard, #/projects (layout y tablas visibles, sin errores de consola). El design system no debe generar 404 (ruta `css/design-system.css` correcta en index.html).

---

## 4. Criterios de aceptación

- [x] Existe `public/css/design-system.css` con variables y clases para tipografía, color, espaciado, botones, inputs, cards, badges y estados.
- [x] El archivo se carga en `public/index.html` (después de Bootstrap, antes de login.css) y no rompe login ni pantallas existentes.
- [x] Color de acento (#f97316) y tipografía coherentes con el login (Etapa 11).
- [x] Badges definidos para estados del dominio con clases reutilizables y mapeo 1:1 con la API (incl. Incident OPEN, IN_PROGRESS, RESOLVED, CLOSED).
- [x] Base lista para que Etapas 13–17 apliquen el sistema; documentación en docs/DESIGN_SYSTEM_NEXUS.md.

---

## 5. Referencias

- Plan: **docs/PLAN_ETAPA_12_SISTEMA_DISENO.md**
- Prompt: **docs/PROMPT_MASTER_DEVELOPER_ETAPA_12_SISTEMA_DISENO.md**
- Design system (uso): **docs/DESIGN_SYSTEM_NEXUS.md**
- Login (alinear): **public/css/login.css**
