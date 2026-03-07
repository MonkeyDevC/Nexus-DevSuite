# Plan ETAPA 15 — Panel administrativo UI

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase UX/UI), nexus-plan-maestro-etapas.mdc  
**Objetivo:** Aplicar wireframes al panel administrativo (solo MASTER): dashboard admin, gestión de usuarios, auditoría visual, métricas del sistema.  
**Estado:** Diseñado por PO MASTER — Pendiente validación SYSTEM ARCHITECT y ajustes PO tras validación.

**Alcance:** Solo frontend (HTML, CSS, JS en `public/`). Sin cambios en API ni backend. Acceso solo rol MASTER; guard de ruta existente. Consumir design system Etapa 12.

---

## 1. Contexto

- **Situación actual:** El panel admin (`public/js/views/admin.js`) expone funcionalidad de usuarios, auditoría y métricas con layout básico. Falta diseño unificado según wireframes y design system.
- **Objetivo:** Rediseñar #/admin (dashboard), #/admin/users, #/admin/audit y #/admin/metrics según wireframes: título "Administration", tres tarjetas de acceso, subsecciones con breadcrumb, tablas, filtros, tarjetas de métricas y botón Refresh.
- **Referencia wireframes:** docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md (pantallas 14–17); plan maestro ETAPA 15.

---

## 2. Alcance (solo frontend)

| Elemento | Especificación |
|----------|----------------|
| **Backend / API** | Sin cambios. Endpoints existentes: usuarios, auditoría, GET /system/metrics (MASTER). |
| **Frontend** | Vista `public/js/views/admin.js` (o subvistas/rutas internas #/admin, #/admin/users, #/admin/audit, #/admin/metrics). Estilos desde `public/css/design-system.css`. |
| **Acceso** | Solo MASTER; guard de ruta sin modificar lógica. |

---

## 3. Diseño objetivo por pantalla

### 3.1 Admin dashboard (#/admin)

- Título "Administration".
- Tres tarjetas con icono y texto "Open": (1) **Users** → #/admin/users, (2) **Audit Logs** → #/admin/audit, (3) **Metrics** → #/admin/metrics.
- Sidebar con sección Administration expandida: Users Management, Metrics, Audit Logs (ítems que coincidan con las tarjetas).

### 3.2 Users (#/admin/users)

- Breadcrumb: Administration / Users Management. Título "Users".
- Barra: búsqueda, "filter by role" (MASTER, EMPLOYEE, All), botón "+ New User".
- Tabla: Email, Role, Status, Actions (edit, lock/password, delete). Paginación.
- Modales o flujos existentes: crear/editar usuario, cambiar contraseña (sin cambiar lógica de API).

### 3.3 Audit (#/admin/audit)

- Breadcrumb: Administration / Audit Logs. Título "Audit" o "Audit Logs".
- Filtros: entidad, usuario (user_id o email), rango de fechas (from/to), acción.
- Tabla de registros de auditoría. Paginación.

### 3.4 Metrics (#/admin/metrics)

- Breadcrumb: Administration / Metrics. Título "Metrics".
- Tarjetas con: total_requests, total_errors, auth_failures, refresh_failures (y scope si aplica). Opcional: mini-gráficos.
- Botón "Refresh metrics" (rellamar GET /system/metrics).
- Sección "Metric Details" (tabla o gráfico con el detalle de métricas).

---

## 4. Criterios de aceptación

- Dashboard #/admin con tres tarjetas (Users, Audit Logs, Metrics) y enlaces a subsecciones.
- #/admin/users: breadcrumb, búsqueda, filter by role, "+ New User", tabla (Email, Role, Status, Actions), paginación; CRUD y cambio de contraseña según API existente.
- #/admin/audit: filtros (entidad, usuario, fechas, acción), tabla de registros, paginación.
- #/admin/metrics: tarjetas de métricas, botón Refresh, sección de detalle; solo consumo de GET /system/metrics.
- Design system aplicado; guard MASTER sin regresión.

---

## 5. Validación QA (6 niveles)

- **Funcional:** Rutas admin cargan; tarjetas, tablas, filtros y acciones operativos.
- **API:** Solo endpoints existentes; sin errores consola.
- **Diseño:** Alineado a wireframes y design system.
- **Navegación:** Breadcrumbs y sidebar Administration coherentes.
- **Seguridad/RBAC:** Acceso solo MASTER; usuario no MASTER redirigido o 403 según implementación actual.
- **Regresión:** Resto de rutas operativas; sin cambios API.

---

## 6. Referencias

- docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md (pantallas 14–17).
- .cursor/rules/nexus-plan-maestro-etapas.mdc (ETAPA 15).
- public/js/views/admin.js, public/css/design-system.css.
