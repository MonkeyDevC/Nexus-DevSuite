# Prompt de implementación — ETAPA 8 UX Operativa

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_8_UX_OPERATIVA.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_8_UX_OPERATIVA.md, docs/CHECKLIST_ETAPAS_PROYECTO.md  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 8 — UX Operativa** siguiendo el plan `docs/PLAN_ETAPA_8_UX_OPERATIVA.md`.

**Propósito:** Mejorar la experiencia de usuario de la plataforma web (Etapa 7) con tablas dinámicas (ordenación), filtros, búsqueda, paginación, indicadores de estado visuales y mejoras de navegación (breadcrumbs, estados de carga, empty state). Todo el trabajo es en el frontend (`public/`); no se modifican contratos ni rutas del backend.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **No modificar el backend:** No se añaden ni cambian endpoints, parámetros ni estructuras de respuesta. Solo se usan los ya documentados en CONTRATO_API.md / openapi.yaml (incluidos `page`, `limit`, `sort` si existen).
- **No romper la funcionalidad de Etapa 7:** Login, protección de rutas, 10 pantallas y consumo de la API deben seguir operativos.
- **Response Layer v1:** Sigue interpretando `success`, `data`/`error`, `meta` en todas las respuestas.
- **Filtros y búsqueda:** Si la API no expone parámetros de filtro o búsqueda, implementar filtrado y búsqueda en cliente sobre los datos ya cargados; no inventar query params no documentados.
- **Paginación:** Usar `page` y `limit` del backend cuando la API los soporte; en caso contrario, paginar en cliente (slice del array) con controles Anterior/Siguiente o números de página.
- **Stack:** Mantener HTML5, Bootstrap 5, JavaScript vanilla, Fetch API. No introducir frameworks nuevos sin aprobación.
- **Regresión:** La suite de tests del backend debe seguir en verde.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Tablas dinámicas (ordenación)

1. **Antes de implementar:** Comprobar en CONTRATO_API.md (o openapi.yaml) qué query params acepta cada endpoint (`page`, `limit`, `status`, `sort`, `order`, `search`, `q`). Usar solo los documentados; el resto en cliente (O1).
2. Implementar ordenación por columna (clic en cabecera de tabla) en al menos **3 pantallas** con listados (recomendado: Proyectos, Features, Stories; o Sprints, Releases, Incidents). Alternar ascendente/descendente al volver a clicar.
3. Mostrar indicador visual de columna ordenada y dirección (flecha o icono) en la cabecera correspondiente.

### FASE 2 — Filtros y búsqueda

4. Añadir **filtros** (por estado, por proyecto u otro criterio disponible en los datos) en al menos **3 pantallas** (ej. Proyectos por estado activo/archivado, Stories por estado, Incidents por estado). Usar controles nativos (select, input) y aplicar en cliente o con params de API si están documentados.
5. Añadir **búsqueda por texto** (input que filtre por nombre, título, código, etc.) en al menos **3 pantallas**. Si la API tiene `search` o `q` documentado, usarlo; si no, filtrar en cliente sobre el array cargado.
6. Mostrar mensaje claro cuando no hay resultados (ej. “No hay resultados para tu búsqueda o filtro”).

### FASE 3 — Paginación

7. Implementar **paginación** en al menos **4 pantallas** con listados. Los listados del backend suelen devolver `data` con `items` (o array directo) y `meta` con `total`, `page`, `limit`, `totalPages` (o equivalente); leer la estructura real documentada en el contrato para mostrar paginación correctamente (O2). Si no hay paginación en API, paginar en cliente con controles “Anterior”, “Siguiente” y/o números de página.
8. Mantener coherencia visual (mismo patrón de controles de paginación en todas las pantallas que lo tengan).

### FASE 4 — Indicadores de estado

9. Añadir **indicadores de estado visuales** (badges o colores Bootstrap: success, warning, danger, secondary, etc.) en al menos **5 pantallas**, según los estados del dominio: Project (active/archived), Feature/Story, Sprint (PLANNED, IN_PROGRESS, CLOSED), Release, Incident (OPEN, IN_PROGRESS, RESOLVED, CLOSED), Document/Version (DRAFT, APPROVED, ARCHIVED), ChangeRequest si aplica.
10. Usar una convención coherente (ej. mismo color para “cerrado”/“archived” en todas las pantallas).

### FASE 5 — Navegación y feedback visual

11. Implementar **breadcrumbs** en al menos **2 flujos anidados** (ej. Proyecto → Features; Feature → Stories). Enlaces clicables para volver al nivel superior.
12. Añadir **estado de carga** (spinner o skeleton) mientras se espera respuesta del API en al menos **5 pantallas** de listado o detalle.
13. Añadir **empty state** (mensaje e icono cuando la lista está vacía o no hay resultados de búsqueda/filtro) en las mismas pantallas con listados.
14. Revisar **navegación:** enlace o sección activa resaltada según ruta actual; botones “Volver” donde aplique; títulos de página coherentes.

### FASE 6 — Verificación y regresión

15. Recorrer las 10 pantallas y confirmar que login, listados, detalle y RBAC siguen funcionando.
16. Ejecutar la suite de tests del backend y confirmar que sigue en verde (sin cambios en API).
17. **Pantalla Reports:** Si Reports muestra listados (p. ej. GET /reports/users/:userId/activity, GET /reports/audit), aplicar el mismo patrón de paginación/filtros cuando el contrato lo permita (O3).

---

## 4️⃣ REGLAS DE DOMINIO CRÍTICAS

- **Estados:** Usar únicamente los valores de estado que devuelve el backend (ej. PLANNED, IN_PROGRESS, CLOSED para Sprints). No inventar estados ni literales distintos a los del contrato.
- **Paginación y ordenación:** Solo usar parámetros de API documentados (page, limit, sort, order si existen). Si no existen, toda la lógica es en cliente.

---

## 5️⃣ AUDITORÍA

- No se exigen nuevos eventos de auditoría en backend. El frontend no modifica el comportamiento de audit_logs.

---

## 6️⃣ QA OBLIGATORIA (6 niveles)

- **Funcional:** Ordenación, filtros, búsqueda y paginación operativos; indicadores de estado visibles; breadcrumbs y estados de carga/empty state funcionando.
- **Dominio:** Estados mostrados coinciden con los del backend; sin valores inventados.
- **Negativa:** Búsqueda sin resultados muestra mensaje; filtros vacíos manejados; paginación sin datos coherente.
- **Regresión:** Las 10 pantallas de Etapa 7 siguen operativas; suite de tests del backend en verde.
- **Seguridad:** Auth, token y RBAC intactos; sin cambios en backend.
- **Contrato:** Uso de la API solo con parámetros y respuestas documentados.

---

## 7️⃣ CRITERIO DE CIERRE

- Tablas dinámicas (ordenación) en al menos 3 pantallas.
- Filtros en al menos 3 pantallas; búsqueda en al menos 3 pantallas.
- Paginación en al menos 4 pantallas.
- Indicadores de estado en al menos 5 pantallas.
- Breadcrumbs en al menos 2 flujos anidados; carga y empty state en al menos 5 pantallas.
- Backend sin cambios; suite de tests del backend en verde.

---

## 8️⃣ EVIDENCIA OBLIGATORIA

**Entrega en archivo:** `docs/EVIDENCIA_ETAPA_8_UX_OPERATIVA_<YYYY-MM-DD>.md`

Contenido mínimo:

1. Lista de archivos creados o modificados (carpeta `public/` y subcarpetas).
2. Tabla o lista indicando en qué pantalla se implementó: ordenación, filtros, búsqueda, paginación, indicadores de estado, breadcrumbs, carga, empty state.
3. Confirmación de que el backend no ha cambiado y que la suite de tests del backend sigue en verde.
4. Capturas o pasos para verificar al menos un flujo de filtro+búsqueda y uno de paginación.
5. Referencia al plan: PLAN_ETAPA_8_UX_OPERATIVA.md.

---

## 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporadas)

| Id | Observación | Aplicación en el prompt |
|----|-------------|-------------------------|
| **O1** | Fuente de verdad: CONTRATO_API.md / openapi.yaml | FASE 1 paso 1: comprobar qué query params acepta cada endpoint antes de implementar ordenación, filtros y paginación; usar solo los documentados. |
| **O2** | Estructura de respuesta paginada | FASE 3 paso 7: leer la estructura real documentada en el contrato (data.items, meta.total, meta.page, meta.limit, totalPages o equivalente) para mostrar paginación correctamente. |
| **O3** | Pantalla Reports | FASE 6 paso 17: si Reports muestra listados (users/activity, audit), aplicar el mismo patrón de paginación/filtros cuando el contrato lo permita. |

**Validación:** APROBADO — SYSTEM ARCHITECT. Ver docs/VALIDACION_ARQUITECTONICA_ETAPA_8_UX_OPERATIVA.md.
