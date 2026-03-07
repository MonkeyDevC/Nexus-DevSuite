# Prompt de ejecución — ETAPA 15 Panel administrativo UI

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_15_PANEL_ADMINISTRATIVO_UI.md, docs/CHECKLIST_ETAPAS_PROYECTO.md, nexus-plan-maestro-etapas.mdc (ETAPA 15)  
**Estructura:** nexus-engineering-execution.mdc  
**Estado:** Pendiente validación SYSTEM ARCHITECT y ajustes PO; no ejecutar hasta aprobación.

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 15 — Panel administrativo UI** siguiendo el plan `docs/PLAN_ETAPA_15_PANEL_ADMINISTRATIVO_UI.md`. Aplicar wireframes y design system a #/admin, #/admin/users, #/admin/audit y #/admin/metrics. Solo frontend; acceso solo MASTER; sin cambios en API.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **Solo frontend:** Modificar únicamente archivos bajo `public/` (principalmente `public/js/views/admin.js` y estilos en `public/css/` o design-system.css). No tocar `src/` ni endpoints.
- **Design system Etapa 12:** Usar clases y variables de `public/css/design-system.css` (cards, badges, botones, tablas, empty state).
- **Guard MASTER:** No alterar la lógica de acceso; solo MASTER debe poder ver las rutas #/admin*. Si ya existe redirección o 403, mantenerla.
- **API existente:** Consumir solo endpoints actuales (usuarios, auditoría, GET /system/metrics). No crear endpoints nuevos.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Admin dashboard (#/admin)

**Archivo:** `public/js/views/admin.js` (o lógica equivalente para #/admin).

1. Título de página: "Administration".
2. Tres tarjetas (design system): (1) **Users** — icono + texto "Open", enlace a #/admin/users; (2) **Audit Logs** — icono + "Open", enlace a #/admin/audit; (3) **Metrics** — icono + "Open", enlace a #/admin/metrics.
3. Sidebar: sección Administration expandida con ítems Users Management, Audit Logs, Metrics; ítem activo resaltado según ruta.

### FASE 2 — Users (#/admin/users)

4. Breadcrumb: Administration / Users Management. Título "Users".
5. Barra: input búsqueda, dropdown "filter by role" (All, MASTER, EMPLOYEE), botón "+ New User".
6. Tabla: columnas **Email**, **Role**, **Status**, **Actions** (edit, lock/password, delete). Paginación. Empty state si aplica.
7. Mantener modales/flujos existentes de crear/editar usuario y cambiar contraseña (sin cambiar contratos API).

### FASE 3 — Audit (#/admin/audit)

8. Breadcrumb: Administration / Audit Logs. Título "Audit Logs".
9. Filtros: entidad, usuario (user_id o email), fechas (from/to), acción. Botón aplicar filtros.
10. Tabla de registros de auditoría. Paginación.

### FASE 4 — Metrics (#/admin/metrics)

11. Breadcrumb: Administration / Metrics. Título "Metrics".
12. Tarjetas con valores: total_requests, total_errors, auth_failures, refresh_failures (datos de GET /system/metrics).
13. Botón "Refresh metrics" que vuelve a llamar GET /system/metrics y actualiza las tarjetas.
14. Sección "Metric Details": tabla o bloque que muestre el detalle de las métricas (misma respuesta de API).

### FASE 5 — Verificación

15. Comprobar que sin rol MASTER no se accede a #/admin* (según guard actual).
16. Recorrer #/admin, #/admin/users, #/admin/audit, #/admin/metrics sin errores de consola.
17. Regresión: #/dashboard, #/projects y resto de rutas operativas.

---

## 4️⃣ CRITERIOS DE ACEPTACIÓN

- [ ] #/admin: título "Administration", tres tarjetas (Users, Audit Logs, Metrics) con enlaces.
- [ ] #/admin/users: breadcrumb, búsqueda, filter by role, "+ New User", tabla (Email, Role, Status, Actions), paginación; CRUD y cambio de contraseña operativos.
- [ ] #/admin/audit: filtros (entidad, usuario, fechas, acción), tabla de registros, paginación.
- [ ] #/admin/metrics: tarjetas de métricas, botón Refresh, sección Metric Details; solo GET /system/metrics.
- [ ] Design system aplicado; guard MASTER sin regresión.

---

## 5️⃣ QA (6 NIVELES)

Funcional, API existente, diseño, navegación, RBAC (solo MASTER), regresión.

---

## 6️⃣ CRITERIO DE CIERRE

Todas las pantallas admin implementadas según plan; QA sin bloqueos; evidencia en `docs/EVIDENCIA_ETAPA_15_PANEL_ADMINISTRATIVO_UI_YYYY-MM-DD.md` (9 elementos adaptados: archivos modificados, N/A migraciones, arquitectura intacta, QA funcional, negativa, regresión, seguridad/RBAC, sin 500, contrato API intacto).

---

## 7️⃣ ENTREGABLES Y EVIDENCIA

- **Código:** Cambios en `public/js/views/admin.js` y, si aplica, `public/css/`.
- **Evidencia:** Archivo `docs/EVIDENCIA_ETAPA_15_PANEL_ADMINISTRATIVO_UI_YYYY-MM-DD.md` con los 9 puntos (adaptados a etapa solo frontend). Actualizar checklist Etapa 15 con enlace a evidencia.

---

**No ejecutar hasta validación SYSTEM ARCHITECT y ajustes PO.**

*Plan: docs/PLAN_ETAPA_15_PANEL_ADMINISTRATIVO_UI.md*
