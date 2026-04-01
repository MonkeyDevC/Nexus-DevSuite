# Evidencia — Validación runtime e integración mínima Design System (2026-03-27)

## Alcance

- Ruta opcional `GET /__dev/design-system-smoke` cuando `import.meta.env.DEV` o `VITE_DS_SMOKE=1` en el bundle de Vite.
- Login: `Card`, `Input`, `Button` del design system (lógica de auth sin cambios).
- Dashboard: `PageContainer`, `Badge` (“Datos en vivo”), `Card` en bloque sprint activo; tablas usan `Badge` DS en columna estado.

## Coexistencia CSS / orden de imports

- Tokens `--ds-*` cargados en `main.jsx` con prefijo propio; no se observó rotura de selectores legacy en smoke manual ni en E2E.
- Módulos CSS del DS siguen con hash; clases legacy (`LoginPage.module.css`, `Dashboard.module.css`) solo añaden utilidades locales (`.dsLoginFormCard`, `.dsPageShell`, etc.) sin duplicar tokens.
- Login: `.dsLoginFormCard` anula borde/fondo/sombra del `Card` para no duplicar caja sobre el panel blanco existente.
- Dashboard: `.dsPageShell` pone padding del `PageContainer` en 0 para no sumar padding con `MainLayout .content`.

## Comandos ejecutados (evidencia)

```text
cd frontend-react && npm run build   → OK (Vite)
cd repo root && npx playwright test tests/e2e/design-system-runtime.spec.js --project=chromium → 3 passed
```

Nota: `npm run lint` en `frontend-react` reporta errores preexistentes en otros archivos (`SessionInactivityGuard.jsx`, `Modal.jsx`), no introducidos por esta fase.

## Smoke en bundle estático (Express + `public/react-app`)

Con `vite build` por defecto, `import.meta.env.DEV` es `false` y la ruta de smoke **no** se registra. Para QA del smoke sobre el mismo artefacto que sirve Express:

```bash
cd frontend-react
set VITE_DS_SMOKE=1&& npm run build
```

(En PowerShell: `$env:VITE_DS_SMOKE='1'; npm run build`.)

## Criterios de cierre

- Build frontend OK.
- E2E: login con marcadores DS; dashboard con `[data-ds-page-container]` y texto “Datos en vivo”.
- Sin cambios en AuthContext, guards, servicios ni contratos API.
