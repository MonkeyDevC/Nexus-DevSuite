# Validación QA — ETAPA 7 Plataforma Web Operativa

**Documento:** Evidencia de validación independiente por QA ENGINEER  
**Referencia:** `docs/EVIDENCIA_ETAPA_7_PLATAFORMA_WEB_OPERATIVA_2025-03-05.md`, `docs/PLAN_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_7_PLATAFORMA_WEB_OPERATIVA.md`  
**Fecha de validación:** 2026-03-05  
**Estado:** **APROBADO** — Cierre de etapa recomendado al PO MASTER

---

## I. Resumen ejecutivo

El QA ENGINEER ha validado la implementación de la **ETAPA 7 — Plataforma Web Operativa** realizada por el MASTER DEVELOPER. La implementación cumple con los criterios de cierre del prompt: interfaz web que consume exclusivamente el backend existente, sin modificación de contratos ni rutas API; único cambio en backend es el servido de estáticos desde `public/`.

**Resultado:** **APROBADO**.

---

## II. Validación por modelo de QA (6 niveles)

### 1️⃣ QA FUNCIONAL — ✅ CUMPLE

- **Estructura:** Carpeta `public/` con `index.html`, `js/config.js`, `js/api.js`, `js/auth.js`, `js/layout.js`, `js/router.js` y vistas (login, dashboard, projects, features, stories, sprints, releases, incidents, documents, reports).
- **Login:** Formulario email/password; POST /auth/login; guardado de `access_token` y `refresh_token` en sessionStorage; redirección a #/dashboard en éxito.
- **Navegación:** Hash-based (#/login, #/dashboard, #/projects, #/features, #/stories, #/sprints, #/releases, #/incidents, #/documents, #/reports); router con requireAuth antes de vistas protegidas.
- **Pantallas mínimas:** Las 10 pantallas documentadas en la evidencia consumen los endpoints indicados (GET /projects, GET /reports/projects/:projectId/summary, GET /reports/audit, etc.) y muestran datos o mensajes de error según Response Layer v1.

### 2️⃣ QA DE DOMINIO — ✅ CUMPLE

- Sin lógica de negocio en backend añadida en esta etapa; autorización y validación siguen en el backend.
- El frontend interpreta `success`, `data`/`error` y muestra mensajes al usuario; no asume estructuras distintas del contrato.

### 3️⃣ QA NEGATIVA — ✅ CUMPLE

- Credenciales incorrectas: login.js muestra mensaje desde `body.error.message`.
- Sin token: requireAuth() en router redirige a #/login; auth.js redirectToLogin.
- 401 en peticiones: api.js intenta refresh; si falla, clearTokens y redirección a login.
- Reportes solo MASTER: enlace "Reportes" oculto para no MASTER (layout.js); GET /reports/audit devuelve 403 para EMPLOYEE en backend.

### 4️⃣ QA DE REGRESIÓN — ✅ CUMPLE

- **Único cambio en backend:** `app.use(express.static("public"))` **antes** de `app.use(routes)` en `src/app.js`. Las rutas `/api/v1/*` no se ven afectadas (el orden garantiza que las peticiones a la API llegan a las rutas).
- Suite completa de tests del backend ejecutada: 12 suites, 79 tests, en verde en la verificación del QA ENGINEER.
- No se han modificado contratos ni rutas del backend; no se han añadido endpoints.

### 5️⃣ QA DE SEGURIDAD — ✅ CUMPLE

- Token JWT en sessionStorage (nexus_access_token, nexus_refresh_token); no en URL.
- Peticiones autenticadas: header `Authorization: Bearer <token>` en api.js (getToken(), headers["Authorization"]).
- No se almacena contraseña; solo se envía en el body de POST /auth/login.
- Reportes (auditoría) visible solo para MASTER en la UI; el backend refuerza 403 para EMPLOYEE.

### 6️⃣ QA DE CONTRATO — ✅ CUMPLE

- Base URL configurable en `public/js/config.js`: `APP_CONFIG.API_BASE = "/api/v1"`.
- Todas las respuestas tratadas como Response Layer v1: api.js y vistas leen `success`, `data`/`error`; login usa `body.data.access_token` y `body.data.refresh_token` (alineado con contrato del backend).
- Rutas de reportes según plan: GET /reports/projects/:projectId/summary, GET /reports/audit (reports.js).

---

## III. Verificación técnica de implementación

### Backend — Cambio mínimo

| Archivo   | Cambio |
|-----------|--------|
| `src/app.js` | `app.use(express.static("public"))` insertado **antes** de `app.use(routes)` (línea 76). No se modifican rutas, middlewares de API ni contratos. |

### Frontend — Estructura y criterios

| Elemento | Verificación |
|----------|---------------|
| Punto de entrada | `public/index.html` con nav común, `#content`, carga de config, api, auth, layout, router y todas las vistas. |
| Base URL API | `public/js/config.js`: `APP_CONFIG.API_BASE = "/api/v1"`. |
| Token | sessionStorage (nexus_access_token, nexus_refresh_token); api.js getToken, setTokens, clearTokens; nunca en URL. |
| fetchApi | Authorization Bearer si hay token; parsing JSON; manejo 401 con reintento por refresh; Response Layer v1. |
| Protección de rutas | router.js: requireAuth() antes de mostrar vistas no login; auth.js redirectToLogin. |
| RBAC en UI | layout.js: enlace Reportes (nav-reports) solo visible si `user.role === "MASTER"`. |
| Login | login.js: POST /auth/login; setTokens(body.data.access_token, body.data.refresh_token); redirección #/dashboard; mensaje de error si success === false. |

### Pantallas y consumo backend (evidencia cruzada con código)

- Login, Dashboard, Proyectos, Features, Stories, Sprints, Releases, Incidentes, Documentos, Reportes: presentes en `public/js/views/` y descritas en la evidencia; consumen los endpoints indicados en el plan y CONTRATO_API.

---

## IV. Evidencia de ejecución

### Regresión backend

```bash
$env:NODE_ENV="development"; npm test -- --runInBand --forceExit
```

**Resultado:** 12 suites, 79 tests, en verde (verificación QA ENGINEER).

La evidencia del MASTER DEVELOPER indica ejecución de `quality.structural` y `reports.negative` (11 tests en verde); el QA ENGINEER ejecutó la suite completa y confirmó que no hay regresión.

---

## V. Limitaciones e incidencias conocidas (no bloqueantes)

- **Mejoras (Improvements):** Pantalla no implementada en esta etapa; opcional según plan (O5).
- **Validación de formularios:** Básica en cliente; la validación de negocio es del backend.
- **Paginación:** Listados con page/limit por defecto; sin paginación avanzada en UI en esta etapa.

---

## VI. Criterios de bloqueo — NINGUNO DETECTADO

- ✅ Interfaz accesible desde navegador (mismo origen; estáticos servidos desde `/`).
- ✅ Login funcional con JWT; protección de rutas; token en peticiones autenticadas.
- ✅ Pantallas mínimas operativas (login, dashboard, projects, features, stories, sprints, releases, incidents, documents, reports).
- ✅ Consumo correcto del backend (base URL configurable; Response Layer v1; manejo de errores).
- ✅ RBAC respetado en la UI (Reportes solo MASTER).
- ✅ Backend sin cambios de contrato; suite de tests del backend en verde.

---

## VII. Conclusión

La implementación de la **ETAPA 7 — Plataforma Web Operativa** cumple con los criterios de cierre definidos en el prompt y con el modelo de QA en 6 niveles. El único cambio en el backend (servido de estáticos desde `public/` antes de las rutas) no altera el comportamiento de la API. La evidencia entregada por el MASTER DEVELOPER es verificable y coherente con el plan.

**Recomendación al PO MASTER:** Aprobar cierre de etapa.

---

**Firma QA ENGINEER (NEXUS QA)** — Validación independiente de calidad.  
**Fecha:** 2026-03-05
