# Plan ETAPA 8 — UX Operativa

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase de evolución del producto)  
**Objetivo:** Mejorar la experiencia de usuario de la plataforma web (Etapa 7) con tablas dinámicas, filtros, búsqueda, paginación, indicadores de estado y mejoras visuales de navegación.  
**Estado:** Diseñado por PO MASTER — pendiente validación SYSTEM ARCHITECT

---

## 1. Contexto

- **Situación actual:** La ETAPA 7 entregó una interfaz web operativa en `public/` (HTML5, Bootstrap, JavaScript, Fetch API) con 10 pantallas que consumen el backend. Los listados son funcionales pero sin tablas dinámicas, filtros avanzados, búsqueda ni paginación en UI; la navegación y los indicadores de estado son básicos.
- **Objetivo de la etapa:** Añadir mejoras de UX sobre la base existente: tablas dinámicas (ordenación, columnas visibles), filtros y búsqueda en listados, paginación en cliente o integrada con la API cuando el backend la soporte (page/limit), indicadores de estado visuales (badges, colores por estado) y mejoras de navegación (breadcrumbs, feedback visual, estados de carga).
- **Principios:** No modificar contratos ni rutas del backend. Todo el trabajo es en el frontend (`public/`). Respeta Response Layer v1 y RBAC. La API ya expone en muchos listados parámetros como `page`, `limit`, `sort` cuando aplica; el frontend debe usarlos donde existan y complementar en cliente (filtros, búsqueda) cuando la API no los ofrezca.

---

## 2. Alcance (solo frontend)

| Elemento | Especificación |
|----------|----------------|
| **Backend** | Sin cambios. No se añaden endpoints ni se modifican contratos. |
| **Frontend** | Mejoras en vistas y componentes existentes en `public/`. Opcional: módulo o utilidades compartidas para tablas, filtros y paginación reutilizables. |
| **Stack** | Mismo que Etapa 7: HTML5, Bootstrap 5, JavaScript vanilla, Fetch API. |

---

## 3. Subcomponentes de la etapa

### 3.1 Tablas dinámicas

- **Definición:** Listados en formato tabla con posibilidad de ordenar por columnas (clic en cabecera) y, si aplica, mostrar/ocultar columnas o alternar orden ascendente/descendente.
- **Dónde aplicar:** Al menos en las pantallas con listados principales: Proyectos, Features, Stories, Sprints, Releases, Incidents, Documents. Criterio mínimo: al menos 3 pantallas con ordenación por columna; el resto puede ser ordenación en cliente sobre los datos ya cargados.
- **Implementación:** En cliente (ordenar el array de datos) o, si el backend acepta `sort`/`orderBy` en query, usarlo. No inventar parámetros de API no documentados en CONTRATO_API.md.

### 3.2 Filtros y búsqueda

- **Filtros:** Controles (select, input) que reduzcan los ítems mostrados según criterio (ej. por estado, por proyecto, por fecha). Los filtros se aplican en cliente sobre los datos cargados o, si la API admite query params de filtro (ej. `status`, `projectId`), usarlos.
- **Búsqueda:** Campo de búsqueda (texto) que filtre en cliente por uno o varios campos (nombre, título, código, etc.) según la pantalla. Si la API ofrece un parámetro `search` o `q` documentado, usarlo.
- **Dónde aplicar:** Al menos en Proyectos, Features, Stories, Incidents y Documents. Criterio mínimo: al menos 3 pantallas con filtros y 3 con búsqueda de texto; el resto puede ser parcial o dejarse coherente con la misma UX (mismo patrón de controles).

### 3.3 Paginación

- **Objetivo:** Evitar listas excesivamente largas en pantalla; mostrar un subconjunto (p. ej. 10 o 20 ítems por página) con controles “Anterior / Siguiente” o números de página.
- **Estrategia:** Si el backend devuelve paginación (ej. `data.items`, `meta.total`, `meta.page`, `meta.limit`), usarla y solicitar páginas con `page` y `limit`. Si no, paginar en cliente sobre los datos ya cargados (slice del array).
- **Dónde aplicar:** En todas las pantallas con listados que puedan tener muchos ítems: Proyectos, Features, Stories, Sprints, Releases, Incidents, Documents. Criterio mínimo: controles de paginación visibles y funcionales en al menos 4 pantallas; el resto puede ser “ver más” o paginación en cliente.

### 3.4 Indicadores de estado (visuales)

- **Objetivo:** Mostrar de forma clara el estado de entidades (proyecto archivado, feature/story/sprint/release/incident/document status) con badges o colores (Bootstrap: badge-success, badge-warning, badge-danger, etc.).
- **Dónde aplicar:** En listados y, si aplica, en detalle. Estados típicos: Project (active/archived), Feature/Story (status del backlog), Sprint (PLANNED, IN_PROGRESS, CLOSED), Release (status), Incident (OPEN, IN_PROGRESS, RESOLVED, CLOSED), Document/DocumentVersion (DRAFT, APPROVED, ARCHIVED), ChangeRequest (DRAFT, SUBMITTED, APPROVED, REJECTED, IMPLEMENTED).
- **Criterio:** Al menos 5 pantallas con indicadores de estado visibles y consistentes (misma convención de colores por tipo de estado).

### 3.5 Mejoras visuales de navegación

- **Breadcrumbs:** En pantallas de detalle o anidadas (ej. Proyecto → Features → Stories), mostrar ruta de navegación (breadcrumb) para volver atrás con claridad.
- **Feedback visual:** Estados de carga (spinner o skeleton) mientras se espera respuesta del API; mensaje claro cuando la lista está vacía o no hay resultados de búsqueda/filtro.
- **Navegación y accesibilidad:** Enlaces activos resaltados según ruta actual; títulos de página coherentes; botones “Volver” donde aplique.
- **Criterio mínimo:** Breadcrumbs en al menos 2 flujos anidados (ej. Proyecto → Features, Feature → Stories); carga/empty state en al menos 5 pantallas de listado.

---

## 4. Criterios de aceptación (resumen)

- Tablas dinámicas: ordenación por columna en al menos 3 pantallas; sin romper contrato API.
- Filtros: al menos 3 pantallas con filtros (por estado u otro criterio disponible).
- Búsqueda: al menos 3 pantallas con búsqueda de texto (en cliente o por API si está documentado).
- Paginación: controles de paginación en al menos 4 pantallas (API o cliente).
- Indicadores de estado: badges/colores en al menos 5 pantallas, coherentes con los estados del dominio.
- Navegación: breadcrumbs en al menos 2 flujos anidados; estados de carga y lista vacía en al menos 5 pantallas.
- Backend sin cambios; regresión de tests en verde.

---

## 5. QA (6 niveles) — aplicación a la etapa

| Nivel | Criterio para ETAPA 8 |
|-------|------------------------|
| **Funcional** | Ordenación, filtros, búsqueda y paginación funcionan; indicadores de estado se muestran correctamente; breadcrumbs y estados de carga operativos. |
| **Dominio** | Los estados mostrados coinciden con los del backend; no se inventan estados ni valores. |
| **Negativa** | Búsqueda sin resultados muestra mensaje; filtros vacíos manejados; paginación sin datos coherente. |
| **Regresión** | Las 10 pantallas de Etapa 7 siguen operativas; tests del backend en verde; no se modifican rutas ni contratos. |
| **Seguridad** | Sin cambios en auth/RBAC; token y protección de rutas intactos. |
| **Contrato** | Uso de la API solo con parámetros y respuestas documentados (CONTRATO_API.md / openapi.yaml). |

---

## 6. Evidencia y documentación

- Lista de archivos modificados (vistas, JS nuevo o compartido).
- Descripción breve de dónde se aplicó cada subcomponente (tablas dinámicas, filtros, búsqueda, paginación, indicadores, navegación).
- Confirmación de que el backend no ha cambiado y que la suite de tests del backend sigue en verde.

---

## 7. No incluido en esta etapa

- Panel administrativo (usuarios, roles, auditoría visual, métricas): ETAPA 9.
- Preparación SaaS (multi-tenant, billing): ETAPA 10.
- Cambios en backend (nuevos endpoints de búsqueda/filtro): solo se usan los existentes o filtrado en cliente.

---

*Documento de diseño ETAPA 8 — UX Operativa. Aprobación pendiente: SYSTEM ARCHITECT.*
