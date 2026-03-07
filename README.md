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
2. Instalar dependencias: `npm install`
3. Ejecutar en desarrollo: `npm run dev`

## Arranque en desarrollo
- Levantar una sola instancia con `npm run dev`.
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
