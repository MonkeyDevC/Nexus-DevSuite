# Arranque: desarrollo vs producción

## Desarrollo (API + Vite en paralelo)

- **Un solo comando (recomendado):** desde la raíz del repo  
  `npm run dev:stack`  
  Levanta **Express** (`nodemon` en el puerto definido por `PORT`, por defecto 3000) y **Vite** (por defecto 5173).

- **Comando solo backend (legacy):** `npm run dev`  
  Ejecuta `dev-clean.ps1` (libera el puerto 3000 en Windows) y arranca solo el servidor Node.

### HTTP en el navegador (desarrollo)

- El **frontend no debe usar URLs absolutas** hacia el backend. La base del API es **`/api/v1`** (misma origen que el dev server de Vite).
- Vite **proxifica** ` /api` → backend (`NEXUS_DEV_API_ORIGIN`, por defecto `http://localhost:3000`).
- Variable opcional en **`.env` en la raíz del repo**:  
  `NEXUS_DEV_API_ORIGIN=http://localhost:3000`  
  (Solo afecta el proxy de Vite; no se inyecta en el bundle del cliente.)

### Desviación excepcional del API (QA / otro host)

- Solo si el API vive en otro origen: definir en el entorno de build de Vite **`VITE_API_URL`** (URL absoluta con sufijo `/api/v1` si aplica). El valor por defecto sigue siendo relativo `/api/v1`.

## Producción (un solo proceso y un solo puerto)

1. Compilar el micro-frontend React: **`npm run build:react`**, o `npm run build --prefix frontend-react`.  
   Salida: `public/react-app/` (JS/CSS) y el shell `public/index.html` sigue apuntando a `/react-app/index.js`.

2. Arrancar el servidor: **`npm start`** (`NODE_ENV=production` según tu `.env` o entorno de despliegue).

3. Express sirve:

   - API bajo **`/api/v1`** (rutas existentes, sin cambios de contrato).
   - Estáticos desde **`public/`** (incluye `react-app`).
   - **SPA:** peticiones `GET` que aceptan HTML y no son `/api/...` reciben `public/index.html` para que React Router resuelva rutas internas al refrescar.

No hace falta otro servidor frente al mismo puerto para el bundle React en este flujo estándar.

## Validación rápida

| Escenario | Comprobar |
|-----------|-----------|
| Dev stack | Login en `http://localhost:5173`, redirección y llamadas a `/api/v1/...` con status 200. |
| Prod | Tras `build:react` + `npm start`, login en `http://localhost:3000`, refresh en rutas como `/dashboard` sin 404. |

## Riesgos a tener en cuenta

- **CORS:** en producción el navegador habla con un solo origen; no se requiere CORS para el mismo host. En desarrollo, Vite proxy evita CORS entre 5173 y 3000.
- **Helmet CSP `connect-src`:** debe permitir `'self'` para fetch al mismo origen (ya configurado).
- **`dev:stack` no libera el puerto 3000** antes de arrancar; si hay conflicto, usar `npm run dev` una vez o liberar el puerto manualmente.
