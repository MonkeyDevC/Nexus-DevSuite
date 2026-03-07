# Prompt de ejecución — ETAPA 17 Hardening UX y responsive

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_17_HARDENING_UX_RESPONSIVE.md, docs/CHECKLIST_ETAPAS_PROYECTO.md, nexus-plan-maestro-etapas.mdc (ETAPA 17)  
**Estructura:** nexus-engineering-execution.mdc  
**Estado:** Pendiente validación SYSTEM ARCHITECT y ajustes PO; no ejecutar hasta aprobación.

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 17 — Hardening UX y responsive** siguiendo el plan `docs/PLAN_ETAPA_17_HARDENING_UX_RESPONSIVE.md`. Aplicar responsive completo, accesibilidad (WCAG AA objetivo), consistencia visual, microinteracciones y optimización de navegación en todas las pantallas de Etapas 13–16. Solo frontend; sin cambios en API.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **Solo frontend:** Modificar únicamente archivos en `public/`: `public/index.html`, `public/js/layout.js`, `public/css/design-system.css` y vistas en `public/js/views/`. No tocar `src/`.
- **Sin regresión:** No eliminar funcionalidad existente; solo añadir o refinar estilos y comportamiento (responsive, a11y, microinteracciones).
- **Design system:** Cualquier cambio de estilo debe ser coherente con el design system (Etapa 12) y con lo implementado en Etapas 13–16.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Responsive: layout y sidebar

**Archivos:** `public/index.html`, `public/js/layout.js`, `public/css/design-system.css` (o CSS asociado al layout).

1. **Sidebar en móvil:** En viewport &lt; 992px (o breakpoint Bootstrap equivalente), hacer la sidebar colapsable: botón hamburger que muestra/oculta la barra (drawer o overlay). Asegurar que el contenido principal no quede tapado de forma permanente y que se pueda cerrar la sidebar.
2. **Contenedor principal:** Asegurar que el área de contenido tenga ancho fluido y no provoque scroll horizontal en viewports típicos (320px–1920px). Revisar `overflow-x` en body/main.
3. **Tablas responsive:** En pantallas &lt; 768px, para al menos las tablas principales (projects, features, stories, users, audit): permitir scroll horizontal con wrapper con `overflow-x: auto` y, opcionalmente, vista alternativa en tarjetas (una fila por tarjeta con los mismos datos). Documentar en evidencia qué tablas tienen vista tarjetas.

### FASE 2 — Accesibilidad

4. **Contraste:** Revisar colores de texto y fondos en design-system.css y en componentes clave; asegurar ratio mínimo 4.5:1 para texto normal y 3:1 para texto grande (WCAG AA). Ajustar variables o clases si hace falta.
5. **Etiquetas:** Revisar formularios y filtros en todas las vistas: inputs con `<label>` asociado (for/id) o `aria-label`. Botones icono-only con `aria-label`. Dropdowns con etiqueta visible o aria-label.
6. **Foco visible:** Añadir estilos de `:focus-visible` (o `:focus`) para enlaces, botones e inputs: outline o ring visible (no `outline: none` sin reemplazo). Aplicar en design-system.css de forma global donde aplique.
7. **Teclado:** Verificar que el orden de tabulación sea lógico en cada vista; que los modales (si los hay) capturen el foco y permitan cerrar con Escape; que no haya trampas de foco. Sidebar y breadcrumbs navegables por teclado.

### FASE 3 — Consistencia visual

8. Revisar todas las vistas (dashboard, projects, features, stories, sprints, releases, incidents, documents, admin, reports): misma familia de tipografía (títulos, cuerpo), espaciados (márgenes/paddings entre secciones) y componentes (cards, badges, botones) según design system. Corregir desviaciones.
9. Empty states: unificar mensaje y CTA con las mismas clases (ej. `.nexus-empty-state`); mismo estilo en toda la app.

### FASE 4 — Microinteracciones

10. **Botones:** Estados hover y active ya definidos en design system; verificar que todos los botones primarios y secundarios los tengan. Para acciones que llaman API (guardar, eliminar, refresh): mostrar estado loading (spinner o botón disabled con texto "Loading...") hasta que la petición termine.
11. **Mensajes:** Donde se muestren éxito o error tras una acción (crear, editar, eliminar), usar un mismo patrón (toast, alert dismissible o bloque fijo) con mensaje claro; no depender solo de consola.
12. **Estados de carga:** En listados (projects, features, stories, etc.), mientras se cargan los datos mostrar skeleton o spinner en el área de la tabla; evitar parpadeo o contenido vacío sin indicación.

### FASE 5 — Navegación

13. **Breadcrumbs:** Revisar cada vista y asegurar que el breadcrumb sea correcto (Dashboard / … / Vista actual). Corregir rutas o textos que falten o estén mal.
14. **Sidebar activo:** Verificar que en cada ruta (#/dashboard, #/projects, #/features, #/stories, #/sprints, #/releases, #/incidents, #/documents, #/admin, #/admin/users, #/admin/audit, #/admin/metrics, #/reports) el ítem correspondiente del sidebar tenga la clase activa (resaltado).
15. **Búsqueda global:** Si existe barra de búsqueda global en la barra superior, asegurar que sea usable (placeholder, foco, resultado o enlace). Si no existe, no es obligatorio implementarla en esta etapa; documentar en evidencia.

### FASE 6 — Verificación final

16. Probar en al menos dos viewports: escritorio (≥ 1200px) y móvil (375px o 768px). Navegar por todas las rutas y comprobar que no hay errores de consola ni roturas.
17. Regresión: login, dashboard, listados, detalles, admin y reportes funcionan igual que antes en escritorio; en móvil todo accesible y sin desbordes.

---

## 4️⃣ CRITERIOS DE ACEPTACIÓN

- [ ] Sidebar colapsable/adaptada en viewport &lt; 992px; tablas con scroll horizontal o vista tarjetas en pequeño; sin scroll horizontal no deseado en body.
- [ ] Contraste, etiquetas, foco visible y navegación por teclado mejorados (WCAG AA objetivo).
- [ ] Consistencia visual en tipografía, espaciado y componentes en pantallas 13–16; empty states unificados.
- [ ] Microinteracciones: hover/active en botones; loading en acciones API; mensajes éxito/error claros; estados de carga en listados.
- [ ] Breadcrumbs correctos en todas las vistas; ítem activo en sidebar por ruta.
- [ ] Sin regresión funcional ni cambios en API.

---

## 5️⃣ QA (6 NIVELES)

Funcional (todas las rutas en escritorio y móvil), diseño (responsive y a11y), navegación, regresión. API y backend intactos.

---

## 6️⃣ CRITERIO DE CIERRE

Todos los puntos de las fases 1–5 implementados y verificados; QA sin bloqueos; evidencia en `docs/EVIDENCIA_ETAPA_17_HARDENING_UX_RESPONSIVE_YYYY-MM-DD.md` (9 elementos: archivos modificados, N/A migraciones, arquitectura intacta, QA funcional, regresión, a11y/responsive, sin 500, contrato API intacto).

---

## 7️⃣ ENTREGABLES Y EVIDENCIA

- **Código:** Cambios en `public/index.html`, `public/js/layout.js`, `public/css/design-system.css` y, según necesidad, en `public/js/views/*.js`.
- **Evidencia:** `docs/EVIDENCIA_ETAPA_17_HARDENING_UX_RESPONSIVE_YYYY-MM-DD.md` con los 9 puntos adaptados. Actualizar checklist Etapa 17.

---

**No ejecutar hasta validación SYSTEM ARCHITECT y ajustes PO.**

*Plan: docs/PLAN_ETAPA_17_HARDENING_UX_RESPONSIVE.md*
