## Evidencia — Fase 4.1: Migración dominio Projects a React + API real

Fecha de generación: 2026-03-25

---

### 1) Archivos creados

- `frontend-react/src/pages/ProjectDetail.jsx`

### 2) Archivos modificados

- `frontend-react/src/pages/Projects.jsx`
- `frontend-react/src/app/router.jsx`
- `tests/e2e/react-microapp-integration.spec.js`

---

### 3) Endpoints consumidos (sin cambiar contrato)

- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`

Contrato respetado:
- Se consume Response Layer v1 sin transformación (`success`, `data`, `error`, `meta`).

---

### 4) Validación ejecutada

Frontend:
- `cd frontend-react`
- `npm run lint` => OK
- `npm run build` => OK

Híbrido (legacy + micro-app):
- `npx playwright test "tests/e2e/react-microapp-integration.spec.js" --project=chromium` => **1 passed**

Escenarios cubiertos:
- Deep link `#/react-test?path=/projects`
- Listado real de proyectos
- Click en proyecto -> detalle `/projects/:id`
- Volver a lista
- Navegación sidebar Dashboard/Projects
- Salida al legacy (desmontaje)

---

### 5) Problemas encontrados

- El test E2E encontró colisión de selector en enlaces “Dashboard” (sidebar y breadcrumb).
- Solución: selector más específico al sidebar (`getByRole("complementary")`).

---

FASE 4.1 COMPLETADA

