# Evidencia ETAPA 11 — Estilización del login

**Fecha:** 2026-03-06  
**Referencia:** docs/PLAN_ETAPA_11_ESTILIZACION_LOGIN.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_11_ESTILIZACION_LOGIN.md

---

## 1. Archivos creados o modificados

### Creados
- **public/css/login.css** — Estilos del login: layout de dos columnas (flex), panel izquierdo fondo #f8fafc, panel derecho con gradiente y formas (::before/::after), marca “NEXUS” discreta, botón de acento #f97316, mensaje de error integrado, pie con copyright y enlaces placeholder. Media query: en viewport &lt; 768px el panel derecho se oculta (d-none en .login-panel-right) y el formulario ocupa el ancho completo.
- **docs/EVIDENCIA_ETAPA_11_ESTILIZACION_LOGIN_2026-03-06.md** — Este documento.

### Modificados
- **public/js/views/login.js** — HTML reemplazado por layout split: contenedor `.login-page` con `.login-panel-left` (marca “NEXUS DevSuite”, subtítulo, título “Iniciar sesión”, formulario con id/for y autocomplete, botón “Entrar” con clase `btn-nexus-accent`, `#login-error` con clase `login-error`, enlace “¿Olvidaste tu contraseña?” y pie con “© 2026 NEXUS DevSuite”, “Términos”, “Privacidad”) y `.login-panel-right` (bloque `.login-visual` con gradiente y marca de agua “NEXUS”). Lógica de envío (POST /auth/login, tokens, redirección a #/dashboard) sin cambios.
- **public/index.html** — Inclusión de `<link href="css/login.css" rel="stylesheet">` en el `<head>` (si no estaba ya presente).

---

## 2. Diseño implementado

| Elemento | Implementación |
|----------|----------------|
| **Layout desktop** | Dos columnas: izquierda 40% (formulario, fondo claro), derecha 60% (bloque visual). Flexbox con min-height 100vh. |
| **Panel izquierdo** | Marca “NEXUS DevSuite”, subtítulo “Suite de desarrollo y gestión de producto”, título “Iniciar sesión”, campos Email y Contraseña con etiquetas, botón naranja “Entrar”, mensaje de error con clase `.login-error`, enlace “¿Olvidaste tu contraseña?”, pie con copyright y enlaces Términos/Privacidad (placeholders). |
| **Panel derecho** | Gradiente CSS (azul oscuro a gris/slate) con círculos decorativos (::before naranja, ::after azul) y marca de agua “NEXUS” en la esquina inferior derecha. |
| **Responsive** | En &lt; 768px el panel derecho no se muestra; el formulario ocupa todo el ancho y sigue siendo usable sin scroll horizontal. |
| **Accesibilidad** | Etiquetas asociadas (for/id), autocomplete en inputs, role="alert" en el mensaje de error, contraste suficiente (texto oscuro sobre fondo claro, botón #f97316 sobre blanco). |

---

## 3. Criterios de aceptación

- [x] Layout de dos columnas en desktop: formulario ~40% izquierda, bloque visual ~60% derecha.
- [x] Formulario con marca, título “Iniciar sesión”, campos Email y Contraseña, botón de acento, mensaje de error integrado; opcional olvidaste contraseña y pie con copyright.
- [x] Panel derecho con gradiente y composición visual (formas y marca NEXUS).
- [x] Responsive: en móvil formulario usable, panel derecho oculto.
- [x] Flujo de login sin cambios: POST /auth/login, JWT, redirección a #/dashboard.
- [x] Sin cambios en backend; sin regresión en el resto de la aplicación.

---

## 4. Pasos para verificar

1. Abrir `http://localhost:3000/#/login` en desktop: se ven las dos columnas, formulario a la izquierda y bloque visual a la derecha.
2. Iniciar sesión con credenciales válidas: redirección a #/dashboard y navegación normal.
3. Introducir credenciales incorrectas: aparece el mensaje de error debajo del título, integrado en el diseño.
4. Reducir el ancho del navegador por debajo de 768px: el panel derecho desaparece y el formulario ocupa todo el ancho.
5. Comprobar que el resto de rutas (dashboard, proyectos, admin, etc.) siguen funcionando tras el login.

---

## 5. Referencias

- Plan: **docs/PLAN_ETAPA_11_ESTILIZACION_LOGIN.md**
- Prompt: **docs/PROMPT_MASTER_DEVELOPER_ETAPA_11_ESTILIZACION_LOGIN.md**
- Validación arquitectónica: **docs/VALIDACION_ARQUITECTONICA_ETAPA_11_ESTILIZACION_LOGIN.md**
- Ajustes PO: **docs/AJUSTES_PO_ETAPA_11_SEGUN_ARCHITECT.md**
- CSP (si los estilos no cargan): **docs/PROMPT_MASTER_DEVELOPER_CSP_BOOTSTRAP.md**
