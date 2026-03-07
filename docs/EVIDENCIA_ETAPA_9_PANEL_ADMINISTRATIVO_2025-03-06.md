# Evidencia ETAPA 9 — Panel Administrativo

**Fecha:** 2025-03-06  
**Referencia:** docs/PLAN_ETAPA_9_PANEL_ADMINISTRATIVO.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_9_PANEL_ADMINISTRATIVO.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_9_PANEL_ADMINISTRATIVO.md, docs/AJUSTES_PO_ETAPA_9_SEGUN_ARCHITECT.md

---

## 1. Archivos creados o modificados

### Creados
- **public/js/views/admin.js** — Panel administrativo: dashboard (#/admin), usuarios (#/admin/users), auditoría (#/admin/audit), métricas (#/admin/metrics). Gestión de usuarios (listar con filtros email/rol y paginación, crear, editar, eliminar, cambiar contraseña). Auditoría con filtros (entity, action, from, to) y paginación. Métricas con botón Actualizar. Roles obtenidos de la respuesta de GET /users (role_id por usuario).

### Modificados
- **public/js/api.js** — Manejo de respuesta 204 (sin cuerpo) para DELETE /users/:id: retorno `{ success: true }` sin parsear JSON.
- **public/js/router.js** — Guard para rutas #/admin: si el usuario no es MASTER (getMe().role !== "MASTER") se redirige a #/dashboard antes de renderizar cualquier vista admin. showView() convertido a async.
- **public/index.html** — Enlace "Administración" en la barra de navegación (id="nav-admin", visible solo MASTER). Inclusión de `<script src="js/views/admin.js"></script>`.
- **public/js/layout.js** — Mostrar/ocultar ítem de menú "Administración" según user.role === "MASTER" (nav-admin).

---

## 2. Descripción de las pantallas del panel y verificación de acceso MASTER

| Ruta | Contenido | Acceso MASTER |
|------|-----------|----------------|
| **#/admin** | Dashboard con tres tarjetas: Usuarios, Auditoría, Métricas (enlaces a #/admin/users, #/admin/audit, #/admin/metrics). | Router comprueba getMe().role === "MASTER" antes de ejecutar la vista; si no, redirección a #/dashboard. Menú "Administración" solo visible para MASTER (layout.js). |
| **#/admin/users** | Listado GET /users con filtros (email, role_id), paginación (API), ordenación por columna (ux.js). Botón Nuevo usuario → modal (email, contraseña, role_id). Por fila: Editar (PUT /users/:id), Cambiar contraseña (PATCH /users/:id/password), Eliminar (DELETE /users/:id con confirmación). Opciones de rol construidas a partir de role_id únicos devueltos por GET /users. | Mismo guard en router; sin menú Admin un EMPLOYEE no tiene enlace pero si escribe #/admin/users es redirigido. |
| **#/admin/audit** | GET /reports/audit con query params entity, user_id, from, to, action, page, limit. Tabla (fecha, user_id, entidad, entity_id, acción, IP). Filtros y paginación reutilizando renderPagination de ux.js. | Solo MASTER (guard + menú). |
| **#/admin/metrics** | GET /system/metrics. Tarjetas con total_requests, total_errors, auth_failures, refresh_failures, scope. Botón "Actualizar" para recargar. | Solo MASTER (guard + menú). |

**Verificación de acceso solo MASTER:** (a) En el router, antes de invocar la vista "admin", se obtiene el usuario con getMe(); si user.role !== "MASTER" se asigna window.location.hash = "#/dashboard" y no se renderiza la vista. (b) En layout.js el ítem "Administración" (nav-admin) se muestra solo cuando user.role === "MASTER". Así, un EMPLOYEE no ve el enlace y si intenta acceder por URL a #/admin o #/admin/* es redirigido al dashboard.

---

## 3. Backend y regresión

- **Backend:** Sin cambios. No se han añadido ni modificado endpoints. Se consumen únicamente: GET/POST/PUT/DELETE /api/v1/users, PATCH /api/v1/users/:id/password (body: current_password, new_password), GET /api/v1/reports/audit (query: entity, entity_id, user_id, from, to, action, page, limit), GET /api/v1/system/metrics.
- **DELETE /users/:id:** Respuesta 204 sin cuerpo; en api.js se detecta res.status === 204 y se devuelve { success: true } sin intentar parsear JSON.
- **Suite de tests del backend:** Ejecutada con `npm test -- --runInBand`. Resultado: **12 test suites passed, 79 tests passed**.

---

## 4. Pasos para verificar

- **(a) MASTER ve y accede al panel:** Iniciar sesión con usuario con rol MASTER. Comprobar que en la barra de navegación aparece "Administración". Clic en Administración → se muestra el dashboard con Usuarios, Auditoría, Métricas. Navegar a #/admin/users, #/admin/audit, #/admin/metrics y comprobar que cada vista carga correctamente.
- **(b) EMPLOYEE no ve el menú Admin y es redirigido:** Iniciar sesión con usuario EMPLOYEE. Comprobar que no aparece el enlace "Administración". Escribir en la barra de direcciones #/admin o #/admin/users → la aplicación debe redirigir a #/dashboard (o mostrar dashboard sin contenido de admin).
- **(c) Flujo CRUD de usuario:** Como MASTER, ir a #/admin/users. Clic en "Nuevo usuario", rellenar email, contraseña (mín. 8 caracteres) y seleccionar un rol del desplegable (opciones obtenidas del listado). Guardar → el usuario aparece en la tabla. Clic en "Editar" de un usuario → cambiar email o rol y guardar. Clic en "Cambiar contraseña" → introducir contraseña actual y nueva (mín. 8) y confirmar. Clic en "Eliminar" → confirmar → el usuario desaparece del listado (DELETE 204).
- **(d) Consulta de auditoría:** Como MASTER, ir a #/admin/audit. Opcionalmente rellenar filtros (Entidad, Acción, Desde, Hasta) y clic en "Filtrar". Comprobar que la tabla muestra registros y que la paginación (Anterior/Siguiente o números) funciona si hay más de una página.

---

## 5. Referencias

- Plan: **docs/PLAN_ETAPA_9_PANEL_ADMINISTRATIVO.md**
- Prompt: **docs/PROMPT_MASTER_DEVELOPER_ETAPA_9_PANEL_ADMINISTRATIVO.md**
- Validación arquitectónica: **docs/VALIDACION_ARQUITECTONICA_ETAPA_9_PANEL_ADMINISTRATIVO.md**
- Ajustes PO según Architect: **docs/AJUSTES_PO_ETAPA_9_SEGUN_ARCHITECT.md**
