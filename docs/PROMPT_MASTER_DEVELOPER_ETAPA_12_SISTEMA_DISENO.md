# Prompt de implementación — ETAPA 12 Sistema de diseño Nexus DevSuite

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_12_SISTEMA_DISENO.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_12_SISTEMA_DISENO.md, docs/AJUSTES_PO_ETAPA_12_SEGUN_ARCHITECT.md, docs/CHECKLIST_ETAPAS_PROYECTO.md, nexus-plan-maestro-etapas.mdc  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 12 — Sistema de diseño Nexus DevSuite** siguiendo el plan `docs/PLAN_ETAPA_12_SISTEMA_DISENO.md`.

**Propósito:** Crear el design system oficial de la plataforma: variables CSS y clases reutilizables para tipografía, colores, espaciados, botones, inputs, cards, badges y estados visuales. Unificar la estética con el login (Etapa 11) y dejar la base lista para que las Etapas 13–17 (Dashboard, módulos operativos, admin, reportes) apliquen el mismo sistema. Solo frontend; sin cambios en backend, API ni contratos.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **Solo frontend:** Cambios únicamente en `public/`: nuevo(s) archivo(s) CSS y, si aplica, un único `<link>` en `public/index.html`. No tocar backend ni rutas API.
- **Integración con Bootstrap:** No eliminar ni sustituir Bootstrap. El design system debe **convivir** con Bootstrap 5: sobrescribir variables de Bootstrap donde sea útil (ej. `--bs-primary`, `--bs-body-font-family`) o añadir clases propias (ej. `.btn-nexus-primary`, `.nexus-badge-active`) que las vistas puedan usar. Tras la implementación, el login y el resto de pantallas deben seguir funcionando; regresión visual mínima aceptable si se unifica el acento.
- **Consistencia con login (Etapa 11):** Usar el mismo color de acento (`#f97316`) y la misma familia tipográfica que `public/css/login.css` donde aplique. Las clases del design system deben poder usarse en cualquier vista, incluido el login si en el futuro se refactoriza.
- **Stack:** HTML5, Bootstrap 5, JavaScript vanilla. No introducir frameworks CSS nuevos sin aprobación.
- **Regresión:** Verificar que login (#/login), dashboard (#/dashboard) y al menos una pantalla de listado (ej. #/projects) sigan operativos y sin errores de consola tras cargar el nuevo CSS.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Variables y base

1. **Crear archivo de design system** en `public/css/design-system.css` (o, si se prefiere, `public/css/variables.css` y `public/css/nexus-components.css`). Añadir en `public/index.html` un `<link rel="stylesheet" href="css/design-system.css">` **después** de Bootstrap y **antes** de `login.css` (o después de login.css si el design system no debe sobrescribir estilos del login en la ruta #/login).
2. **Variables de tipografía:** Definir `--nexus-font-sans` (ej. `system-ui, -apple-system, sans-serif` o la que use el proyecto); opcionalmente `--nexus-text-lg`, `--nexus-text-base`, `--nexus-text-sm`, `--nexus-font-weight-semibold`, `--nexus-font-weight-normal`. Aplicar a `body` o a una clase contenedora si no se quiere afectar al login.
3. **Variables de color:** Definir `--nexus-accent` (#f97316), `--nexus-accent-hover` (#ea580c o similar); `--nexus-bg-page`, `--nexus-bg-card`, `--nexus-text-primary`, `--nexus-text-secondary`. Opcional: mapear `--bs-primary` a `var(--nexus-accent)` para que los botones Bootstrap primarios usen el acento NEXUS en las vistas que ya usan `btn-primary`.

### FASE 2 — Botones e inputs

4. **Botón primario:** Clase `.btn-nexus-primary` (o refuerzo de `.btn-primary`) con background `var(--nexus-accent)`, color blanco, border-radius 8px, hover más oscuro. Que sea reutilizable en formularios y barras de acción ("+ New Project", "Entrar", etc.).
5. **Botón secundario y peligro:** Clases o extensión de `.btn-outline-*` y `.btn-danger` para mantener coherencia de bordes y radios.
6. **Inputs:** Clases utilitarias o sobrescritura de `.form-control` (solo donde no rompa login): border-radius 8px, borde sutil, focus con `border-color: var(--nexus-accent)` y `box-shadow` suave. Aplicar en vistas de contenido (dashboard, proyectos, etc.); el login puede seguir usando solo `login.css`.

### FASE 3 — Cards, badges y estados

7. **Cards:** Clase `.nexus-card` o similar: fondo claro, borde sutil, border-radius 12px, padding consistente, sombra opcional. Para tarjetas de resumen (dashboard) y paneles de detalle.
8. **Badges / Pills:** Clases por estado de dominio, por ejemplo:
    - `.nexus-badge-active`, `.nexus-badge-archived` (proyectos).
    - `.nexus-badge-draft`, `.nexus-badge-in-progress`, `.nexus-badge-done`, `.nexus-badge-planned`, `.nexus-badge-closed`, `.nexus-badge-todo`, `.nexus-badge-blocked` (features, stories, sprints, releases).
    - **Incident:** Usar **exactamente** los estados del backend: OPEN, IN_PROGRESS, RESOLVED, CLOSED (no INVESTIGATING). Clases `.nexus-badge-open`, `.nexus-badge-in-progress`, `.nexus-badge-resolved`, `.nexus-badge-closed` que mapeen 1:1 con el valor de `status` que devuelve la API (incident.model.js / workflow).
    - Colores: success (verde) para ACTIVE/DONE/APPROVED/RESOLVED, warning (amarillo/naranja) para IN_PROGRESS, secondary (gris) para ARCHIVED/DRAFT/PLANNED/TODO/CLOSED, danger (rojo) para BLOCKED/CRITICAL si aplica. Forma pill (border-radius alto).
9. **Estados visuales:** Clase `.nexus-nav-item-active` para ítem activo del sidebar (fondo o borde izquierdo con acento). Hover en filas de tabla con fondo muy suave. Clase `.nexus-empty-state` para mensaje y botón cuando no hay datos.

### FASE 4 — Espaciado y documentación

10. **Espaciados:** Variables `--nexus-spacing-*` (ej. 4, 8, 12, 16, 24 px) para usar en márgenes y paddings de cards y secciones, o documentar que se usa el gutter de Bootstrap.
11. **Comentarios en CSS:** Encabezado del archivo con referencia a ETAPA 12 y plan; comentarios por sección (Tipografía, Colores, Botones, Badges, etc.).
12. **Opcional:** Crear `docs/DESIGN_SYSTEM_NEXUS.md` con lista de variables y clases y un ejemplo de uso (para desarrolladores de Etapas 13–17).

### FASE 5 — Verificación

13. **Carga del CSS:** Confirmar que `design-system.css` se carga en todas las rutas (index.html) y que no hay 404.
14. **Regresión:** Abrir #/login, #/dashboard, #/projects; comprobar que el login sigue con su diseño actual y que dashboard y proyectos no se rompen (layout, botones, tablas visibles). Si alguna vista empeora por herencia de estilos, acotar las clases del design system a un contenedor (ej. solo dentro de `#content` cuando no es login) o usar especificidad suficiente para no pisar el login.

---

## 4️⃣ CRITERIOS DE ACEPTACIÓN

- [ ] Existe `public/css/design-system.css` (o equivalentes) con variables y clases para tipografía, color, espaciado, botones, inputs, cards, badges y estados.
- [ ] El archivo se carga en `public/index.html` y no rompe el login ni las pantallas existentes.
- [ ] Color de acento (#f97316) y tipografía coherentes con el login (Etapa 11).
- [ ] Badges definidos para los estados del dominio (ACTIVE, ARCHIVED, DRAFT, IN PROGRESS, DONE, PLANNED, CLOSED, TODO, etc.) con clases reutilizables.
- [ ] Base lista para que Etapas 13–17 apliquen el sistema sin tener que redefinir estilos desde cero.

---

## 5️⃣ ENTREGABLES

- `public/css/design-system.css` (o variables.css + nexus-components.css) con variables y clases descritas.
- Cambio en `public/index.html`: un `<link>` al nuevo CSS.
- Opcional: `docs/DESIGN_SYSTEM_NEXUS.md` con resumen de variables, clases y uso.
- Evidencia: descripción breve en `docs/EVIDENCIA_ETAPA_12_SISTEMA_DISENO_YYYY-MM-DD.md` (archivos creados, variables/clases principales, comprobación de regresión).

---

## 6️⃣ REFERENCIAS

- **Plan detallado:** docs/PLAN_ETAPA_12_SISTEMA_DISENO.md  
- **Login (alinear):** public/css/login.css  
- **Wireframes:** docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md  

---

## 9️⃣ BADGES DE INCIDENT (observación SYSTEM ARCHITECT)

- Para **Incident**, los estados deben coincidir con la API: **OPEN, IN_PROGRESS, RESOLVED, CLOSED**. No usar INVESTIGATING. Las clases (`.nexus-badge-open`, `.nexus-badge-in-progress`, `.nexus-badge-resolved`, `.nexus-badge-closed`) deben permitir mapeo 1:1 con `status` devuelto por la API.

---

*Prompt para MASTER DEVELOPER — ETAPA 12 Sistema de diseño Nexus DevSuite. Validado por SYSTEM ARCHITECT (docs/VALIDACION_ARQUITECTONICA_ETAPA_12_SISTEMA_DISENO.md, docs/AJUSTES_PO_ETAPA_12_SEGUN_ARCHITECT.md).*
