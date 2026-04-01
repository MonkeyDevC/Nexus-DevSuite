# Nexus DevSuite

Base operativa para una empresa de desarrollo certificable (ISO 9001), diseñada como monolito modular desacoplado.

## Stack
- Node.js
- Express
- Sequelize
- MySQL 8.0
- JWT access/refresh
- RBAC
- Auditoria transversal append-only

## Estructura de alto nivel
- `src/modules`: modulos funcionales (auth, users, roles, projects, backlog, audit, releases).
- `src/middlewares`: seguridad, contexto, control de errores y auditoria.
- `src/infrastructure`: acceso a DB, modelos e integraciones externas.
- `docs`: arquitectura, calidad y release management.

## Arranque local
1. Copiar `.env.example` a `.env` y ajustar valores.
2. Instalar dependencias: `npm install` y en `frontend-react`: `npm install` (o instalar desde raíz si usas flujo unificado).
3. **Desarrollo full-stack (Express + Vite, un comando):** `npm run dev:stack`  
   - API: `http://localhost:3000` (por defecto).  
   - UI React: `http://localhost:5173` con proxy de `/api` hacia el backend.  
   Detalle: [docs/ARRANQUE_DEV_Y_PRODUCCION.md](docs/ARRANQUE_DEV_Y_PRODUCCION.md).
4. **Solo backend (legacy Windows):** `npm run dev` (libera el puerto 3000 y arranca nodemon).

## Producción (un puerto)
1. `npm run build:react`
2. `npm start` (sirve `public/` + API bajo `/api/v1`; ver documento de arranque).

## Arranque en desarrollo
- Para stack completo usar `npm run dev:stack` (recomendado).
- Solo API: `npm run dev` o `npm run dev:server`.
- Evitar ejecutar el mismo comando en multiples terminales para prevenir conflicto de puertos.

### Si el puerto ya esta en uso (EADDRINUSE)
- **Windows (PowerShell):**
  ```powershell
  Get-CimInstance Win32_Process |
    Where-Object {
      $_.Name -eq 'node.exe' -and (
        $_.CommandLine -like '*NEXUS DevSuite*nodemon.js*' -or
        $_.CommandLine -like '*NEXUS DevSuite*src/server.js*' -or
        $_.CommandLine -like '*npm-cli.js* run dev*'
      )
    } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force };
  npm run dev
  ```
- **Linux/macOS (opcional):** `lsof -ti :3000 | xargs kill -9 && npm run dev`

## Criterios de arquitectura
- Capas separadas: routes, controllers, services, repositories, validators.
- Principios SOLID en servicios y acceso a datos.
- `project_id` para aislamiento multi-proyecto.
- Trazabilidad completa en acciones criticas.
