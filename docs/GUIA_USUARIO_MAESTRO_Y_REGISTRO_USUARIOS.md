# Guía — Usuario maestro (MASTER) y registro de usuarios en NEXUS DevSuite

**Versión:** 1.0  
**Fecha:** 2026-03-06  
**Alcance:** Cómo disponer de un usuario MASTER en la app y cómo se registran/crean nuevos usuarios según lo estipulado en el proyecto.

---

## 1. Resumen

- **Usuario maestro (MASTER):** Se crea mediante un **seed** de base de datos que crea los roles (MASTER, EMPLOYEE) y un usuario inicial con rol MASTER. Credenciales por defecto o configurables por variables de entorno.
- **Registro de nuevos usuarios:** En NEXUS DevSuite **no existe registro público** (pantalla “Registrarse” para cualquier visitante). Los nuevos usuarios los crea **solo un usuario con rol MASTER** desde el **Panel de Administración** (#/admin/users), usando la opción “Nuevo usuario” (POST /api/v1/users). Es el flujo estipulado en las Etapas 9 y 10.

---

## 2. Cómo tener tu usuario MASTER en la app

### 2.1 Requisitos previos

- Base de datos creada y configurada (`.env` con `DB_*`).
- Migraciones ejecutadas para tener tablas `roles`, `users`, `organizations`, etc.

### 2.2 Pasos

1. **Ejecutar migraciones** (si no lo has hecho):
   ```bash
   npm run db:migrate
   ```
   Esto crea/actualiza tablas, incluyendo `organizations` y la organización por defecto (slug `"default"`) en la Etapa 10.

2. **Ejecutar el seed** que crea roles y usuario MASTER:
   ```bash
   npm run db:seed
   ```
   El seeder está en `src/infrastructure/db/seeders/20260303194000-seed-roles-and-master-user.js`.

3. **Credenciales del usuario MASTER creado por el seed:**
   - **Por defecto** (si no defines variables de entorno):
     - **Email:** `master@nexus.local`
     - **Contraseña:** `Master123!`
   - **Personalizadas:** Puedes definir en tu `.env`:
     - `MASTER_EMAIL=tu-email@ejemplo.com`
     - `MASTER_PASSWORD=TuContraseñaSegura`
     El seed usa estos valores si existen; si no, usa los anteriores.

4. **Iniciar sesión en la web:**  
   Abre `http://localhost:3000/#/login` e inicia sesión con el email y la contraseña del paso 3. Como el usuario tiene rol MASTER, verás en el menú **Reportes** y **Administración**.

### 2.3 Multi-tenant (Etapa 10)

El seed no asigna `organization_id` al usuario MASTER (el seeder se creó antes de la Etapa 10). Si tu API resuelve tenant y filtra por `organization_id`:

- En muchos entornos el backend trata `organization_id` NULL como “organización por defecto” y sigue funcionando el login.
- Si al listar usuarios o al operar ves que el MASTER no aparece o no puede gestionar usuarios de la org, asigna el MASTER a la organización por defecto. Por ejemplo, tras el seed, ejecutar una sola vez en la BD (sustituye `<UUID_ORG_DEFAULT>` por el `id` de la organización con slug `default`):
  ```sql
  UPDATE users SET organization_id = '<UUID_ORG_DEFAULT>' WHERE email = 'master@nexus.local';
  ```
  O bien ajustar el seeder para que al crear el usuario MASTER le asigne el `organization_id` de la organización por defecto (consultando la tabla `organizations` por slug `'default'`).

### 2.4 Deshacer el seed (opcional)

Si quieres borrar el usuario maestro y los roles creados por el seed:
```bash
npm run db:seed:undo
```
Ten en cuenta que esto borra **todos** los datos insertados por seeders; si solo tienes el de roles y master, elimina ese usuario y los roles MASTER/EMPLOYEE.

---

## 3. Sistema de registro de nuevos usuarios (estipulado en NEXUS DevSuite)

En NEXUS DevSuite el “registro” de usuarios es **solo por administración**, no público.

### 3.1 Quién puede crear usuarios

- **Solo usuarios con rol MASTER** pueden crear (y editar/eliminar) usuarios.
- El backend exige autenticación y autorización MASTER en POST /api/v1/users, PUT /api/v1/users/:id, DELETE /api/v1/users/:id y PATCH /api/v1/users/:id/password.

### 3.2 Dónde se crean los usuarios

- **En la aplicación web:** Menú **Administración** → **Usuarios** (#/admin/users). Ahí el MASTER ve el listado, filtros por email y rol, paginación, y los botones **Nuevo usuario**, **Editar**, **Cambiar contraseña** y **Eliminar**.
- **Flujo “Nuevo usuario”:** El MASTER abre el modal/formulario, introduce **email**, **contraseña** y **rol** (MASTER o EMPLOYEE). El frontend envía POST /api/v1/users con `{ email, password, role_id }`. El backend asigna al usuario la organización del tenant actual (`req.organizationId`). No existe pantalla pública de “Registrarse” ni endpoint de registro abierto.

### 3.3 Roles disponibles

- **MASTER:** Acceso completo (Dashboard, Proyectos, Features, Stories, Sprints, Releases, Incidentes, Documentos, Reportes, Administración). Puede crear/editar/eliminar usuarios, ver auditoría y métricas.
- **EMPLOYEE:** Acceso operativo (Dashboard, Proyectos, Features, Stories, etc.) sin Reportes ni Administración.

El selector de rol en Administración → Usuarios obtiene los `role_id` a partir de la respuesta de GET /api/v1/users (los roles que ya usan los usuarios listados); el backend no expone GET /roles.

### 3.4 Resumen del flujo estipulado

| Paso | Responsable | Acción |
|------|-------------|--------|
| 1 | Despliegue / DevOps | Ejecutar migraciones y seed para tener al menos un usuario MASTER. |
| 2 | Administrador | Iniciar sesión con el usuario MASTER. |
| 3 | Administrador | Ir a **Administración** → **Usuarios** y pulsar **Nuevo usuario**. |
| 4 | Administrador | Rellenar email, contraseña y rol (MASTER o EMPLOYEE); enviar. |
| 5 | Sistema | Backend crea el usuario en la organización del tenant y devuelve éxito. |
| 6 | Nuevo usuario | Recibe las credenciales (por canal seguro) y puede iniciar sesión en la app. |

No hay “registro abierto” ni “invitación por correo” implementado en el contrato actual; cualquier ampliación (p. ej. registro público o flujo de invitación) sería una nueva funcionalidad a diseñar e implementar.

---

## 4. Referencias

- **Seeder roles y usuario MASTER:** `src/infrastructure/db/seeders/20260303194000-seed-roles-and-master-user.js`
- **Scripts npm:** `package.json` — `db:migrate`, `db:seed`, `db:seed:undo`
- **Panel Administración (Etapa 9):** `docs/PLAN_ETAPA_9_PANEL_ADMINISTRATIVO.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_9_PANEL_ADMINISTRATIVO.md`
- **API usuarios y multi-tenant (Etapa 10):** `docs/CONTRATO_API.md`, `docs/PLAN_ETAPA_10_PREPARACION_SAAS.md`
- **Manual de pruebas (usuarios y roles):** `docs/MANUAL_PRUEBAS_FUNCIONALIDADES_WEB.md` — secciones 2 (Roles), 13 (Administración).

---

*Documento de referencia para tener usuario MASTER y entender el sistema de registro de usuarios en NEXUS DevSuite.*
