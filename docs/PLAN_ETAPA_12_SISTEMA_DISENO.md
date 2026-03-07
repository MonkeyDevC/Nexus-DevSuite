# Plan ETAPA 12 — Sistema de diseño Nexus DevSuite

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase de evolución UX/UI), nexus-plan-maestro-etapas.mdc  
**Objetivo:** Crear el design system oficial de la plataforma para unificar la estética de toda la interfaz web (dashboard, módulos operativos, admin, reportes).  
**Estado:** Diseñado por PO MASTER — ✅ Validado por SYSTEM ARCHITECT (ajustes incorporados: docs/AJUSTES_PO_ETAPA_12_SEGUN_ARCHITECT.md)

**Alcance:** Solo frontend. Archivo(s) CSS y/o variables reutilizables en `public/`. Las Etapas 13–17 consumirán este sistema. Consistencia con el login (Etapa 11).

---

## 1. Contexto

- **Situación actual:** La plataforma tiene login estilizado (Etapa 11) con paleta y componentes propios (`public/css/login.css`). El resto de pantallas (dashboard, proyectos, features, stories, sprints, releases, incidentes, documentos, reportes, administración) usan Bootstrap por defecto sin una línea visual unificada.
- **Objetivo de la etapa:** Definir e implementar un **sistema de diseño** (design system) en CSS que establezca tipografías, colores, espaciados, botones, inputs, cards, badges y estados visuales de forma coherente con el login y con los wireframes de NEXUS DevSuite. No se modifican backend, API ni contratos; solo se añaden o extienden estilos en `public/`.
- **Referencia wireframes:** Top navbar (logo, búsqueda global, usuario, notificaciones); sidebar con ítems activos resaltados; tablas con cabeceras ordenables; filtros y barra de acciones; paginación; empty states; badges de estado (ACTIVE, ARCHIVED, TODO, IN PROGRESS, DONE, PLANNED, CLOSED, etc.).

---

## 2. Alcance (solo frontend)

| Elemento | Especificación |
|----------|----------------|
| **Backend** | Sin cambios. |
| **Frontend** | Archivo(s) en `public/css/` (ej. `design-system.css` o `variables.css` + `components.css`) que definan variables CSS y clases reutilizables. Opcional: documentación en `docs/DESIGN_SYSTEM_NEXUS.md` o comentarios en el propio CSS. |
| **Stack** | HTML5, Bootstrap 5, JavaScript vanilla. El design system debe **integrarse** con Bootstrap (variables que sobrescriban las de Bootstrap donde aplique, o clases utilitarias que se usen junto con las de Bootstrap) sin romper la funcionalidad existente. |

---

## 3. Componentes del design system

### 3.1 Tipografías

- **Familia:** Mantener coherencia con el login; usar `system-ui`, `Inter` o la fuente que ya use el proyecto. Definir en variable, ej. `--nexus-font-sans`.
- **Escala:** Títulos de página (h1), subtítulos (h2), cuerpo, etiquetas de formulario, texto secundario (breadcrumbs, pies). Variables o clases para tamaño y peso (ej. `--nexus-text-lg`, `--nexus-font-weight-semibold`).
- **Navegación:** Tamaño y peso para ítems de menú (sidebar, navbar).

### 3.2 Paleta de colores

- **Primario / Acento:** Alinear con el login: naranja `#f97316` como acento principal (botones primarios, enlaces activos). Definir variable `--nexus-accent` (y opcional `--nexus-accent-hover`).
- **Fondos:** Claros para contenido (`#f8fafc` o similar), oscuros para sidebar/navbar si los wireframes lo indican; variables `--nexus-bg-page`, `--nexus-bg-card`, `--nexus-bg-sidebar`.
- **Texto:** Primario (casi negro), secundario (gris), sobre fondos oscuros (blanco o gris claro). Variables `--nexus-text-primary`, `--nexus-text-secondary`, `--nexus-text-inverse`.
- **Estados y bordes:** Success, warning, danger, info (para badges y alertas); bordes de inputs y cards. Coherencia con Bootstrap (success, warning, danger) o variables propias.

### 3.3 Espaciados

- **Grid / Gutter:** Alinear con Bootstrap (`--bs-gutter-x`) o definir `--nexus-spacing-*` (ej. 4, 8, 12, 16, 24 px) para márgenes y paddings consistentes en cards, tablas y formularios.
- **Secciones:** Espacio entre bloques (entre título de página y tabla, entre filtros y tabla, entre tabla y paginación).

### 3.4 Botones

- **Primario:** Fondo acento (naranja), texto blanco, hover más oscuro. Clase reutilizable (ej. `.btn-nexus-primary` o extender `.btn-primary` de Bootstrap).
- **Secundario:** Borde, fondo transparente o claro; hover con fondo suave.
- **Peligro:** Para acciones destructivas (eliminar); estilo danger.
- **Estados:** hover, active, disabled (opacidad o cursor). Tamaños si aplica (normal, sm).

### 3.5 Inputs y controles

- **Texto y búsqueda:** Bordes discretos, border-radius coherente (ej. 8px), padding; focus con borde acento y/o box-shadow suave (como en login).
- **Selectores / Dropdowns:** Mismo radio y altura visual que inputs de texto cuando sea posible.
- **Placeholder:** Color gris suave.

### 3.6 Cards y contenedores

- **Tarjetas de resumen:** Fondo blanco o muy claro, borde sutil, border-radius (ej. 12px), sombra ligera opcional; padding interno consistente.
- **Paneles:** Para bloques de contenido (detalle de proyecto, detalle de sprint). Misma familia de bordes y fondos.

### 3.7 Badges y pills

- **Estados de dominio:** Definir colores (o clases) para los estados usados en la plataforma:
  - Proyecto: ACTIVE (verde/success), ARCHIVED (gris/secondary).
  - Feature / Story: DRAFT, PLANNED, TODO (gris), IN PROGRESS (azul/warning), DONE (verde/success), BLOCKED (danger si aplica).
  - Sprint: PLANNED, ACTIVE, CLOSED.
  - Release: PLANNED, RELEASED, ARCHIVED.
  - Incident: OPEN, IN_PROGRESS, RESOLVED, CLOSED (mismos nombres que la API; no usar INVESTIGATING); severidad: CRITICAL, HIGH, MEDIUM, LOW.
  - Documento/versión: DRAFT, APPROVED, ARCHIVED.
- Forma: pill (border-radius alto) o badge; tipografía en mayúsculas o capitalizada según wireframes. **Alineación con backend:** Los nombres de estados deben coincidir exactamente con los que devuelve la API para que las vistas puedan mapear `data.status` a la clase del badge (ej. `status === 'IN_PROGRESS'` → `.nexus-badge-in-progress`).

### 3.8 Estados visuales

- **Hover:** En filas de tabla, enlaces, botones secundarios (fondo muy suave).
- **Activo / Seleccionado:** Ítem de navegación activo (sidebar) con fondo o borde izquierdo destacado.
- **Disabled:** Opacidad reducida, cursor not-allowed.
- **Empty state:** Mensaje centrado o en bloque, tipografía secundaria, opcional icono; botón de acción (ej. "Crear primer proyecto") con estilo primario.

### 3.9 Iconografía

- **Navegación:** Iconos coherentes para Dashboard, Projects, Features, Stories, Sprints, Releases, Incidents, Documents, Reports, Administration. Pueden ser Bootstrap Icons (si se añade la fuente), SVG inline o clases que mapeen a un set elegido. No es obligatorio cambiar todos los iconos en esta etapa; sí documentar o dejar preparada la convención (clases o nombres) para que Etapas 13–17 los usen.

---

## 4. Entregables

- **Archivo(s) CSS:** `public/css/design-system.css` (o `variables.css` + `components.css`) con variables y clases descritas arriba. Carga en `public/index.html` (en `<head>`) para que apliquen a todas las vistas tras el login.
- **Integración con Bootstrap:** No eliminar Bootstrap; sobrescribir variables de Bootstrap donde tenga sentido (ej. `--bs-primary`) o añadir clases propias que se usen junto con las de Bootstrap. Comprobar que el login y las pantallas actuales sigan funcionando (regresión visual mínima aceptable si se unifica el acento).
- **Documentación:** Comentarios en el CSS con el nombre de cada variable o bloque; opcional: `docs/DESIGN_SYSTEM_NEXUS.md` con resumen de variables, clases y uso (para el MASTER DEVELOPER de las etapas siguientes).

---

## 5. Criterios de aceptación (resumen)

- Variables o clases definidas para tipografía, color, espaciado, botones, inputs, cards, badges y estados (hover, activo, disabled, empty state).
- Carga del design system en la app (index.html) sin romper login ni pantallas existentes.
- Consistencia visual con el login (Etapa 11): mismo color de acento y familia tipográfica donde aplique.
- Base lista para que Etapas 13–17 apliquen el sistema a dashboard, módulos operativos, admin y reportes.

---

## 6. QA (6 niveles) — aplicación a la etapa

| Nivel | Criterio para ETAPA 12 |
|-------|------------------------|
| **Funcional** | La aplicación sigue funcionando: login, navegación, listados, formularios. No se rompen estilos críticos del login. |
| **Dominio** | Los nombres de estados y colores reflejan el dominio (ACTIVE, ARCHIVED, etc.) sin inventar valores. |
| **Negativa** | Páginas sin el nuevo CSS cargado siguen siendo usables (Bootstrap como respaldo). |
| **UX** | Botones, inputs y badges son identificables y coherentes entre sí. |
| **Visual** | Paleta y tipografía alineadas con el login y con los wireframes de referencia. |
| **Regresión** | Login y al menos una pantalla más (ej. dashboard o proyectos) verificadas tras aplicar el design system. |

---

## 7. Referencias

- **Plan maestro:** nexus-plan-maestro-etapas.mdc (Fase UX/UI, ETAPA 12).
- **Login (Etapa 11):** `public/css/login.css` — colores y componentes a alinear (acento #f97316, fondos, botón .btn-nexus-accent).
- **Wireframes:** docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md.

---

*Documento de diseño para ETAPA 12. Actualizar si el SYSTEM ARCHITECT propone cambios.*
