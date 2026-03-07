# Prompt — Crear usuario maestro (MASTER) con credenciales indicadas

**Para:** MASTER DEVELOPER  
**Objetivo:** Disponer en la aplicación de un usuario con rol MASTER que permita acceder al panel de Administración, Reportes y todas las funcionalidades de NEXUS DevSuite, con las credenciales indicadas por el PO.

---

## 1. Credenciales a configurar

| Campo        | Valor                    |
|-------------|--------------------------|
| **Email**   | `admin_nexus@nexus.com`  |
| **Contraseña** | `Zaq1029*`           |

El usuario debe tener **rol MASTER** y estar **activo** (`is_active: true`). Si aplica multi-tenant (Etapa 10), debe quedar asignado a la **organización por defecto** (slug `default`).

---

## 2. Opción recomendada: usar el seed existente con variables de entorno

El proyecto ya tiene un seeder que crea los roles (MASTER, EMPLOYEE) y un usuario inicial MASTER leyendo `MASTER_EMAIL` y `MASTER_PASSWORD` del entorno.

### Pasos

1. **Configurar variables de entorno** en `.env` (o en el entorno de ejecución):
   ```env
   MASTER_EMAIL=admin_nexus@nexus.com
   MASTER_PASSWORD="Zaq1029*"
   ```
   - La contraseña contiene el carácter `*`; en `.env` conviene ponerla entre comillas dobles para evitar interpretación del shell.
   - No commitear `.env` con credenciales reales; usar `.env.example` solo con nombres de variables (sin valores sensibles).

2. **Si la base de datos está vacía de usuarios (primera vez):**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
   Con eso se crean los roles y el usuario MASTER con email `admin_nexus@nexus.com` y contraseña `Zaq1029*`.

3. **Si ya se ejecutó el seed antes con otro email (ej. `master@nexus.local`):**
   - **Opción A:** Deshacer el seed y volver a ejecutarlo con las nuevas variables (se elimina el usuario maestro anterior y se crea el nuevo):
     ```bash
     npm run db:seed:undo
     npm run db:seed
     ```
     Atención: `db:seed:undo` puede afectar a otros seeders si existen; revisar qué seeders están registrados.
   - **Opción B:** Crear un script o seeder adicional de una sola ejecución que inserte (o actualice) un usuario con email `admin_nexus@nexus.com`, contraseña hasheada con bcrypt (10 rounds) para `Zaq1029*`, `role_id` del rol MASTER, `is_active: true`, y si la tabla `users` tiene `organization_id`, asignar el ID de la organización con slug `default`. No modificar el seeder original `20260303194000-seed-roles-and-master-user.js` para no romper entornos que dependen de él.

4. **Multi-tenant (Etapa 10):** Si la tabla `users` tiene columna `organization_id` y el usuario creado queda con `organization_id` NULL, ejecutar una vez (sustituir `<UUID_ORG_DEFAULT>` por el `id` de la organización con slug `default`):
   ```sql
   UPDATE users SET organization_id = '<UUID_ORG_DEFAULT>' WHERE email = 'admin_nexus@nexus.com';
   ```
   O bien que el script/seeder de la Opción B asigne desde el inicio el `organization_id` de la organización por defecto.

---

## 3. Criterios de aceptación

- [ ] Existe un usuario en la base de datos con email `admin_nexus@nexus.com`, rol MASTER y activo.
- [ ] La contraseña `Zaq1029*` permite iniciar sesión en `POST /api/v1/auth/login` y se recibe un access_token válido.
- [ ] Con ese usuario se accede a la web (`#/login` → credenciales → redirección a `#/dashboard`) y se ven en el menú las opciones **Reportes** y **Administración**.
- [ ] Desde **Administración → Usuarios** el usuario puede listar y crear otros usuarios (comportamiento esperado de MASTER).

---

## 4. Referencias

- **Seeder actual:** `src/infrastructure/db/seeders/20260303194000-seed-roles-and-master-user.js`
- **Scripts:** `package.json` — `db:migrate`, `db:seed`, `db:seed:undo`
- **Guía ampliada:** `docs/GUIA_USUARIO_MAESTRO_Y_REGISTRO_USUARIOS.md`

---

*Prompt para MASTER DEVELOPER — Crear usuario maestro con las credenciales indicadas por el PO.*
