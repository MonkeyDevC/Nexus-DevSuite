## Evidencia — Fase 2: React Router + Shell persistente (micro-app)

Fecha de generacion: 2026-03-25

---

### 1) Archivos creados

- `frontend-react/src/app/router.jsx`
- `frontend-react/src/layouts/MainLayout.jsx`
- `frontend-react/src/pages/Dashboard.jsx`
- `frontend-react/src/pages/Projects.jsx`

---

### 2) Archivos modificados

- `frontend-react/src/app/App.jsx`
- `frontend-react/src/routes/ProtectedRoute.jsx`
- `frontend-react/package.json` (dependencia `react-router-dom`)
- `public/react-app/index.js` (regenerado por build)
- `tests/e2e/react-microapp-integration.spec.js` (ahora valida navegación interna)

---

### 3) Estructura de rutas (React)

- `/login` (publica)
- `/dashboard` (protegida)
- `/projects` (protegida)

Layout persistente:
- `MainLayout` envuelve rutas protegidas y renderiza `Outlet`.

Guard:
- `ProtectedRoute` redirige a `/login` si no autenticado.

---

### 4) Validaciones ejecutadas (evidencia real)

1) Frontend:
- `cd frontend-react`
- `npm run lint` => OK
- `npm run build` => OK (bundle ESM exporta `mount/unmount` y contiene router interno)

2) Híbrido (legacy + micro-app):
- `npx playwright test "tests/e2e/react-microapp-integration.spec.js" --project=chromium` => **1 passed**

Cobertura del test:
- Entrar a `#/react-test` => React monta en `#content`
- Navegación interna React Router:
  - Dashboard -> Projects -> Dashboard (sin recargar pagina)
- Salir a `#/dashboard` (legacy) => React desmonta
- Reingresar a `#/react-test` => no duplica instancia

---

### 5) Problemas encontrados

- Para mantener estabilidad híbrida sin rewrites del servidor en paths `/react/*`, el router interno se implementa con `MemoryRouter`.
  - Motivo: el backend actual no tiene fallback para servir HTML en rutas arbitrarias (solo `express.static("public")` + 404 JSON).
  - Impacto: navegación interna funciona sin recarga; la URL no se acopla al path (evita romper refresh).

---

### 6) Confirmacion de criterios de aceptación

- [x] React Router funcional
- [x] Layout persistente (Shell)
- [x] Rutas protegidas (AuthContext + ProtectedRoute)
- [x] Navegación interna fluida (sin recarga)
- [x] Integración híbrida intacta (legacy hash router sigue controlando fuera de `#/react-test`)

FASE 2 COMPLETADA

