# Prompt de implementación — ETAPA 11 Estilización del login

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_11_ESTILIZACION_LOGIN.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_11_ESTILIZACION_LOGIN.md, docs/AJUSTES_PO_ETAPA_11_SEGUN_ARCHITECT.md, docs/CHECKLIST_ETAPAS_PROYECTO.md  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 11 — Estilización del login** siguiendo el plan `docs/PLAN_ETAPA_11_ESTILIZACION_LOGIN.md`.

**Propósito:** Rediseñar la pantalla de inicio de sesión (`#/login`) con layout de dos columnas: panel izquierdo para el formulario (minimalista, con marca NEXUS DevSuite) y panel derecho para un bloque visual (ilustración, gradiente o composición gráfica moderna). El flujo de autenticación (POST /auth/login, JWT, redirección a #/dashboard) no cambia; solo la presentación.

**Referencia visual:** Login tipo “split”: ~40% ancho formulario a la izquierda (fondo claro), ~60% bloque visual a la derecha (ilustración o gradiente con temática técnica/espacial/moderna). Botón de acento (ej. naranja o azul), campos con etiquetas claras, mensaje de error integrado.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **Backend sin cambios:** No modificar endpoints ni lógica de autenticación. La vista de login sigue usando POST /auth/login y el mismo manejo de tokens y redirección.
- **Solo frontend:** Cambios únicamente en `public/`: vista login (public/js/views/login.js), HTML/CSS y recursos estáticos (imágenes, SVG) si se usan.
- **Stack:** Mantener HTML5, Bootstrap 5 y JavaScript vanilla. Se permite CSS adicional (archivo `public/css/login.css` o estilos inline/embed si se prefiere).
- **Responsive:** En desktop: dos columnas; en móvil: formulario usable, panel derecho puede ocultarse o mostrarse reducido. Sin scroll horizontal.
- **Regresión:** El resto de la aplicación (dashboard, proyectos, admin, etc.) no debe verse afectada. Tras login correcto, redirección a #/dashboard debe seguir funcionando.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Layout de dos columnas

1. **Estructura HTML del login:** Modificar el HTML generado en `public/js/views/login.js` (o el contenedor donde se inyecta) para que en desktop haya dos columnas:
   - **Izquierda (~40%):** Contenedor con fondo claro (blanco o gris muy suave) que incluya logo/marca, título “Iniciar sesión”, formulario (email, contraseña), botón principal y mensaje de error. Opcional: “¿Olvidaste tu contraseña?”, pie con copyright.
   - **Derecha (~60%):** Contenedor que ocupe el alto de la ventana (min-height: 100vh o equivalente) con el bloque visual.
2. Usar Bootstrap grid (row/col) o flexbox/CSS grid para las dos columnas. Asegurar que en viewport pequeño (móvil) la columna derecha se oculte o se muestre arriba/abajo de forma que el formulario quede accesible.

### FASE 2 — Panel izquierdo (formulario)

3. **Marca:** Mostrar “NEXUS DevSuite” (o logo si existe) en la parte superior del panel izquierdo.
4. **Formulario:** Mantener campos Email y Contraseña con etiquetas visibles; inputs con estilo coherente (bordes, padding). Opcional: icono en inputs o botón “mostrar/ocultar contraseña”.
5. **Botón principal:** Un solo botón de envío (ej. “Entrar”) con **color de acento** (naranja tipo #f97316 o azul primario del proyecto). Ancho completo o ancho amplio dentro del formulario.
6. **Mensaje de error:** El bloque `#login-error` debe mostrarse integrado en el diseño (ej. alert Bootstrap o div con borde/color de error) encima o debajo del formulario; no romper el layout cuando aparece.
7. Opcional: enlace “¿Olvidaste tu contraseña?” (puede ser solo visual); pie con “© 2026 NEXUS DevSuite” y enlaces placeholder “Términos” / “Privacidad”.

### FASE 3 — Panel derecho (bloque visual)

8. **Contenido del panel derecho:** Implementar una de las siguientes opciones (o combinación):
   - **Opción A:** Imagen o SVG en `public/images/` (ej. `login-illustration.svg`) con temática técnica/espacial/moderna (suite de desarrollo, código, componentes). La imagen debe escalar bien y ocupar el alto del viewport.
   - **Opción B:** Bloque con **gradiente CSS** (ej. azul oscuro a morado/naranja) y formas decorativas (círculos, líneas) en CSS o SVG inline, con sensación “producto software” o “plataforma”.
   - **Opción C:** Ilustración libre (SVG/PNG) que evite genéricos corporativos; preferible temática espacial, código o abstracta.
9. Opcional: texto discreto “NEXUS” o marca de agua en el panel derecho.
10. Asegurar que el panel derecho no genere scroll horizontal y que en móvil no oculte el formulario.

### FASE 4 — Estilos y detalle

11. **Hoja de estilos:** Crear `public/css/login.css` (o incluir en un bloque ya existente) con estilos específicos del login: colores de acento, espaciado del formulario, tipografía del título y del botón. Cargar el CSS en la página cuando corresponda (en index.html de forma global o inyectando link solo en ruta login si se prefiere).
12. **Accesibilidad:** Contraste suficiente en texto y botón (recomendado WCAG AA). Etiquetas asociadas a los inputs.
13. **Consistencia:** Revisar que el navbar no se muestre en la ruta de login (ya se hace con hideNav()); el contenido del login debe ocupar toda la ventana o el área de contenido sin solapamientos.

---

## 4️⃣ CRITERIOS DE ACEPTACIÓN

- [ ] En desktop se ve layout de dos columnas: formulario a la izquierda (~40%), bloque visual a la derecha (~60%).
- [ ] Formulario incluye: marca NEXUS DevSuite, título “Iniciar sesión”, campos Email y Contraseña, botón de acento, mensaje de error visible cuando falla el login.
- [ ] Panel derecho muestra ilustración, gradiente o composición visual coherente con “suite de desarrollo” o “plataforma”.
- [ ] En móvil el formulario es usable; panel derecho oculto o reducido sin romper la vista.
- [ ] Login funcional: credenciales correctas → redirección a #/dashboard; incorrectas → mensaje de error.
- [ ] Sin cambios en backend; sin regresión en el resto de la app.

---

## 5️⃣ ENTREGABLES

- Código en `public/js/views/login.js` (y opcionalmente `public/index.html` si se añade contenedor o link a CSS).
- Archivo `public/css/login.css` (o equivalente) y recursos en `public/images/` si se usan.
- Evidencia: capturas de pantalla (desktop y móvil) o descripción en `docs/EVIDENCIA_ETAPA_11_ESTILIZACION_LOGIN_YYYY-MM-DD.md`.

---

## 6️⃣ REFERENCIAS

- **Plan detallado:** docs/PLAN_ETAPA_11_ESTILIZACION_LOGIN.md  
- **Vista actual:** public/js/views/login.js  
- **CSP (si los estilos no cargan):** docs/PROMPT_MASTER_DEVELOPER_CSP_BOOTSTRAP.md  

---

## 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (opcional)

- Si en el entorno de despliegue los estilos del login **no se cargan** (p. ej. por CSP bloqueando Bootstrap desde CDN), aplicar o verificar la solución descrita en **`docs/PROMPT_MASTER_DEVELOPER_CSP_BOOTSTRAP.md`** para que el rediseño se visualice correctamente. Es una dependencia de ejecución, no un requisito arquitectónico; tenerla en cuenta asegura que el resultado se vea como se diseñó.

---

*Prompt para MASTER DEVELOPER — ETAPA 11 Estilización del login. Validado por SYSTEM ARCHITECT (docs/VALIDACION_ARQUITECTONICA_ETAPA_11_ESTILIZACION_LOGIN.md).*
