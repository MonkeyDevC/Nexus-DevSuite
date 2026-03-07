# Plan ETAPA 9 — Panel Administrativo

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase de evolución del producto)  
**Objetivo:** Crear herramientas administrativas avanzadas para usuarios con rol MASTER: gestión de usuarios, gestión de roles (asignación vía API), auditoría visual (consulta de audit_logs desde la web) y métricas del sistema en un panel de control administrativo.  
**Estado:** Diseñado por PO MASTER — pendiente validación SYSTEM ARCHITECT

---

## 1. Contexto

- **Situación actual:** La plataforma web (Etapas 7 y 8) ofrece 10 pantallas operativas con UX mejorada. La pantalla Reportes ya permite a MASTER acceder a GET /reports/audit y GET /system/metrics está documentado; el backend expone GET/POST/PUT/DELETE /users y PATCH /users/:id/password (MASTER para crear, actualizar y eliminar; list/get con filtros). No existe aún una sección dedicada de administración que agrupe: listado y CRUD de usuarios, asignación de rol (role_id), vista de auditoría global y vista de métricas del sistema.
- **Objetivo de la etapa:** Añadir un **Panel Administrativo** accesible solo para rol MASTER que integre: (1) gestión de usuarios (listar, crear, editar, desactivar/eliminar; filtros por email y rol), (2) gestión de roles (asignar rol al crear/editar usuario usando role_id según contrato), (3) auditoría visual (consulta a GET /reports/audit con filtros y paginación ya soportados por la API), (4) métricas del sistema (GET /system/metrics). Todo desde la interfaz web existente en `public/`, sin modificar contratos ni rutas del backend.
- **Principios:** Solo MASTER puede acceder al panel administrativo. La UI debe ocultar el menú o enlace al panel para usuarios que no sean MASTER (RBAC en cliente; el backend ya restringe los endpoints). Response Layer v1 y CONTRATO_API.md / openapi.yaml como fuente de verdad.

---

## 2. Alcance (solo frontend)

| Elemento | Especificación |
|----------|----------------|
| **Backend** | Sin cambios. No se añaden endpoints ni se modifican contratos. Se consumen: /users, /reports/audit, /system/metrics. |
| **Frontend** | Nueva sección o pantallas bajo una ruta de “Administración” (ej. #/admin o #/admin/users, #/admin/audit, #/admin/metrics), visible solo si el usuario tiene rol MASTER. |
| **Stack** | Mismo que Etapas 7 y 8: HTML5, Bootstrap 5, JavaScript vanilla, Fetch API. Reutilizar las utilidades de tablas, filtros, paginación e indicadores de Etapa 8 (p. ej. public/js/ux.js si ese es el nombre en el proyecto). |

---

## 3. Subcomponentes de la etapa

### 3.1 Gestión de usuarios

- **Listado de usuarios:** Llamar a GET /api/v1/users con query params documentados (page, limit, email, role_id si el contrato los expone). Mostrar tabla con columnas relevantes (id, email, rol, estado activo/inactivo, fechas). Aplicar filtros (por email, por rol) y paginación según contrato; si no hay paginación en API, paginar en cliente. Ordenación y búsqueda en cliente o según contrato.
- **Crear usuario:** Formulario que envíe POST /api/v1/users con body (email, password, role_id). Campos obligatorios según validación del backend. Mostrar mensaje de éxito o error (Response Layer v1).
- **Editar usuario:** Formulario/modal que envíe PUT /api/v1/users/:id con body (email, role_id según contrato). No exponer ni editar password desde esta pantalla; el cambio de contraseña es un flujo separado (PATCH /users/:id/password, puede ser desde “Editar usuario” como botón “Cambiar contraseña” que abra un modal o vista específica).
- **Eliminar (soft delete):** Llamar a DELETE /api/v1/users/:id. Comprobar en CONTRATO_API.md el código de respuesta (p. ej. 204 sin cuerpo) y el formato; implementar en el frontend el manejo según el contrato (actualizar listado, mensaje de éxito, etc.). Confirmación antes de borrar.
- **Restricción:** Solo MASTER puede ver y usar esta sección; ocultar enlace y rutas para no-MASTER.

### 3.2 Gestión de roles

- **Definición:** En este proyecto los roles están fijados por el backend (MASTER, EMPLOYEE). No se crean ni eliminan roles desde la API; la “gestión de roles” consiste en **asignar el rol de un usuario** al crear (POST /users con role_id) o al editar (PUT /users/:id con role_id).
- **Implementación:** En los formularios de crear y editar usuario, incluir un selector (select) de rol. **El backend no expone GET /roles;** el frontend debe obtener role_id desde: (a) la respuesta de GET /api/v1/users (campo role_id o role en cada usuario), (b) CONTRATO_API.md / openapi.yaml si se documentan los UUID de roles, o (c) constantes en frontend documentadas y alineadas con el backend. No asumir ni llamar a GET /roles. Las opciones MASTER y EMPLOYEE con los UUID correspondientes.
- **Criterio de aceptación:** El administrador MASTER puede asignar rol al crear usuario y al editar usuario; los valores son los permitidos por el backend.

### 3.3 Auditoría visual

- **Objetivo:** Permitir a MASTER consultar el log de auditoría desde la web (audit_logs).
- **API:** GET /api/v1/reports/audit con query params documentados (entity, entity_id, user_id, from, to, action, page, limit). La API ya restringe este endpoint a MASTER y registra el acceso en audit_logs.
- **Pantalla:** Tabla o lista con columnas relevantes (fecha, usuario, entidad, entity_id, acción, metadata, IP, user_agent si el backend los devuelve). Filtros por entity, user_id, rango de fechas (from, to), action. Paginación obligatoria según contrato. Reutilizar componentes de UX (paginación, filtros, empty state).
- **Restricción:** Solo MASTER; enlace visible solo para MASTER (igual que en Etapa 7 para Reportes).

### 3.4 Métricas del sistema

- **Objetivo:** Mostrar en el panel administrativo el snapshot de métricas de la instancia.
- **API:** GET /api/v1/system/metrics (solo MASTER). Respuesta con data (total_requests, total_errors, auth_failures, refresh_failures, scope, etc. según contrato).
- **Pantalla:** Tarjetas o tabla con los indicadores (total_requests, total_errors, auth_failures, refresh_failures, scope). Opcional: actualización manual (botón “Actualizar”) o mensaje indicando que son métricas en el momento de la petición.
- **Restricción:** Solo MASTER.

### 3.5 Panel de control administrativo (resumen)

- **Objetivo:** Una vista “Admin” o “Administración” que sirva de entrada al panel: enlaces o tarjetas a “Usuarios”, “Auditoría”, “Métricas del sistema”. Puede ser la misma ruta #/admin que muestre un dashboard con estos enlaces, o un menú desplegable en la barra de navegación (solo MASTER) que lleve a #/admin/users, #/admin/audit, #/admin/metrics.
- **Criterio mínimo:** Un único punto de entrada visible solo para MASTER (menú “Administración” o “Admin”) y al menos las tres subsecciones: Usuarios, Auditoría, Métricas.

---

## 4. Rutas y visibilidad

| Ruta (ejemplo) | Contenido | Visible |
|----------------|-----------|---------|
| #/admin o #/admin/dashboard | Panel resumen con enlaces a Usuarios, Auditoría, Métricas | Solo MASTER |
| #/admin/users | Listado CRUD usuarios (filtros, paginación, crear, editar, eliminar) | Solo MASTER |
| #/admin/audit | Listado auditoría (GET /reports/audit con filtros y paginación) | Solo MASTER |
| #/admin/metrics | Snapshot GET /system/metrics | Solo MASTER |

El router debe comprobar rol MASTER antes de renderizar estas vistas; si el usuario no es MASTER, redirigir (ej. a #/dashboard) o mostrar mensaje de acceso denegado.

---

## 5. Criterios de aceptación (resumen)

- Panel administrativo accesible solo para MASTER (menú y rutas ocultas o inaccesibles para no-MASTER).
- Gestión de usuarios: listar (con filtros y paginación según API), crear (email, password, role_id), editar (email, role_id), eliminar (soft). Cambio de contraseña (PATCH /users/:id/password) opcional desde la misma sección.
- Gestión de roles: asignar rol al crear y al editar usuario (role_id); opciones alineadas con el backend (MASTER, EMPLOYEE).
- Auditoría visual: pantalla que consuma GET /reports/audit con filtros y paginación; solo MASTER.
- Métricas del sistema: pantalla que consuma GET /system/metrics y muestre los indicadores; solo MASTER.
- Backend sin cambios; regresión de tests en verde; reutilizar ux.js donde aplique (tablas, paginación, filtros).

---

## 6. QA (6 niveles) — aplicación a la etapa

| Nivel | Criterio para ETAPA 9 |
|-------|------------------------|
| **Funcional** | Panel admin visible solo para MASTER; listado y CRUD de usuarios operativo; auditoría y métricas se muestran correctamente. |
| **Dominio** | Roles y campos de usuario según contrato; no inventar campos ni valores. |
| **Negativa** | Usuario no MASTER no accede al panel (redirección o 403 en API); validación de formularios y mensajes de error visibles. |
| **Regresión** | Las 10 pantallas de Etapas 7 y 8 siguen operativas; tests del backend en verde. |
| **Seguridad** | Endpoints /users (crear/editar/eliminar), /reports/audit y /system/metrics ya están protegidos por backend (MASTER); el frontend solo oculta la UI para no-MASTER. |
| **Contrato** | Uso exclusivo de endpoints y cuerpos documentados (CONTRATO_API.md / openapi.yaml). |

---

## 7. Evidencia y documentación

- Lista de archivos creados o modificados (vistas admin, rutas, integración en layout/menú).
- Descripción breve de las pantallas del panel (usuarios, auditoría, métricas) y cómo se verifica el acceso solo MASTER.
- Confirmación de que el backend no ha cambiado y que la suite de tests del backend sigue en verde.

---

## 8. No incluido en esta etapa

- Creación o eliminación de “roles” como entidad (el backend tiene roles fijados; solo se asigna role_id a usuarios).
- Preparación SaaS (multi-tenant, billing): ETAPA 10.
- Nuevos endpoints en el backend.

---

*Documento de diseño ETAPA 9 — Panel Administrativo. Aprobación pendiente: SYSTEM ARCHITECT.*
