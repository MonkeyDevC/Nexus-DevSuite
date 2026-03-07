# Plan ETAPA 11 — Estilización del login

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase de evolución del producto)  
**Objetivo:** Rediseñar la pantalla de inicio de sesión con un layout de dos columnas, formulario minimalista a la izquierda e ilustración o bloque visual a la derecha, con estética moderna y alineada a la marca NEXUS DevSuite.  
**Estado:** Diseñado por PO MASTER — ✅ Validado por SYSTEM ARCHITECT (docs/VALIDACION_ARQUITECTONICA_ETAPA_11_ESTILIZACION_LOGIN.md, docs/AJUSTES_PO_ETAPA_11_SEGUN_ARCHITECT.md)

**Referencia visual:** Layout tipo “login split” (formulario 40% izquierda, bloque visual 60% derecha), similar a pantallas de login modernas con ilustración o gradiente en el panel derecho.

---

## 1. Contexto

- **Situación actual:** La pantalla de login (`#/login`) existe desde la Etapa 7: formulario centrado con Bootstrap (email, contraseña, botón “Entrar”) y mensaje de error. Funcionalmente correcta pero visualmente básica y sin identidad de marca.
- **Objetivo de la etapa:** Transformar el login en una pantalla de bienvenida con diseño de dos columnas: panel izquierdo para el formulario (limpio, minimalista) y panel derecho para un bloque visual (ilustración, gradiente o composición gráfica) que refuerce la identidad NEXUS DevSuite. Sin cambiar la lógica de autenticación ni los endpoints; solo HTML/CSS y, si hace falta, mínimos ajustes en la vista login (public/js/views/login.js).
- **Nota:** La corrección de CSP (Bootstrap desde CDN bloqueado) es independiente; si aún no está aplicada, conviene resolverla en paralelo o antes para que los estilos se carguen correctamente (ver docs/PROMPT_MASTER_DEVELOPER_CSP_BOOTSTRAP.md).

---

## 2. Alcance (solo frontend — pantalla de login)

| Elemento | Especificación |
|----------|----------------|
| **Backend** | Sin cambios. POST /auth/login y flujo JWT se mantienen. |
| **Frontend** | Solo la ruta/pantalla de login: layout, estilos, posible ilustración o bloque visual. Opcional: hoja de estilos específica para login (ej. `public/css/login.css`) o estilos en el propio HTML/vista. |
| **Stack** | Mismo que el resto de la app: HTML5, Bootstrap 5, JavaScript vanilla. Se permiten CSS adicional (custom o variables) y recursos estáticos (imágenes, SVG) en `public/`. |

---

## 3. Diseño objetivo (referencia funcional y estética)

El resultado debe evocar un login moderno de dos columnas con la siguiente estructura:

### 3.1 Layout general

- **Vista desktop:** Dos columnas en la misma página.
  - **Columna izquierda (~40%):** Fondo claro (blanco o gris muy suave). Contiene únicamente el formulario de inicio de sesión y elementos de apoyo (logo, título, enlaces).
  - **Columna derecha (~60%):** Bloque visual que ocupe todo el alto de la ventana. Puede ser: ilustración (SVG/imagen), gradiente, o composición de formas/iconografía que transmita “producto software / suite de desarrollo” (temática técnica, espacial o abstracta, evitando genéricos corporativos).
- **Vista móvil:** Columna derecha puede ocultarse o mostrarse arriba/abajo de forma reducida; el formulario debe seguir siendo usable y legible (responsive).

### 3.2 Panel izquierdo (formulario)

- **Logo y marca:** En la parte superior, logo o nombre “NEXUS DevSuite” con estilo consistente con el resto de la aplicación.
- **Título:** “Iniciar sesión” (o “Login”) bien visible.
- **Texto opcional:** Si se desea, una línea tipo “¿No tienes cuenta? [Enlace]” (el enlace puede ir a documentación o quedar deshabilitado hasta tener registro).
- **Campos:**  
  - Email (etiqueta “Email” o “Correo electrónico”), input con borde discreto y opcional icono.  
  - Contraseña (etiqueta “Contraseña”), input tipo password, opcional icono mostrar/ocultar.
- **Opcional:** Casilla “Recordarme” (Remember me) si se decide implementar persistencia de sesión en el cliente (no es requisito de esta etapa).
- **Botón principal:** Botón de acción destacado (ej. “Entrar” o “Iniciar sesión”) con color de acento (naranja, azul o el que se defina como primario para NEXUS). Ancho completo o ancho amplio dentro del formulario.
- **Enlace secundario:** Opcional “¿Olvidaste tu contraseña?” (puede ser solo visual y sin backend en esta etapa).
- **Pie del panel:** Opcional: copyright “© 2026 NEXUS DevSuite” y enlaces “Términos” / “Privacidad” (placeholders si no existen páginas).
- **Mensaje de error:** El mensaje de error actual (credenciales incorrectas, etc.) debe mostrarse de forma visible pero integrada en el diseño (ej. alert Bootstrap o bloque con borde/color de error encima o debajo del formulario).

### 3.3 Panel derecho (bloque visual)

- **Contenido:** Ilustración, gradiente o composición gráfica que:
  - Ocupe la altura de la ventana (o el alto del viewport).
  - Transmita sensación moderna y alineada a “suite de desarrollo” o “plataforma” (temática espacial, código, componentes, etc., según disponibilidad de recursos).
  - No distraiga del formulario; el foco debe seguir siendo el panel izquierdo.
- **Implementación posible:**  
  - Imagen/SVG en `public/` (ej. `public/images/login-illustration.svg` o `.png`).  
  - O CSS puro: gradiente + formas (p. ej. círculos, líneas) con colores de marca.  
  - Opcional: marca de agua o texto discreto “NEXUS” en el panel derecho.

### 3.4 Identidad y accesibilidad

- **Colores:** Definir un color de acento para botón y enlaces (ej. naranja #f97316 o azul primario). Mantener contraste suficiente para texto y botones (WCAG nivel AA recomendado).
- **Tipografía:** Usar la misma familia que el resto de la app o una sans-serif legible (ej. system-ui, Inter, o la que use el proyecto).
- **Responsive:** En pantallas pequeñas, el formulario debe poder usarse sin scroll horizontal; el panel derecho puede colapsar o mostrarse en versión reducida.

---

## 4. Criterios de aceptación (resumen)

- Layout de dos columnas en desktop: formulario a la izquierda (~40%), bloque visual a la derecha (~60%).
- Formulario incluye: logo/marca, título “Iniciar sesión”, campos Email y Contraseña, botón principal de acento, mensaje de error integrado. Opcional: “Recordarme”, “¿Olvidaste contraseña?”, pie con copyright/enlaces.
- Panel derecho con ilustración, gradiente o composición visual coherente con NEXUS DevSuite (temática técnica/moderna).
- Diseño responsive: en móvil el formulario es usable; el panel derecho puede ocultarse o simplificarse.
- No se modifica el flujo de login (POST /auth/login, JWT, redirección a #/dashboard); solo cambia la presentación.
- Sin cambios en el backend; sin regresión en el resto de la aplicación (dashboard y demás rutas siguen funcionando).

---

## 5. QA (6 niveles) — aplicación a la etapa

| Nivel | Criterio para ETAPA 11 |
|-------|-------------------------|
| **Funcional** | Login sigue funcionando: enviar credenciales correctas redirige a dashboard; credenciales incorrectas muestran mensaje de error. |
| **Dominio** | Solo se toca la pantalla de login; no se alteran roles ni permisos. |
| **Negativa** | Campos vacíos o inválidos se manejan igual que antes; el mensaje de error se ve correctamente. |
| **UX** | Layout de dos columnas visible en desktop; formulario legible y botón claramente identificable; responsive sin roturas. |
| **Visual** | Estética coherente con la referencia (split, acento de color, bloque visual derecho). |
| **Regresión** | Navegación al dashboard tras login correcto; resto de pantallas sin cambios no deseados. |

---

## 6. Entregables

- Pantalla de login rediseñada según este plan (HTML/CSS y, si aplica, ajustes en `public/js/views/login.js`).
- Recursos estáticos en `public/` si se usan (imagen/SVG del panel derecho).
- Opcional: hoja de estilos `public/css/login.css` o sección documentada en el código.
- Evidencia de cierre: capturas o descripción breve del resultado (desktop y móvil) en docs/EVIDENCIA_ETAPA_11_ESTILIZACION_LOGIN_YYYY-MM-DD.md.

---

## 7. Referencias

- **Vista actual:** `public/js/views/login.js`, contenido inyectado en `#content` cuando la ruta es `#/login`.
- **Estructura HTML:** El layout del login puede construirse dentro de la vista (login.js) o con un contenedor específico en `public/index.html` solo para la ruta de login; se recomienda no complicar el index y mantener la lógica en la vista.
- **CSP:** Si los estilos no cargan, ver docs/PROMPT_MASTER_DEVELOPER_CSP_BOOTSTRAP.md.

---

*Documento de diseño para ETAPA 11. Actualizar si el SYSTEM ARCHITECT propone cambios.*
