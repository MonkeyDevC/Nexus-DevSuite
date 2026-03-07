# Prompt de implementación — Ajuste barra superior (logo, búsqueda centrada, menú de puntos)

**Para:** MASTER DEVELOPER  
**Referencia:** Wireframe/anotación del CEO (imagen de referencia: barra superior con logo, Nexus DevSuite, búsqueda centrada, menú de puntos con “Añadir proyecto”).  
**Archivos afectados:** `public/index.html`, `public/css/design-system.css`, `public/js/layout.js`  
**Alcance:** Solo frontend. Sin cambios en API ni backend.

---

## 1️⃣ OBJETIVO

Ajustar la **barra superior** (#app-topbar) para que coincida con el diseño indicado en la imagen de referencia:

1. **Izquierda:** Un **logo** (icono de Nexus DevSuite) y, a continuación, el texto **"Nexus DevSuite"** como marca/enlace a inicio.
2. **Centro:** La **barra de búsqueda** ("Buscar") **centrada horizontalmente** en la barra.
3. **Derecha:** Mantener iconos de Ayuda y Aplicaciones (rejilla); **sustituir el botón "+" suelto** por un **menú desplegable de tres puntos** (kebab) que incluya la opción **"Añadir proyecto"** con icono y texto, y permita más opciones con icono y nombre en el futuro. A la derecha, el avatar de usuario con su dropdown (sin cambios de funcionalidad).

---

## 2️⃣ REGLAS INNEGOCIABLES

- **Solo frontend:** Modificar únicamente `public/index.html`, `public/css/design-system.css` y, si hace falta, `public/js/layout.js`. No tocar `src/` ni API.
- **Design system:** Reutilizar variables y clases de `public/css/design-system.css` (colores, radios, espaciados). No romper estilos del sidebar ni del contenido principal.
- **Funcionalidad existente:** La acción "Añadir proyecto" debe seguir llevando a #/projects o abriendo el flujo de creación de proyecto que use la vista actual (por ejemplo, el botón "+ New" que ya existía). Solo cambia la ubicación: de un botón "+" a un ítem del menú de tres puntos.
- **Accesibilidad:** Botones e ítems de menú con `aria-label` o texto visible; el menú de tres puntos debe ser operable por teclado (Bootstrap dropdown).
- **Responsive:** En vista móvil (sidebar colapsable), la barra superior debe seguir mostrando logo + Nexus DevSuite (o versión abreviada si no cabe), búsqueda y los controles de la derecha sin romper el layout.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Izquierda: logo + "Nexus DevSuite"

1. **Logo:** Añadir un **icono/logo** a la izquierda de la barra (dentro de `#app-topbar`), antes del texto "Nexus DevSuite". Puede ser:
   - Un SVG que represente la marca (por ejemplo, una "N" estilizada o un icono de app), o
   - Un elemento con la letra "N" dentro de un círculo/cuadrado redondeado, alineado con el design system (colores `--nexus-accent`, `--nexus-bg-sidebar` o similar).
   - El logo debe hacer clic a #/dashboard (o mismo destino que el texto "Nexus DevSuite") si se desea navegación desde ambos.

2. **Texto "Nexus DevSuite":** Restaurar o mantener visible el texto **"Nexus DevSuite"** inmediatamente a la derecha del logo, como enlace a #/dashboard. Estilo: tipografía en negrita, color primario, sin subrayado en estado normal. En móvil se puede acortar a "NEXUS" si el espacio es insuficiente (opcional).

3. **Estructura HTML sugerida (izquierda):** Por ejemplo:  
   `<a href="#/dashboard" class="nexus-topbar-brand">`  
   `  <span class="nexus-topbar-logo-icon">...</span>`  
   `  <span class="nexus-topbar-logo-text">Nexus DevSuite</span>`  
   `</a>`  
   Ajustar clases según convención actual del proyecto.

### FASE 2 — Centro: búsqueda centrada

4. **Centrar la barra de búsqueda:** La barra de búsqueda ("Buscar" con icono de lupa) debe quedar **centrada horizontalmente** en la barra superior. Opciones de implementación:
   - Usar una estructura de tres bloques en flexbox: **izquierda** (logo + Nexus DevSuite), **centro** (búsqueda con `flex: 1` y `justify-content: center`, o `margin: 0 auto` con ancho máximo), **derecha** (iconos + menú puntos + usuario). O
   - Usar grid o posicionamiento para que el bloque de búsqueda quede centrado respecto al viewport o al `#app-topbar`, manteniendo los otros dos bloques alineados a los extremos.

5. Asegurar que en escritorio la búsqueda se vea claramente en el centro y que en móvil no se solape con logo ni con los iconos de la derecha (por ejemplo, reduciendo ancho máximo o ocultando el texto "Nexus DevSuite" y dejando solo el logo).

### FASE 3 — Derecha: menú de tres puntos con "Añadir proyecto"

6. **Eliminar** el botón "+" independiente (`.nexus-topbar-btn-add` o `#btn-new`) de la barra.

7. **Añadir** un botón de **tres puntos verticales** (kebab) junto al avatar de usuario (entre el icono de aplicaciones y el avatar). Estilo: mismo tipo de botón de icono que Ayuda y Aplicaciones (tamaño y hover coherentes).  
   Icono tres puntos: tres círculos pequeños apilados verticalmente (⋮) o SVG equivalente.

8. **Menú desplegable del botón de tres puntos:** Al hacer clic se abre un dropdown (Bootstrap `dropdown` o equivalente) con ítems que tengan **icono + nombre**:
   - **Primer ítem obligatorio:** **"Añadir proyecto"** (o "Add project" si se mantiene inglés): icono (por ejemplo, plus o carpeta) + texto. Al hacer clic debe ejecutar la misma acción que el antiguo botón "+" (navegar a #/projects o disparar el flujo de creación de proyecto según la lógica actual en `layout.js` o en la vista de proyectos).
   - Dejar preparada la estructura para **más ítems** con icono y nombre (por ejemplo, "Nueva feature", "Nueva story", "Nuevo documento") para futuras funcionalidades; no es obligatorio implementar más ítems ahora, solo la estructura y al menos "Añadir proyecto".

9. **layout.js:** Actualizar la lógica que asignaba el clic del botón "+" (`#btn-new`): el nuevo disparador será el ítem "Añadir proyecto" del menú de tres puntos (por ejemplo, por `id="btn-new-project"` o por selector del primer ítem del menú). Mantener `window.location.hash = "#/projects"` o la acción que corresponda.

### FASE 4 — Verificación

10. Comprobar que en todas las rutas (#/dashboard, #/projects, etc.) la barra muestra: logo + "Nexus DevSuite" a la izquierda, búsqueda centrada, iconos Ayuda y Aplicaciones, menú de tres puntos (con "Añadir proyecto"), avatar de usuario.
11. Comprobar que "Añadir proyecto" desde el menú de tres puntos lleva a #/projects o abre el flujo de creación según lo definido.
12. Sin errores en consola; menús desplegables operables con teclado (Tab, Enter, Escape).

---

## 4️⃣ CRITERIOS DE ACEPTACIÓN

- [ ] **Izquierda:** Logo (icono) visible + texto "Nexus DevSuite" con enlace a #/dashboard.
- [ ] **Centro:** Barra de búsqueda ("Buscar") centrada horizontalmente en la barra superior.
- [ ] **Derecha:** Botón de tres puntos (kebab) abre un menú con al menos un ítem "Añadir proyecto" (icono + nombre). El clic en "Añadir proyecto" realiza la misma acción que el anterior botón "+" (ir a #/projects o crear proyecto).
- [ ] Estructura del menú de tres puntos preparada para más opciones con icono y nombre.
- [ ] Avatar de usuario y su dropdown (nombre, Salir) sin cambios funcionales.
- [ ] Design system y accesibilidad respetados; sin regresión en rutas ni en móvil.

---

## 5️⃣ ENTREGABLES Y EVIDENCIA

- **Archivos modificados:** Listar `public/index.html`, `public/css/design-system.css`, y si aplica `public/js/layout.js`.
- **Breve descripción:** Una o dos frases indicando que la barra tiene logo + Nexus DevSuite a la izquierda, búsqueda centrada y menú de puntos con "Añadir proyecto". Opcional: captura de pantalla de la barra actualizada.

---

**Referencia visual:** La imagen anotada por el CEO especifica: icono de Nexus DevSuite a la izquierda, texto "Nexus DevSuite", barra de búsqueda centrada, y "más opciones de tipo icono y nombre" (incluyendo añadir proyecto) en el menú de puntos al lado del usuario.
