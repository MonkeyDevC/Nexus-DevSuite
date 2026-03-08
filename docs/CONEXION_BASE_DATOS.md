# Conexión a la base de datos — NEXUS DevSuite

Guía para conectar el proyecto a MySQL y dejar el servidor operativo con base de datos.

---

## Requisitos

- **MySQL** instalado y en ejecución (local, Docker o remoto).
- Archivo **`.env`** en la raíz del proyecto (puedes copiar `.env.example` y ajustar).

---

## Variables de entorno (`.env`)

Asegura que existan y sean correctas:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto | `3306` |
| `DB_NAME` | Nombre de la base de datos | `nexus_devsuite` |
| `DB_USER` | Usuario MySQL | `root` |
| `DB_PASSWORD` | Contraseña del usuario | *(tu contraseña)* |
| `DB_SKIP_AUTH_ON_STARTUP` | Si es `true`, el servidor no valida la conexión al arrancar (útil sin BD). Para usar la BD, ponla en `false` o coméntala. | `false` |

---

## Pasos para conectar

### 1. Tener MySQL en ejecución

- **Windows:** Servicio MySQL en ejecución (o instalar [MySQL](https://dev.mysql.com/downloads/installer/) / [XAMPP](https://www.apachefriends.org/) / etc.).
- **Docker:** `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=tu_password mysql:8`
- Comprobar: que puedas conectarte con un cliente (MySQL Workbench, DBeaver, o `mysql -u root -p` en consola).

### 2. Crear la base de datos (si no existe)

Desde la raíz del proyecto:

```bash
npm run db:setup
```

**Si en tu terminal no se reconoce `npm`** (por ejemplo en PowerShell tras instalar Node.js), usa una de estas opciones:

- **Opción A — Script PowerShell** (recomendado): desde la raíz del proyecto:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\run-db-setup.ps1
  ```
- **Opción B — Ruta completa a npm:**  
  `& "C:\Program Files\nodejs\npm.cmd" run db:setup`
- **Opción C — Añadir Node al PATH:** En Windows, en Variables de entorno del sistema, añade `C:\Program Files\nodejs` a la variable PATH y vuelve a abrir la terminal.

Este script crea la base de datos indicada en `DB_NAME` si no existe. Si falla, revisa usuario/contraseña y que MySQL esté levantado.

### 3. Ejecutar migraciones

```bash
npm run db:migrate
```

**Si no se reconoce `npm`:** desde la raíz del proyecto ejecuta:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-db-migrate.ps1
```
O con ruta completa: `& "C:\Program Files\nodejs\npm.cmd" run db:migrate`

Se crean/actualizan todas las tablas según las migraciones del proyecto.

### 4. (Opcional) Cargar datos iniciales y usuario MASTER

```bash
npm run db:seed
npm run create-master-user
```

**Sin npm:** desde la raíz: `powershell -ExecutionPolicy Bypass -File ./scripts/run-db-seed.ps1` para seed; para create-master-user: `& "C:\Program Files\nodejs\npm.cmd" run create-master-user`.

`db:seed` carga roles y datos base. `create-master-user` crea el usuario MASTER para entrar a la app (revisa el script o la doc si quieres cambiar email/contraseña).

### 5. Activar la conexión al arrancar el servidor

En `.env` pon:

```env
DB_SKIP_AUTH_ON_STARTUP=false
```

(o borra la línea; el valor por defecto es `false`).

### 6. Arrancar el servidor

```bash
npm run dev
```

**Si no se reconoce `npm`:** ejecuta desde la raíz del proyecto:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-dev.ps1
```

Si todo está bien, en los logs deberías ver algo como: `Conexion a MySQL establecida` y `Servidor iniciado correctamente`.

---

## Resumen rápido

| Orden | Comando | Qué hace |
|-------|---------|----------|
| 1 | `npm run db:setup` | Crea la BD si no existe |
| 2 | `npm run db:migrate` | Crea/actualiza tablas |
| 3 | `npm run db:seed` | (Opcional) Datos iniciales |
| 4 | `npm run create-master-user` | (Opcional) Usuario MASTER |
| 5 | `DB_SKIP_AUTH_ON_STARTUP=false` en `.env` | Para que el servidor valide la BD al arrancar |
| 6 | `npm run dev` | Inicia el servidor |

**Si `npm` no se reconoce en la terminal:** usa los scripts PowerShell `run-db-setup.ps1`, `run-db-migrate.ps1` y `run-db-seed.ps1` (en `scripts/`) para los pasos 1, 2 y 3; para create-master-user y dev, `& "C:\Program Files\nodejs\npm.cmd" run <script>` o añade `C:\Program Files\nodejs` al PATH.

---

## Errores frecuentes

- **ECONNREFUSED:** MySQL no está en ejecución o `DB_HOST`/`DB_PORT` incorrectos.
- **ER_ACCESS_DENIED_ERROR:** Usuario o contraseña en `.env` incorrectos.
- **Unknown database:** La BD no existe; ejecuta `npm run db:setup` y luego `npm run db:migrate`.
- El servidor arranca pero las rutas devuelven error: comprueba que `DB_SKIP_AUTH_ON_STARTUP` sea `false` para que realmente se use la conexión.

---

**Referencia:** Configuración de BD en `src/config/database.js` y `src/infrastructure/db/sequelize-cli.config.js`.
