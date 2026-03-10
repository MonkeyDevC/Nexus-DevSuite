# Entrega — 13/03/2026 (mejoras Proyectos, Story detail y criterios)

## Resumen para el equipo

Esta entrega incluye las mejoras realizadas en **Proyectos**, en el **detalle de la story** (card ampliada, layout y criterios de aceptación) y una regla de proyecto para el código.

---

### Proyectos
- **Filtro por nombre** en dropdown de la columna "Nombre" (mismo patrón que Features/Sprints): input "Buscar por nombre...", lista de proyectos con scroll vertical, Aplicar / Borrar filtro.
- **Botón "Eliminar filtro"** en la barra superior cuando hay búsqueda por nombre o filtro por estado activos.
- **Dropdown estable**: reinicialización con `popperConfig: { strategy: "fixed" }` para que el menú no se desplace mal al reabrir tras aplicar filtro; alineación `dropdown-menu-start` para no solapar la columna ID.
- **Scroll vertical** en la lista del dropdown de nombre para ver todos los proyectos que coinciden.

### Detalle de la story (modal)
- **Card al 75%** del ancho de pantalla, centrada (`nexus-modal-story-detail` en CSS; `modalDialogClass` en `openNexusFormModal`).
- **Parte superior en 3 columnas** (col-md-4): ID, Estado, Creado | Título, Prioridad, Actualizado | Descripción, Asignado a, **Sprint** (Sprint como último campo).
- **Criterios de aceptación por casillas**: por defecto 1 input; botón **"+ Añadir criterio"** añade una casilla nueva; cada fila tiene botón × para quitar (siempre queda al menos una). **Guardar criterios** envía el array al backend (PATCH `acceptance_criteria`).

### Infraestructura
- **ux.js**: opción `modalDialogClass` en `buildNexusFormCardModal` / `openNexusFormModal` para modales anchos.
- **design-system.css**: clase `.nexus-modal-story-detail` (max-width: 75%, width: 75%).
- **Regla de proyecto**: `.cursor/rules/nexus-no-cursor-attribution.mdc` — no incluir atribución "Made with Cursor" ni similar en el código del repositorio.

---

## Archivos modificados / añadidos (esta entrega)

| Archivo | Cambio |
|---------|--------|
| `public/js/views/projects.js` | Dropdown filtro nombre, eliminar filtro, popper fixed, scroll lista, 3 cols no aplica (es en story) |
| `public/js/views/stories.js` | Modal detalle 75%, 3 columnas, Sprint último, criterios por casillas con + y × |
| `public/js/ux.js` | Soporte `modalDialogClass` en modal de formulario |
| `public/css/design-system.css` | Clase `.nexus-modal-story-detail` |
| `.cursor/rules/nexus-no-cursor-attribution.mdc` | **Nuevo** — regla sin atribución Cursor |

---

## Cómo actualizar el repositorio

```bash
git pull origin master
```

Si tenéis cambios locales, haced commit o stash antes del pull. Tras el pull, el resto de archivos modificados que aparezcan en `git status` pueden corresponder a otras sesiones; esta entrega se centra en los listados arriba.
