## Evidencia — Fase 1: Integracion micro-app React (SPA legacy)

Fecha de generacion: 2026-03-25

---

### 1) Archivos modificados

- `public/js/router.js`
- `frontend-react/src/main.jsx`
- `frontend-react/vite.config.js`

---

### 2) Archivos creados

- `public/js/reactMount.js`
- `tests/e2e/react-microapp-integration.spec.js`

---

### 3) Archivos generados (build)

- `public/react-app/index.js`
- `public/react-app/assets/*` (chunks + assets del build de Vite)
- `public/react-app/index.html` (generado por Vite)

---

### 4) Integracion funcional verificada

Se valida que:

1. Navegar a `#/react-test` monta React en `#content`.
2. Navegar fuera (a `#/dashboard`) desmonta React y limpia el contenedor (no queda el nodo con `data-nexus-react-microapp='true'`).
3. No duplica contenido React en una segunda entrada a `#/react-test`.

---

### 5) Validaciones ejecutadas (evidencia real)

1. Frontend:
   - `cd frontend-react && npm run build` (OK)
2. E2E:
   - `npx playwright test "tests/e2e/react-microapp-integration.spec.js" --project=chromium` => **1 passed**

---

### 6) Problemas encontrados

Durante el ajuste de build:
- En modo `build.lib` inicial, el bundle dependia de `process` en el navegador y rompía el import.
- Se corrige con `define: { "process.env.NODE_ENV": "production" }` en `vite.config.js`.

---

### 7) Confirmacion de criterios de aceptacion

- React visible en `#/react-test` dentro de `#content`: OK
- Navegacion legacy intacta: OK (segundo paso del test hacia `#/dashboard`)
- No duplica mount: OK (conteo de `Cerrar sesion` = 1)
- Montaje/desmontaje correcto: OK (presencia/ausencia del nodo micro-app)

**FASE 1 INICIADA CORRECTAMENTE**

