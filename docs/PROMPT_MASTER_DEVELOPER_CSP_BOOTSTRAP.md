# Prompt — Corrección CSP: estilos y Bootstrap no cargan en la página web

**Para:** MASTER DEVELOPER  
**Prioridad:** Alta (la interfaz se ve sin estilos y sin comportamiento Bootstrap)  
**Archivos clave:** `src/app.js`, `public/index.html`

---

## 1. SÍNTOMA

En el navegador, al abrir la aplicación (ej. `http://localhost:3000/#/login`):

- **No se cargan los estilos** de la página (Bootstrap CSS): la vista se muestra con estilos por defecto del navegador.
- **No funciona el JavaScript de Bootstrap** (modales, collapse del navbar, etc.) porque el script del CDN está bloqueado.

La consola del navegador muestra errores de **Content Security Policy (CSP)**:

1. **Script bloqueado:**  
   `Loading the script 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js' violates the following Content Security Policy directive: "script-src 'self'". The action has been blocked.`

2. **Conexión/CSS bloqueada:**  
   `Connecting to 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css.map' violates the following Content Security Policy directive: "default-src 'self'". The request has been blocked.`

(El `.map` es secundario; lo importante es que tanto el CSS como el JS de Bootstrap vienen de `cdn.jsdelivr.net` y la CSP actual no lo permite.)

---

## 2. CAUSA RAÍZ

- En **`src/app.js`** se usa `app.use(helmet())` **sin configurar** la política de contenido.
- Helmet aplica por defecto una CSP estricta:
  - `script-src 'self'` → solo scripts del mismo origen → **bloquea** el JS de Bootstrap desde `https://cdn.jsdelivr.net`.
  - `default-src 'self'` (y en la práctica `style-src` hereda o restringe) → **bloquea** la carga del CSS (y del source map) desde el CDN.

- En **`public/index.html`** Bootstrap se carga desde el CDN:
  - `<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">`
  - `<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>`

Por tanto, la CSP actual es correcta desde el punto de vista de seguridad pero **incompatible** con el uso del CDN en el HTML.

---

## 3. OBJETIVO

Que la página web cargue correctamente:

- Estilos de Bootstrap (CSS desde el CDN o desde el propio servidor).
- JavaScript de Bootstrap (bundle desde el CDN o desde el propio servidor).

Sin relajar la seguridad más de lo necesario (solo permitir orígenes concretos, no `'unsafe-inline'`/`'unsafe-eval'` salvo que sea estrictamente necesario).

---

## 4. OPCIONES DE SOLUCIÓN (elegir una)

### Opción A — Ajustar CSP para permitir el CDN (recomendada si se mantiene el CDN)

- En **`src/app.js`**, configurar Helmet con `contentSecurityPolicy` para:
  - **script-src:** `'self'` y `https://cdn.jsdelivr.net`
  - **style-src:** `'self'` y `https://cdn.jsdelivr.net` (y `'unsafe-inline'` solo si Bootstrap lo requiere; en muchos casos no)
  - **connect-src:** si se usa solo para source maps, se puede añadir `https://cdn.jsdelivr.net` para que no falle la petición del `.map` (opcional; no es crítico para que se vean los estilos).

- Mantener el resto de directivas por defecto de Helmet (default-src, form-action, etc.) y no desactivar la CSP.

- Documentar en un comentario o en este doc que el frontend usa Bootstrap desde jsdelivr; si en el futuro se cambia a otro CDN o a recursos locales, actualizar la CSP.

### Opción B — Servir Bootstrap desde el propio servidor (sin CDN)

- Descargar los archivos de Bootstrap 5.2.3 (CSS y JS bundle) y colocarlos en `public/` (ej. `public/vendor/bootstrap.min.css` y `public/vendor/bootstrap.bundle.min.js`).
- En **`public/index.html`**, cambiar las URLs del CDN por rutas relativas a esos archivos (ej. `/vendor/bootstrap.min.css`, `/vendor/bootstrap.bundle.min.js`).
- No es necesario cambiar la CSP (todo sigue siendo `'self'`).

Ventaja: no se abre ningún origen externo en la CSP. Desventaja: hay que mantener copias locales y actualizarlas si se cambia de versión de Bootstrap.

---

## 5. CRITERIOS DE ACEPTACIÓN

- [ ] Al abrir `http://localhost:3000/#/login` (o la raíz), la página se ve con los estilos de Bootstrap (navbar, botones, formulario con el aspecto definido por Bootstrap).
- [ ] No aparecen en consola errores de CSP por el script ni por el CSS de Bootstrap (ni por el .map si se incluyó connect-src).
- [ ] El comportamiento de Bootstrap funciona: navbar colapsable (en móvil), modales si se usan (ej. en Administración), etc.
- [ ] No se han introducido directivas CSP inseguras innecesarias (p. ej. evitar `'unsafe-inline'` en script-src si no hace falta).
- [ ] La aplicación sigue sirviendo el frontend desde `public/` y el backend con Helmet activo; no se desactiva la CSP por completo.

---

## 6. REFERENCIAS

- **Helmet CSP:** [helmet contentSecurityPolicy](https://github.com/helmetjs/helmet/blob/main/docs/content-security-policy.md) — uso de `directives` para `script-src`, `style-src`, `connect-src`.
- **Frontend:** `public/index.html` (líneas 7 y 54: enlaces al CDN de Bootstrap).
- **Backend:** `src/app.js` (Helmet + `helmet.contentSecurityPolicy()` con directivas explícitas).

---

## 7. Resolución

**Opción elegida:** A — Ajustar CSP para permitir el CDN.  
**Fecha:** 2026-03-06.  
**Implementación en `src/app.js`:** (1) `app.use(helmet({ contentSecurityPolicy: false }))` para mantener el resto de cabeceras de Helmet sin la CSP por defecto. (2) `app.use(helmet.contentSecurityPolicy({ directives: { ... } }))` con directivas explícitas: `defaultSrc`, `scriptSrc`, `styleSrc`, `fontSrc`, `imgSrc`, `connectSrc` (incluye `https://cdn.jsdelivr.net` para CDN y .map), `objectSrc: ["'none']"`, `upgradeInsecureRequests: []`. No se usa `'unsafe-inline'` ni `'unsafe-eval'`. CORS, JWT y rutas sin cambios.

---

*Una vez aplicada la solución, se puede cerrar este documento o añadir una línea de “Resolución” con la opción elegida (A o B) y la fecha.*
