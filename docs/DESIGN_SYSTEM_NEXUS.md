# Sistema de diseño NEXUS DevSuite

**ETAPA 12** — Referencia para desarrolladores. Variables CSS y clases reutilizables.  
**Archivo principal:** `public/css/design-system.css`

---

## 1. Variables CSS (`:root`)

### Tipografía
- `--nexus-font-sans` — Familia principal (system-ui, sans-serif)
- `--nexus-text-xs` … `--nexus-text-2xl` — Tamaños de texto
- `--nexus-font-weight-normal` … `--nexus-font-weight-bold` — Pesos

### Colores
- `--nexus-accent` (#f97316) — Botón primario, enlaces activos (alineado con login)
- `--nexus-accent-hover` (#ea580c) — Hover del acento
- `--nexus-bg-page`, `--nexus-bg-card` — Fondos
- `--nexus-text-primary`, `--nexus-text-secondary`, `--nexus-text-muted`
- `--nexus-success`, `--nexus-warning`, `--nexus-danger`, `--nexus-info` — Estados semánticos

### Espaciado
- `--nexus-spacing-1` … `--nexus-spacing-6` (4px … 24px)

### Radios
- `--nexus-radius-sm` / `-md` / `-lg` (6px / 8px / 12px)

---

## 2. Clases de botones

- `.btn-nexus-primary` — Acción principal (naranja, texto blanco)
- `.btn-nexus-secondary` — Acción secundaria (borde, fondo transparente)

En vistas dentro de `#content` (excl. login), `.btn-primary` de Bootstrap usa el acento NEXUS.

---

## 3. Inputs

- Clase `.nexus-input` para inputs del design system.
- `.form-control` dentro de `#content` (fuera de `.login-page`) tienen borde, radio 8px y focus con acento.

---

## 4. Cards y contenedores

- `.nexus-card` — Tarjeta con fondo blanco, borde, radio 12px, sombra ligera
- `.nexus-panel` — Panel de contenido (borde, radio 12px)

---

## 5. Badges (estados de dominio)

Forma: pill. Mapeo 1:1 con valores de la API (ej. `IN_PROGRESS` → `nexus-badge-in-progress`).

Estados: active, archived, draft, planned, todo, in-progress, done, closed, blocked, open, resolved, approved, released, qa, proposed, rejected, implemented, ready.  
Severidad: critical, high, medium, low.

Incident: OPEN, IN_PROGRESS, RESOLVED, CLOSED.

---

## 6. Estados visuales

- `.nexus-nav-item-active` — Ítem de menú activo
- `.nexus-table` — Tabla con hover en filas
- `.nexus-empty-state` — Sin datos; incluir título y botón `.btn-nexus-primary`
- `.nexus-disabled` — Opacidad y cursor not-allowed

---

## 7. Tipografía y espaciado

- `.nexus-text-primary`, `.nexus-text-secondary`, `.nexus-text-muted`
- `.nexus-font-semibold`, `.nexus-text-sm`, `.nexus-text-lg`
- `.nexus-page-title` — Título de página (h1)
- `.nexus-section-spacing` — Margen entre secciones

---

## 8. Uso en vistas (Etapas 13–17)

- Estado API → clase badge: `IN_PROGRESS` → `nexus-badge-in-progress`.
- Botones principales: `btn-nexus-primary` o `btn btn-primary`.
- Tarjetas: `nexus-card`. Listas vacías: `nexus-empty-state` + botón `btn-nexus-primary`.

Referencia: docs/PLAN_ETAPA_12_SISTEMA_DISENO.md, public/css/design-system.css.
