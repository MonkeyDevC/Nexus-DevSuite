# WAVE 6 — Resultados smoke / E2E y decisión de cierre

**Entorno:** ejecución local el **2026-03-27** con servidor ya disponible en `http://localhost:3000` (mismo `BASE` que [`tests/e2e/react-microapp-integration.spec.js`](../../tests/e2e/react-microapp-integration.spec.js)). Comando: `npx playwright test` (Chromium).

## Resultados por flujo / spec

| Área | Especificación | Resultado | Evidencia |
|------|----------------|-----------|-----------|
| React montaje y rutas | `react-microapp-integration.spec.js` línea ~229 “React monta una sola vez...” | **PASS** | 1 passed ~3s |
| Dashboard (dentro de spec de montaje) | Navegación a `/dashboard`, texto “Dashboard - Nexus DevSuite” | **PASS** (indirecto en test de montaje + flujo largo) | Cubierto en test ~229; carga real depende de API |
| Work management amplio | `react-microapp-integration.spec.js` ~338 | **FAIL** | Expect `story-detail-message` **“Elemento no encontrado”** vs UI **“Historia no encontrada.”** — desalineación **copy/asseveration**, no fallo de montaje |
| Admin RBAC | `react-microapp-integration.spec.js` ~654 | **FAIL** | Expect `admin-table` / `admin-card`: elementos **eliminados** en WAVE 5 (UI actual usa `admin-section-users`, etc.) |
| Releases WAVE 4 | `tests/e2e/wave4-releases.spec.js` | **PASS** | 1 passed ~2.9s — “proyecto → release UI → assign story → start → publish” |

## Resumen códigos

| Código | Cantidad |
|--------|----------|
| PASS | 2 specs independientes verificados (mount + wave4-releases) |
| FAIL | 2 (work management copy; admin selectors obsoletos) |
| BLOCKED | 0 (entorno respondió) |

## Interpretación

- **No** se concluye que el producto React esté roto:** los FAIL actuales son **deuda de test** (expectativas desactualizadas tras WAVE 5 y copy en `StoryDetail`).
- **Recomendación:** actualizar Playwright: `admin-section-users` visible; reemplazar expect de mensaje de historia o normalizar copy en app (decisión producto separada).

---

## Decisión final de migración

**Veredicto:** `MIGRATION_CLOSED_WITH_NOTES`

### Justificación (evidencia)

1. **Paridad núcleo Scrum en React:** Auth, Projects, Features, Stories, Sprints, Incidents, Releases (flujo canónico), Dashboard, Admin, Backlog — cubiertos con API y `shared/http`/services ([`wave-6-final-parity-audit.md`](wave-6-final-parity-audit.md)).
2. **GAP explícito no bloqueante para “shell único”:** Change Requests **sin pantalla React**; módulos Documents/Reports/Improvements **fuera del router React** (hueco de producto o fase futura, no regresión del shell actual).
3. **Legacy:** `public/js` **desconectado** del `index.html` actual; rutas release-feature **siguen vivas** por compat/tests — gestionado como **KEEP_TEMPORARILY** ([`wave-6-legacy-deprecation-inventory.md`](wave-6-legacy-deprecation-inventory.md)).
4. **E2E:** verde en **releases** y **montaje React**; rojo en dos casos por **mantenimiento de tests**, no por evidencia de caída de servidor en esta corrida.

### No se eligió `MIGRATION_CLOSED` puro

- Persisten **gaps funcionales de UI** (CR, documentos/reportes como producto completo) y **deuda de pruebas E2E**.

### No se eligió `MIGRATION_NOT_READY_TO_CLOSE`

- El **producto principal servido** es la SPA React con API real; los fallos E2E son **ajustables** y no indican bloqueo de migración del shell.

---

## Checklist de aceptación WAVE 6

| Criterio | Estado |
|----------|--------|
| Auditoría de paridad | OK — `wave-6-final-parity-audit.md` |
| Inventario legacy clasificado | OK — `wave-6-legacy-deprecation-inventory.md` |
| Release-feature y public/js evaluados | OK — mismo inventario + focos §3 |
| Smoke/E2E documentado con honestidad | OK — esta tabla |
| Decisión explícita | OK — `MIGRATION_CLOSED_WITH_NOTES` |
