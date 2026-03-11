# Plan del siguiente sprint — Auditoría estado actual 2026

**Origen:** docs/AUDITORIA_FUNCIONAL_FRONTEND_ESTADO_ACTUAL_2026.md (PO)  
**Objetivo:** Definir el bloque de desarrollo con los 6 nuevos tickets (NEXUS-AUD-027 a 032) derivados de la auditoría de estado actual del frontend.  
**Referencia:** Todos los tickets están especificados en la sección 4 de `docs/AUDITORIA_FUNCIONAL_FRONTEND_ESTADO_ACTUAL_2026.md`.

---

# 1. TICKETS DEL SPRINT

| Orden | Ticket | Título | Módulo | Prioridad |
|-------|--------|--------|--------|-----------|
| 1 | **NEXUS-AUD-027** | Release: enlace a feature por id en lista de features del release | Releases | P3 |
| 2 | **NEXUS-AUD-028** | Búsqueda global en topbar | Layout | P3 |
| 3 | **NEXUS-AUD-029** | Settings: enlaces a Organización y Usuarios | Settings | P3 |
| 4 | **NEXUS-AUD-030** | Accesibilidad en vistas principales | Transversal | P3 |
| 5 | **NEXUS-AUD-031** | Reportes en sidebar: documentar o ajustar visibilidad | Layout | P3 |
| 6 | **NEXUS-AUD-032** | Projects: CTA en empty state del listado | Projects | P3 |

---

# 2. ORDEN DE IMPLEMENTACIÓN RECOMENDADO

| Orden | Ticket | Justificación |
|-------|--------|----------------|
| 1 | **NEXUS-AUD-032** | Cambio acotado en un solo archivo (projects.js). Rápido de implementar y verificar. |
| 2 | **NEXUS-AUD-029** | Un archivo (settings.js). Enlaces estáticos; sin dependencia de otros tickets. |
| 3 | **NEXUS-AUD-027** | Un archivo (releases.js). Ajuste de enlaces en lista de features; depende solo de que la API devuelva `id` en cada feature. |
| 4 | **NEXUS-AUD-031** | Decisión de producto + opcionalmente layout.js y documentación. Puede cerrarse como “verificado y documentado” si no se cambia política. |
| 5 | **NEXUS-AUD-028** | Layout; requiere definir alcance (enlaces rápidos vs. sugerencias). Puede implementarse de forma incremental. |
| 6 | **NEXUS-AUD-030** | Transversal; varias vistas. Conviene hacerlo al final para no tocar los mismos archivos que otros tickets. |

**Dependencias:** Ningún ticket depende de otro del mismo sprint. El orden es por impacto y alcance (más acotados primero).

---

# 3. TABLA DE DETALLE POR TICKET

| Ticket | Archivos permitidos | Endpoints | Criterios de aceptación (resumen) |
|--------|---------------------|-----------|-----------------------------------|
| **NEXUS-AUD-027** | public/js/views/releases.js | Ninguno nuevo | Enlace a #/features/:id cuando el release devuelva feature con id; si no, mantener #/features?project=. |
| **NEXUS-AUD-028** | public/js/layout.js; opcional componente globalSearch.js, index.html | GET /projects (y opc. GET /releases) con params actuales | El input de búsqueda del topbar tiene comportamiento definido (enlaces y/o sugerencias). |
| **NEXUS-AUD-029** | public/js/views/settings.js | Ninguno | Desde Ajustes hay enlaces visibles a Organización y Usuarios (solo MASTER). |
| **NEXUS-AUD-030** | dashboard.js, projects.js, releases.js, incidents.js, features.js, stories.js, sprints.js; modales si aplica | Ninguno | Mejora en aria-labels, enlaces “Ver” con contexto, focus visible, encabezados coherentes. |
| **NEXUS-AUD-031** | public/js/layout.js; opcional docs | Ninguno | Visibilidad del menú Reportes alineada con política; documentada si no hay cambio. |
| **NEXUS-AUD-032** | public/js/views/projects.js | Ninguno | Con lista vacía de proyectos, el usuario ve un CTA claro “Crear proyecto”. |

---

# 4. DEPENDENCIAS ENTRE TICKETS

| Ticket | Depende de | Notas |
|--------|------------|-------|
| NEXUS-AUD-027 | — | Ninguna. |
| NEXUS-AUD-028 | — | Ninguna. Alcance a definir (enlaces rápidos vs. búsqueda con sugerencias). |
| NEXUS-AUD-029 | — | Ninguna. |
| NEXUS-AUD-030 | — | Ninguna. Aplicar por vista para no abrir alcance excesivo. |
| NEXUS-AUD-031 | — | Ninguna. Puede cerrarse solo con documentación si no se cambia política. |
| NEXUS-AUD-032 | — | Ninguna. |

---

# 5. RIESGOS TÉCNICOS

| Riesgo | Ticket(s) | Mitigación |
|--------|-----------|------------|
| **Release no devuelve feature id** | NEXUS-AUD-027 | Comprobar contrato de GET /releases/:id (objeto `features`). Si no hay `id`, mantener enlace actual por proyecto. |
| **Alcance de búsqueda topbar** | NEXUS-AUD-028 | Fijar alcance antes de implementar: solo enlaces rápidos, o búsqueda de proyectos por nombre con GET /projects (search si existe). |
| **Accesibilidad: muchas vistas** | NEXUS-AUD-030 | Priorizar dashboard, projects, releases, incidents; aplicar por fases si el sprint es corto. |

---

# 6. CIERRE TRAS CADA TICKET

- Actualizar **docs/ENDPOINTS_API_Y_USO_FRONTEND.md** solo si se usa algún endpoint nuevo o se cambia el uso documentado.
- Registrar la implementación en **docs/project-logs/TICKETS_IMPLEMENTADOS.md** con el formato indicado en ese documento.
- Validar según los criterios de aceptación detallados en **docs/AUDITORIA_FUNCIONAL_FRONTEND_ESTADO_ACTUAL_2026.md** (sección 4).

---

*Este plan corresponde al siguiente sprint tras la auditoría de estado actual. Los tickets 027-032 son opcionales (P3) y pueden priorizarse o repartirse en más de un sprint según capacidad.*
