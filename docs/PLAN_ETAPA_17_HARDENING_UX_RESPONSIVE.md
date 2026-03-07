# Plan ETAPA 17 — Hardening UX y responsive

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase UX/UI), nexus-plan-maestro-etapas.mdc  
**Objetivo:** Mejoras finales de experiencia de usuario: responsive completo, accesibilidad, consistencia visual y microinteracciones, optimización de navegación.  
**Estado:** Diseñado por PO MASTER — Pendiente validación SYSTEM ARCHITECT y ajustes PO tras validación.

**Alcance:** Solo frontend (HTML, CSS, JS en `public/`). Afecta todas las pantallas tocadas en Etapas 13–16 (dashboard, módulos operativos, admin, reportes). Sin cambios en API ni backend.

---

## 1. Contexto

- **Situación actual:** Tras Etapas 13–16, la UI está rediseñada según wireframes y design system, pero puede faltar comportamiento responsive, accesibilidad formal y pulido (microinteracciones, estados de carga, breadcrumbs/navegación consistentes).
- **Objetivo:** (1) Responsive: sidebar colapsable o adaptada en móvil; tablas con scroll horizontal o vista de tarjetas en pantallas pequeñas; filtros y botones accesibles. (2) Accesibilidad: contraste, etiquetas, foco visible, navegación por teclado (WCAG AA como objetivo). (3) Consistencia visual: revisión global de tipografía, espaciado y componentes en pantallas 13–16. (4) Microinteracciones: feedback en botones (hover, loading), mensajes éxito/error claros, estados de carga y empty state unificados. (5) Navegación: breadcrumbs correctos en todas las vistas; ítem activo en sidebar; búsqueda global usable si existe.
- **Referencia:** Plan maestro ETAPA 17; WCAG 2.1 nivel AA (objetivo).

---

## 2. Alcance (solo frontend)

| Elemento | Especificación |
|----------|----------------|
| **Backend / API** | Sin cambios. |
| **Frontend** | Layout (`public/index.html`, `public/js/layout.js`), design system (`public/css/design-system.css`), todas las vistas en `public/js/views/` (dashboard, projects, features, stories, sprints, releases, incidents, documents, admin, reports). |
| **Enfoque** | Responsive, a11y, consistencia, microinteracciones, navegación. |

---

## 3. Diseño objetivo por área

### 3.1 Responsive

- **Sidebar:** En viewport pequeño (p. ej. &lt; 992px), sidebar colapsable (hamburger) o convertida en drawer/overlay; ítems accesibles sin cubrir contenido.
- **Tablas:** En pantallas pequeñas, scroll horizontal con indicación visual o alternativa en tarjetas (una fila por tarjeta) para listados clave (projects, features, stories, users, audit).
- **Formularios y filtros:** Botones y controles apilados o en fila según espacio; no cortados ni inaccesibles.
- **Contenido principal:** Ancho máximo y márgenes coherentes; sin desbordes horizontales.

### 3.2 Accesibilidad (WCAG AA objetivo)

- **Contraste:** Razón de contraste suficiente para texto y controles (mínimo 4.5:1 texto normal; 3:1 texto grande).
- **Etiquetas:** Inputs y controles con `<label>` asociado o `aria-label`; botones con texto o `aria-label`.
- **Foco visible:** Outline o ring visible en foco de teclado en enlaces, botones y controles.
- **Navegación por teclado:** Orden de tabulación lógico; breadcrumbs y menú sidebar navegables por teclado; sin trampas de foco en modales.

### 3.3 Consistencia visual

- Revisión global de tipografía (títulos, cuerpo), espaciado (márgenes, paddings) y componentes (cards, badges, botones) en todas las pantallas de Etapas 13–16 según design system.
- Empty states y mensajes de error con mismo estilo (clases unificadas).

### 3.4 Microinteracciones

- Botones y enlaces: estado hover y active definidos; estado loading (spinner o disabled) en acciones que llaman API.
- Mensajes de éxito y error claros (toast o alert unificado); no solo consola.
- Estados de carga: skeleton o spinner en listados mientras cargan datos.

### 3.5 Navegación

- Breadcrumbs correctos en todas las vistas (dashboard, projects, features, stories, sprints, releases, incidents, documents, admin, reports).
- Sidebar: ítem activo resaltado según ruta actual en todas las pantallas.
- Búsqueda global (si está implementada): usable y visible; si no existe, dejar preparado o documentar como opcional.

---

## 4. Criterios de aceptación

- Layout responsive en todas las pantallas: sidebar adaptada/colapsable en móvil; tablas con scroll horizontal o vista tarjetas en pequeño; sin desbordes horizontales.
- Mejoras de accesibilidad: contraste, etiquetas, foco visible, navegación por teclado sin trampas.
- Consistencia visual y microinteracciones (hover, loading, mensajes éxito/error, estados de carga) en toda la app.
- Navegación: breadcrumbs correctos; ítem activo en sidebar; sin regresión funcional ni de backend.

---

## 5. Validación QA (6 niveles)

- **Funcional:** Todas las rutas operativas en escritorio y en viewport reducido (p. ej. 375px, 768px).
- **Diseño:** Responsive y a11y verificados; consistencia visual.
- **Navegación:** Breadcrumbs y sidebar en todas las vistas.
- **Regresión:** Sin roturas en flujos existentes; API intacta.

---

## 6. Referencias

- .cursor/rules/nexus-plan-maestro-etapas.mdc (ETAPA 17).
- public/js/layout.js, public/index.html, public/css/design-system.css, public/js/views/*.js.
- WCAG 2.1 nivel AA (referencia para contraste, etiquetas, foco, teclado).
