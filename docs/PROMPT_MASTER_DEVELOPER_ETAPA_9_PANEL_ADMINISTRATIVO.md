# Prompt de implementación — ETAPA 9 Panel Administrativo

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_9_PANEL_ADMINISTRATIVO.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_9_PANEL_ADMINISTRATIVO.md, docs/AJUSTES_PO_ETAPA_9_SEGUN_ARCHITECT.md, docs/CHECKLIST_ETAPAS_PROYECTO.md  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 9 — Panel Administrativo** siguiendo el plan `docs/PLAN_ETAPA_9_PANEL_ADMINISTRATIVO.md`.

**Propósito:** Crear un panel de administración accesible solo para rol MASTER que integre: (1) gestión de usuarios (listar, crear, editar, eliminar; filtros por email y rol), (2) asignación de rol (role_id) al crear y editar usuario, (3) auditoría visual (GET /reports/audit con filtros y paginación), (4) métricas del sistema (GET /system/metrics). Todo en el frontend (`public/`); no se modifican contratos ni rutas del backend.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **No modificar el backend:** No se añaden ni cambian endpoints. Solo se consumen GET/POST/PUT/DELETE /api/v1/users, PATCH /api/v1/users/:id/password, GET /api/v1/reports/audit, GET /api/v1/system/metrics según CONTRATO_API.md / openapi.yaml.
- **Acceso solo MASTER:** Las rutas y el menú del panel administrativo deben ser visibles y accesibles únicamente para usuarios con rol MASTER. Comprobar rol con GET /auth/me (o payload del token); si no es MASTER, no mostrar enlace al panel y redirigir a #/dashboard si intentan acceder por URL a #/admin/*.
- **Response Layer v1:** Interpretar success, data/error, meta en todas las respuestas; mostrar mensajes de error al usuario.
- **Gestión de roles:** Solo asignación de role_id al crear/editar usuario; no existe endpoint para CRUD de “roles” como entidad. Las opciones del selector (MASTER, EMPLOYEE) deben usar los role_id que acepta el backend (obtener de la respuesta de list users si cada usuario incluye role_id o role, o de documentación/configuración).
- **Regresión:** Las 10 pantallas de Etapas 7 y 8 deben seguir operativas; suite de tests del backend en verde.
- **Reutilizar** los patrones de tablas, filtros, paginación y empty state de Etapa 8 (archivo public/js/ux.js o el módulo equivalente en el proyecto).

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Estructura del panel y control de acceso

1. Añadir rutas de administración en el router (#/admin, #/admin/users, #/admin/audit, #/admin/metrics). **Guard de rutas:** comprobar rol MASTER antes de renderizar cualquier vista #/admin/* (usando user.role desde GET /auth/me o token). Si el usuario no es MASTER, redirigir a #/dashboard (o mostrar acceso denegado). No confiar solo en ocultar el menú; proteger también el acceso por URL.
2. En el layout (menú de navegación), añadir entrada “Administración” o “Admin” (o un submenú) **solo visible cuando user.role === "MASTER"**. Enlace a #/admin o a la primera subsección.
3. Crear vista **Panel Admin (dashboard):** página #/admin que muestre tarjetas o enlaces a “Usuarios”, “Auditoría”, “Métricas del sistema”. Solo accesible por MASTER.

### FASE 2 — Gestión de usuarios

4. Crear vista **Usuarios** (#/admin/users): llamar a GET /api/v1/users con query params documentados (page, limit, email, role_id si el contrato los expone). Mostrar tabla (id, email, rol, estado activo/inactivo, fechas); reutilizar ux.js para ordenación, filtros (por email, por rol) y paginación según contrato.
5. **Crear usuario:** Formulario (modal o página) con email, password, role_id (selector de rol). POST /api/v1/users. Validación básica en cliente; mensajes de error desde body.error. Tras éxito, actualizar listado o redirigir.
6. **Editar usuario:** Formulario/modal con email, role_id (selector). PUT /api/v1/users/:id. No editar password aquí; opcional: botón “Cambiar contraseña” que abra modal o vista con PATCH /api/v1/users/:id/password (contraseña actual y nueva según contrato si aplica).
7. **Eliminar usuario:** Botón que llame a DELETE /api/v1/users/:id; confirmación antes de enviar. Comprobar en CONTRATO_API.md el código de respuesta (204 u otro) y el formato (sin cuerpo o con body); implementar el manejo en el frontend según el contrato (actualizar listado, mensaje de éxito).
8. **Selector de rol:** No existe GET /roles en el backend. Obtener opciones MASTER/EMPLOYEE y sus role_id desde: (a) respuesta de GET /api/v1/users (role_id o role en cada usuario), (b) CONTRATO_API.md / openapi.yaml si se documentan los UUID, (c) constantes en frontend alineadas con el backend. No asumir ni llamar a GET /roles.

### FASE 3 — Auditoría visual

9. Crear vista **Auditoría** (#/admin/audit): llamar a GET /api/v1/reports/audit con query params documentados (entity, entity_id, user_id, from, to, action, page, limit). Mostrar tabla con columnas (fecha, usuario, entidad, entity_id, acción, metadata, IP/user_agent si la API los devuelve). Filtros (entity, user_id, from, to, action) y paginación según contrato. Reutilizar ux.js para paginación y empty state.

### FASE 4 — Métricas del sistema

10. Crear vista **Métricas** (#/admin/metrics): llamar a GET /api/v1/system/metrics. Mostrar en tarjetas o tabla los indicadores (total_requests, total_errors, auth_failures, refresh_failures, scope, etc. según data devuelta). Opcional: botón “Actualizar” para volver a llamar al endpoint.

### FASE 5 — Verificación y regresión

11. Comprobar que un usuario EMPLOYEE no ve el menú “Administración” y que al acceder a #/admin o #/admin/* es redirigido (o recibe feedback de acceso denegado).
12. Recorrer las 10 pantallas existentes (login, dashboard, projects, features, stories, sprints, releases, incidents, documents, reports) y confirmar que siguen funcionando.
13. Ejecutar la suite de tests del backend y confirmar que sigue en verde.

---

## 4️⃣ REGLAS DE DOMINIO CRÍTICAS

- **Roles:** Solo MASTER y EMPLOYEE; asignación vía role_id en create/update user. No crear ni eliminar “roles” como recurso; solo asignar el rol de cada usuario.
- **Auditoría:** GET /reports/audit es solo MASTER; el backend registra el acceso en audit_logs. Usar solo los query params documentados.
- **Métricas:** GET /system/metrics es solo MASTER; datos en memoria por instancia (scope: "instance").

---

## 5️⃣ AUDITORÍA

- No se exigen nuevos eventos de auditoría en backend. El acceso a /reports/audit ya se audita en el backend.

---

## 6️⃣ QA OBLIGATORIA (6 niveles)

- **Funcional:** Panel admin visible solo para MASTER; listado y CRUD de usuarios operativo; auditoría con filtros y paginación; métricas mostradas correctamente.
- **Dominio:** Campos y roles según contrato; role_id válidos.
- **Negativa:** Usuario no MASTER no accede al panel; validaciones y mensajes de error visibles.
- **Regresión:** 10 pantallas de Etapas 7 y 8 operativas; suite de tests del backend en verde.
- **Seguridad:** Backend ya restringe endpoints a MASTER; frontend oculta UI para no-MASTER.
- **Contrato:** Solo endpoints y cuerpos documentados (CONTRATO_API.md / openapi.yaml).

---

## 7️⃣ CRITERIO DE CIERRE

- Panel administrativo accesible solo para MASTER (menú y rutas protegidas).
- Gestión de usuarios: listar (filtros, paginación), crear (email, password, role_id), editar (email, role_id), eliminar (soft).
- Asignación de rol (role_id) en crear y editar usuario.
- Vista Auditoría (GET /reports/audit con filtros y paginación).
- Vista Métricas (GET /system/metrics).
- Backend sin cambios; suite de tests del backend en verde.

---

## 8️⃣ EVIDENCIA OBLIGATORIA

**Entrega en archivo:** `docs/EVIDENCIA_ETAPA_9_PANEL_ADMINISTRATIVO_<YYYY-MM-DD>.md`

Contenido mínimo:

1. Lista de archivos creados o modificados (vistas admin, rutas, layout, etc.).
2. Descripción breve de las pantallas del panel (dashboard admin, usuarios, auditoría, métricas) y cómo se verifica el acceso solo MASTER.
3. Confirmación de que el backend no ha cambiado y que la suite de tests del backend sigue en verde.
4. Pasos o capturas para verificar: (a) MASTER ve y accede al panel; (b) EMPLOYEE no ve el menú Admin y es redirigido al intentar #/admin; (c) al menos un flujo CRUD de usuario y una consulta de auditoría.
5. Referencia al plan: PLAN_ETAPA_9_PANEL_ADMINISTRATIVO.md. Opcional: citar docs/AJUSTES_PO_ETAPA_9_SEGUN_ARCHITECT.md y docs/VALIDACION_ARQUITECTONICA_ETAPA_9_PANEL_ADMINISTRATIVO.md.

---

## 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporadas)

| Id | Observación | Aplicación en el prompt |
|----|-------------|-------------------------|
| **O1** | No existe GET /roles | Selector de rol: obtener role_id desde GET /users (role_id o role en cada usuario), CONTRATO_API/openapi si documentan UUID, o constantes en frontend. No asumir ni llamar GET /roles. Plan 3.2 y FASE 2 paso 8. |
| **O2** | GET /users permite MASTER y EMPLOYEE | La restricción “solo MASTER ve el panel” es de frontend: guard de ruta debe impedir que EMPLOYEE acceda a #/admin/* por URL; ocultar menú para no-MASTER. |
| **O3** | DELETE /users/:id — respuesta | Comprobar en CONTRATO_API.md código de respuesta (204 u otro) y formato; manejar en frontend según contrato. FASE 2 paso 7. |
| **O4** | Reutilizar UX de Etapa 8 | Usar mismos patrones de tablas, filtros, paginación y empty state; referenciar por nombre real en el proyecto (p. ej. public/js/ux.js). |

**Validación:** APROBADO CON OBSERVACIONES — SYSTEM ARCHITECT. Ver docs/VALIDACION_ARQUITECTONICA_ETAPA_9_PANEL_ADMINISTRATIVO.md y docs/AJUSTES_PO_ETAPA_9_SEGUN_ARCHITECT.md.
