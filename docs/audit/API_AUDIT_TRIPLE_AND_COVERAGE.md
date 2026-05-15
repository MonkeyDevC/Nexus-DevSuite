# Auditoría API — cruce triple y cobertura por módulo

**A:** rutas montadas en backend (`/api/v1`, ver `API_INVENTORY_BACKEND.md`).  
**B:** rutas usadas por `frontend-react` (ver `API_INVENTORY_FRONTEND.md`).  
**C:** operaciones documentadas en OpenAPI 3.0.3 (ola 1: [`src/config/swagger.openapi.wave1.js`](../../src/config/swagger.openapi.wave1.js) + `npm run validate:openapi`).

## Leyenda de clasificación

| Código | Significado |
|--------|-------------|
| OK | Uso en B y presencia en C (para el mismo caso de uso; path puede variar si ambas variantes están en C). |
| GAP-C | **Crítico:** en B pero no cubierto en C (o solo parcialmente). |
| LEGACY-C | En C (o solo en A) y no observado en B — posible solo-backend, herramienta o legado. |
| DUP | Variantes A/B conscientes (mismo dominio, dos paths); deben permanecer visibles en C. |

## Cruce resumido (dominios)

| Dominio | A | B | C | Notas |
|---------|---|---|---|--------|
| Auth | Sí | Sí | Sí | login, refresh, logout, me, roles |
| Users | Sí | Sí | Sí | Lista, detalle, put, photo |
| Projects | Sí | Sí | Sí | CRUD, import, bulk-delete, anidadas principales |
| Features | Sí | Sí | Sí | DUP con anidadas bajo proyecto |
| Stories | Sí | Sí | Sí | Detalle, mutaciones, assign sprint/release |
| Sprints | Sí | Sí | Sí | Proyecto + `/sprints/:id` |
| Incidents | Sí | Sí | Sí | DUP proyecto vs root |
| Releases | Sí | Sí | Sí | Incl. start/release/status |
| Work orders | Sí | Sí | Sí | Añadido en ola 1 |
| Dashboard | Sí | Sí | Sí | `/dashboard/summary` |
| Documentation (plataforma) | Sí | Sí | Sí | CRUD básico |
| Documents (ISO) | Sí | Sí | Parcial | GET lista/detalle/code/versions + POST doc/version en C; **GAP-C** en PATCH de versiones si el front las usa vía PATCH no reflejado igual en C |
| Reports | Sí | Sí | Sí | `/reports/audit` |
| System metrics | Sí | Sí | Sí | `/system/metrics` |
| Organizations | Sí | No en inventario B | **GAP-C** | No aparece consumo directo en servicios revisados |
| Change requests | Sí | No en B (ola actual) | LEGACY-C / futuro | Documentar en ola 2 si el front crece |
| Improvements | Sí | No en B | LEGACY-C | |
| GitHub / code-deliveries / tasks / implementation-steps | Sí | No en B (inventario actual) | **GAP-C** o LEGACY-C | Confirmar con búsqueda ampliada si hay fetch fuera de `*Service` |
| Automation (doble `/automation`) | Sí | No en B | LEGACY-C | Revisar colisión de routers |
| Workflows / rules-engine | Sí | No en B | LEGACY-C | |
| AI review stub | Sí | No | Parcial | No documentado en C (400 fijo) — **opcional** documentar |
| dev-tools | Sí (condicional) | Solo dev | LEGACY-C | Excluir de C por política o marcar “solo dev” en ola 2 |

## Matriz por módulo (conteo orientativo)

| Módulo | Endpoints A (orden magnitud) | Usados B (ola React) | Documentados C (ola 1) | Gaps | Observaciones |
|--------|-----------------------------|----------------------|------------------------|------|----------------|
| Auth | ~6 | 4+ | 5 | admin/test sin C si se usa | |
| Users | ~7 | 4 | 5+ | — | Lista: `data` anidada distinta a projects |
| Projects | ~15 | muchos | mayoría core | tareas/code-deliveries/github no en C | Anidadas duplican features/incidents |
| Features | ~9 | sí | sí | — | Duplicidad con `/projects/.../features` |
| Stories | ~10 | sí | sí | — | |
| Sprints | ~12 | sí | sí parcial | GET `/sprints` root, assign story bajo sprint | C cubre flujo principal React |
| Incidents | ~11 | sí | sí | — | Duplicidad proyecto vs `/incidents` |
| Releases | ~12 | sí | sí | bulk/hotfix/features assign en C parcial | Ampliar en ola 2 |
| Work orders | ~5 | sí | sí | — | |
| Dashboard | 2 | 1 | 1 | — | |
| Documentation | 4 | 3 | 3 | — | |
| Documents | muchos | varios | parcial | PATCH versiones / status | Alinear con `document.routes.js` |
| Reports / System | 2 | 2 | 2 | — | |
| Organizations | 3 | 0 | 0 | GAP-C si se añade uso | |

## Duplicados explícitos (no ocultar en Swagger)

- Features: **anidada** `.../projects/{projectId}/features` vs **global** `/features`.
- Incidentes: **anidada** `.../incidents` vs **global** `/incidents`.
- Historias: listado por feature vs por proyecto (diferentes paths en A).

## Próximos pasos recomendados

1. Ola 2: tags y paths para change-requests, improvements, github, code-deliveries, automation unificado.
2. Cerrar GAP organizations si el front consume vía otro cliente no inventariado.
3. Completar documents PATCH (`/:documentId/versions/:versionId` y `/status`) en C si se confirma uso en UI.
4. CI: `npm run validate:openapi` en pipeline.
