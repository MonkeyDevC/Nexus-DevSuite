# Despliegue en producción — NEXUS DevSuite

Este documento describe las variables de entorno, la resolución de tenant (multi-tenant), el checklist de seguridad y los pasos recomendados para desplegar la API en producción.

## 1. Variables de entorno obligatorias

| Variable | Descripción | Ejemplo producción |
|----------|-------------|---------------------|
| `NODE_ENV` | Entorno de ejecución | `production` |
| `PORT` | Puerto HTTP del servidor | `3000` |
| `DB_HOST` | Host de la base de datos | Host del proveedor (MySQL) |
| `DB_PORT` | Puerto de la base de datos | `3306` |
| `DB_NAME` | Nombre de la base de datos | `nexus_production` |
| `DB_USER` | Usuario de la base de datos | Usuario con permisos adecuados |
| `DB_PASSWORD` | Contraseña de la base de datos | Secreto robusto |
| `JWT_ACCESS_SECRET` | Secreto para tokens de acceso | Cadena larga y aleatoria |
| `JWT_REFRESH_SECRET` | Secreto para tokens de refresh | Cadena larga y aleatoria (distinta) |
| `MASTER_PASSWORD` | Contraseña del usuario MASTER inicial | Secreto robusto |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos (CORS) | `https://app.nexusapp.com` (no `*` en prod) |

Opcionales pero recomendados:

| Variable | Descripción | Ejemplo |
|----------|-------------|--------|
| `JWT_ACCESS_EXPIRES_IN` | Caducidad del access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Caducidad del refresh token | `7d` |
| `SUBDOMAIN_BASE` | Dominio base para resolución por subdominio | `nexusapp.com` |
| `RATE_LIMIT_WINDOW_MS` | Ventana del rate limit (ms) | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Máximo de peticiones por ventana | `200` |
| `SHUTDOWN_TIMEOUT_MS` | Tiempo de gracia al apagado | `10000` |

**Nota:** En producción, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` no deben ser valores por defecto ni cadenas que empiecen por `replace_with_`. La aplicación no arranca si detecta secretos débiles en `NODE_ENV=production`.

## 2. Resolución de tenant (multi-tenant)

El tenant (organización) se resuelve en este orden:

1. **Header `X-Organization-Id`:** UUID de la organización. Si viene y existe en BD, se usa.
2. **Header `X-Tenant-Slug`:** Slug de la organización (ej. `acme`). Se busca la organización por `slug` y se usa su `id`.
3. **Subdominio:** Si `SUBDOMAIN_BASE` está definido, se extrae el subdominio del header `Host` (ej. `acme.nexusapp.com` → tenant `acme`) y se resuelve la organización por slug.
4. **Organización por defecto:** Si no se obtiene tenant por ninguno de los anteriores, se usa la organización con `slug = "default"`.

Todas las peticiones a la API (excepto auth y health) deben poder resolver un tenant; si no hay tenant válido, se usa la org `default`. Los listados y altas de proyectos, usuarios, releases, etc. quedan aislados por `organization_id` del tenant resuelto.

En desarrollo se puede simular con headers, por ejemplo: `X-Tenant-Slug: default` o `X-Organization-Id: <uuid-org-default>`.

## 3. Checklist de seguridad

- [ ] **HTTPS:** Servir la API solo por HTTPS en producción (terminación en proxy inverso o en el propio proceso).
- [ ] **Secrets:** No incluir `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DB_PASSWORD` ni `MASTER_PASSWORD` en código ni en repositorio; usar variables de entorno o un gestor de secretos.
- [ ] **CORS:** Configurar `CORS_ALLOWED_ORIGINS` con los orígenes exactos del frontend; evitar `*` en producción.
- [ ] **Base de datos:** Usuario de BD con permisos mínimos necesarios; conexión cifrada si el proveedor lo soporta.
- [ ] **Rate limit:** Mantener rate limit activo (valores por defecto o ajustados según capacidad).
- [ ] **Logs:** No registrar en logs el cuerpo de peticiones con credenciales o tokens; en producción no exponer `stack` en respuestas de error.

## 4. Pasos recomendados para desplegar

1. **Preparar base de datos:** Crear la base MySQL y el usuario con permisos.
2. **Configurar variables de entorno** según la tabla anterior (incluyendo secretos robustos).
3. **Ejecutar migraciones:** Desde la raíz del proyecto:
   ```bash
   npx sequelize-cli db:migrate
   ```
   Las migraciones crean/actualizan tablas (organizations, organization_id en users/projects/releases, índices, seed de organización default).
4. **Arrancar la aplicación:**
   ```bash
   node src/server.js
   ```
   O con un proceso manager (PM2, systemd, etc.) según el entorno.
5. **Comprobar health:** `GET /health` debe devolver 200 y estado del sistema.

## 5. Health check

- **GET /health:** Endpoint público que devuelve estado de la aplicación y, si aplica, conectividad a base de datos. No requiere autenticación ni tenant. Útil para probes de Kubernetes, load balancers o monitoreo externo.

## 6. Tests

Para que la suite de tests de integración pase, la base de datos de pruebas debe tener aplicadas las migraciones de la etapa 10 (organizations, organization_id en users/projects/releases, seed de org default). Ejecutar `npx sequelize-cli db:migrate` sobre la BD de pruebas antes de `npm test`.

## 7. Referencias

- Plan de la etapa: `docs/PLAN_ETAPA_10_PREPARACION_SAAS.md`
- Contrato API (multi-tenant y organizaciones): `docs/CONTRATO_API.md`
