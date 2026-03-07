# NEXUS DevSuite — Autonomous Development Loop

**Documento:** Arquitectura de gobernanza avanzada  
**Propósito:** Definir el sistema autónomo de ejecución de etapas del proyecto mediante agentes especializados.  
**Referencias:** .cursor/rules/nexus-plan-maestro-etapas.mdc, .cursor/rules/nexus-po-master-gobernanza.mdc, docs/CHECKLIST_ETAPAS_PROYECTO.md, docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md

---

## 1. Propósito del Autonomous Development Loop

Nexus DevSuite utiliza un **Autonomous Development Loop** (bucle de desarrollo autónomo) para ejecutar el ciclo de desarrollo completo de forma gobernada y trazable. El sistema se apoya en **agentes especializados** que asumen roles definidos (PO MASTER, SYSTEM ARCHITECT, MASTER DEVELOPER, QA ENGINEER) y en un **trigger humano** (CEO) que inicia la ejecución de cada etapa. El Loop garantiza que cada avance pase por diseño, validación arquitectónica, implementación, evidencia, validación de calidad y auditoría de cierre, alineado con principios de gestión de calidad y trazabilidad (ISO 9001 Ready).

---

## 2. Arquitectura del sistema de agentes

| Agente | Rol |
|--------|-----|
| **CEO (trigger humano)** | Define la solicitud de ejecución de una etapa; inicia el pipeline. No ejecuta tareas técnicas. |
| **PO MASTER** | Diseña la etapa (plan, criterios, alcance), genera el prompt de implementación tras validación arquitectónica y audita el cierre de etapa. Responsable de gobernanza y trazabilidad. |
| **SYSTEM ARCHITECT** | Valida que la etapa respete la arquitectura del sistema (backend, API, capas, RBAC). Debe aprobar antes de que se genere el prompt al MASTER DEVELOPER. |
| **MASTER DEVELOPER** | Implementa el código según el prompt aprobado y entrega evidencia estructurada (archivos, confirmaciones, resultados de verificación). |
| **QA ENGINEER** | Valida la calidad de la implementación de forma independiente (modelo de QA en 6 niveles). Debe aprobar antes de que el PO MASTER audite el cierre. |

Cada rol está definido en las reglas del proyecto (.cursor/rules/) y en docs/CHECKLIST_ETAPAS_PROYECTO.md.

---

## 3. Pipeline oficial del ciclo de desarrollo

El ciclo oficial por etapa es el siguiente:

```
CEO solicita ejecución de etapa
         ↓
PO MASTER diseña etapa
         ↓
SYSTEM ARCHITECT valida arquitectura
         ↓
PO MASTER genera prompt de implementación
         ↓
MASTER DEVELOPER implementa
         ↓
MASTER DEVELOPER entrega evidencia
         ↓
QA ENGINEER valida calidad
         ↓
PO MASTER audita cierre de etapa
```

Este pipeline se repite para cada etapa (por ejemplo, ETAPA 14, 15, 16, 17). No se debe saltar ningún paso; la validación del SYSTEM ARCHITECT es condición previa para generar el prompt, y la validación del QA ENGINEER es condición previa para que el PO MASTER apruebe el cierre.

### Checklist de ejecución automática (todos por etapa)

Para **ver y seguir la ejecución** de cada etapa de forma automática, se utiliza el siguiente checklist. Cada fila corresponde a un paso del pipeline; marcar como completado cuando el responsable haya cumplido su entrega.

**ETAPA 14 — Rediseño de módulos operativos**

| # | Paso | Responsable | Estado |
|---|------|-------------|--------|
| 1 | CEO solicita ejecución de etapa 14 | CEO | ☐ |
| 2 | PO MASTER diseña etapa (plan + prompt) | PO MASTER | ☐ |
| 3 | SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ☐ |
| 4 | PO MASTER genera prompt de implementación | PO MASTER | ☐ |
| 5 | MASTER DEVELOPER implementa | MASTER DEVELOPER | ☐ |
| 6 | MASTER DEVELOPER entrega evidencia | MASTER DEVELOPER | ☐ |
| 7 | QA ENGINEER valida calidad (6 niveles) | QA ENGINEER | ☐ |
| 8 | PO MASTER audita cierre de etapa 14 | PO MASTER | ☐ |

**ETAPA 15 — Panel administrativo UI**

| # | Paso | Responsable | Estado |
|---|------|-------------|--------|
| 1 | CEO solicita ejecución de etapa 15 | CEO | ☐ |
| 2 | PO MASTER diseña etapa (plan + prompt) | PO MASTER | ☐ |
| 3 | SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ☐ |
| 4 | PO MASTER genera prompt de implementación | PO MASTER | ☐ |
| 5 | MASTER DEVELOPER implementa | MASTER DEVELOPER | ☐ |
| 6 | MASTER DEVELOPER entrega evidencia | MASTER DEVELOPER | ☐ |
| 7 | QA ENGINEER valida calidad (6 niveles) | QA ENGINEER | ☐ |
| 8 | PO MASTER audita cierre de etapa 15 | PO MASTER | ☐ |

**ETAPA 16 — Reportes y analítica visual**

| # | Paso | Responsable | Estado |
|---|------|-------------|--------|
| 1 | CEO solicita ejecución de etapa 16 | CEO | ☐ |
| 2 | PO MASTER diseña etapa (plan + prompt) | PO MASTER | ☐ |
| 3 | SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ☐ |
| 4 | PO MASTER genera prompt de implementación | PO MASTER | ☐ |
| 5 | MASTER DEVELOPER implementa | MASTER DEVELOPER | ☐ |
| 6 | MASTER DEVELOPER entrega evidencia | MASTER DEVELOPER | ☐ |
| 7 | QA ENGINEER valida calidad (6 niveles) | QA ENGINEER | ☐ |
| 8 | PO MASTER audita cierre de etapa 16 | PO MASTER | ☐ |

**ETAPA 17 — Hardening UX y responsive**

| # | Paso | Responsable | Estado |
|---|------|-------------|--------|
| 1 | CEO solicita ejecución de etapa 17 | CEO | ☐ |
| 2 | PO MASTER diseña etapa (plan + prompt) | PO MASTER | ☐ |
| 3 | SYSTEM ARCHITECT valida arquitectura | SYSTEM ARCHITECT | ☐ |
| 4 | PO MASTER genera prompt de implementación | PO MASTER | ☐ |
| 5 | MASTER DEVELOPER implementa | MASTER DEVELOPER | ☐ |
| 6 | MASTER DEVELOPER entrega evidencia | MASTER DEVELOPER | ☐ |
| 7 | QA ENGINEER valida calidad (6 niveles) | QA ENGINEER | ☐ |
| 8 | PO MASTER audita cierre de etapa 17 | PO MASTER | ☐ |

Al completar los 8 pasos de una etapa, se considera la etapa cerrada. Para la siguiente etapa se repite el mismo checklist. El estado detallado por etapa se mantiene también en **docs/CHECKLIST_ETAPAS_PROYECTO.md**.

---

## 4. Integración con el Plan Maestro

Las etapas del sistema se definen en **.cursor/rules/nexus-plan-maestro-etapas.mdc** (Plan Maestro Estratégico NEXUS DevSuite). El Autonomous Development Loop **ejecuta esas etapas de forma gobernada**: no redefine alcance ni criterios, sino que aplica el pipeline de agentes al diseño y a la implementación de cada etapa según lo establecido en el Plan Maestro. Las Etapas 14–17 (Rediseño módulos operativos, Panel administrativo UI, Reportes y analítica visual, Hardening UX y responsive) forman parte de la Fase de Evolución UX/UI y están descritas en ese documento.

---

## 5. Integración con wireframes UX/UI

Las etapas UX/UI (12–17) utilizan como referencia de diseño el documento **docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md**, que enumera las pantallas pendientes de diseño, sus rutas y los elementos de UI clave. Los **wireframes** (imágenes o especificaciones generadas, por ejemplo con Gemini) **guían la implementación visual** en el frontend. El MASTER DEVELOPER debe alinear la implementación con esos wireframes y con el design system (Etapa 12) sin modificar backend, API ni contratos.

---

## Wireframe Visual Inputs

Las **imágenes de wireframes** proporcionadas por el **CEO** (generadas con Gemini u otras herramientas) constituyen el **input visual de diseño** para las etapas UX/UI. Sirven como **referencia visual** para clasificar pantallas, entender el layout, identificar componentes (tablas, filtros, breadcrumbs, badges, botones, empty states) y alinear la implementación futura en las etapas 14–17.

**Uso por el sistema de agentes:**

- La **implementación** se basa en esas imágenes **junto con** la guía definida en **docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md**. El documento textual describe rutas, contenido principal y elementos de UI; las imágenes aportan la referencia visual concreta.
- Las imágenes **no se modifican ni se procesan**; solo se utilizan como referencia para clasificación, layout y componentes.
- Las imágenes forman parte del **input de diseño del proyecto**, pero **no forman parte del código ni del repositorio obligatorio**. El sistema de agentes las usa **únicamente como guía visual** durante la ejecución de las etapas 14–17.

**Trazabilidad del input de diseño:**

La existencia de estas imágenes queda documentada aquí para **trazabilidad**. Cada wireframe visual entregado por el CEO se asocia conceptualmente a una o varias pantallas del sistema. Las pantallas posibles son las definidas en docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md, por ejemplo:

- /dashboard — /projects — /projects/:id — /features — /stories — /sprints — /sprints/:id — /releases — /releases/:id — /incidents — /documents — /documents/:id — /admin — /admin/users — /admin/audit — /admin/metrics — /reports

A continuación se registra la **correspondencia** entre los wireframes visuales proporcionados y las pantallas del sistema, para que PO MASTER, SYSTEM ARCHITECT, MASTER DEVELOPER y QA ENGINEER puedan referenciarlos durante la ejecución de las etapas.

| Referencia visual (contenido del wireframe) | Pantalla(s) asociada(s) | Módulo | Etapa |
|--------------------------------------------|-------------------------|--------|-------|
| Stories: breadcrumb Dashboard/Projects/Project/Feature/Stories; título "Stories"; filtros (Project, Feature, Status); tabla Story ID, Title, Status, Assigned Sprint, Priority, Assignee, Actions; "+ New Story"; paginación; empty state "No stories created yet" | /stories | Stories | ETAPA 14 |
| Features list: breadcrumb …/Features; "Features"; Project selector, Search, Filter by status; tabla Feature title, Status, Stories count, Actions; "+ New Feature" | /features | Features | ETAPA 14 |
| Stories list (alternativa): breadcrumb …/Feature/Stories; "Stories"; Feature selector; tabla Story title, Status, Assigned sprint, Actions; "+ New Story"; paginación | /stories | Stories | ETAPA 14 |
| Admin dashboard: "Administration"; tres tarjetas Users, Audit Logs, Metrics con "Open"; sidebar Administration > Users Management, Metrics, Audit Logs | /admin | Admin | ETAPA 15 |
| Users management: breadcrumb Administration/Users Management; "Users"; search, filter by role; tabla Email, Role, Status, Actions; "+ New User"; paginación | /admin/users | Admin Users | ETAPA 15 |
| System metrics: breadcrumb Administration/Metrics; "Metrics"; "Refresh metrics"; tarjetas total_requests, total_errors, auth_failures, refresh_failures; Metric Details | /admin/metrics | System Metrics | ETAPA 15 |
| Sprints list: "Sprints"; project selector; "+ New Sprint"; filtros (name, dates, Status PLANNED/ACTIVE/CLOSED); tabla de sprints; paginación/acciones | /sprints | Sprints | ETAPA 14 |
| Sprint detail: breadcrumb …/Sprint; tarjeta Sprint (name, start date, end date, status); tabla de stories asignadas (story title, status, assignee); "Close Sprint" | /sprints/:id | Sprints | ETAPA 14 |
| Dashboard: Quick navigation (Projects, Features, Sprints, Releases); Recent Projects con badges ACTIVE; empty state "No projects yet" / "Create project" | /dashboard | Dashboard | ETAPA 13 (referencia) |
| Project list: "Projects"; Search, Filter by status; "+ New Project"; tabla Name, Status, Created date, Actions; paginación | /projects | Projects | ETAPA 14 |
| Dashboard (completo): Welcome [User] \| Dashboard; Active Projects, Open Stories, Sprint Progress, Critical Incidents; My Assignments; Project Health; Active Sprint Status; Recent Activity | /dashboard | Dashboard | ETAPA 13 (referencia) |
| Incident list: breadcrumb Dashboard/Incidents; Project selector, Search, Status filter; "+ New Incident"; tabla Title, Severity, Status, Created date, Actions | /incidents | Incidents | ETAPA 14 |
| Document list: breadcrumb Dashboard/Documents; "Documents"; Search; "+ New Document"; tabla Code, Title, Latest version, Status, Actions; paginación | /documents | Documents | ETAPA 14 |

Las imágenes se encuentran en los assets del proyecto (por ejemplo en la carpeta de imágenes proporcionadas por el CEO). Esta tabla se actualiza cuando se incorporan nuevos wireframes visuales para mantener la trazabilidad del input de diseño.

---

## 6. Restricciones técnicas de las etapas 14–17

Las **ETAPAS 14, 15, 16 y 17** están sujetas a las siguientes restricciones:

**Permitido modificar únicamente:**

- **HTML**
- **CSS**
- **Bootstrap**
- **JavaScript**

ubicados en la carpeta **public/**.

**No está permitido modificar:**

- Backend (servicios, controladores, repositorios, modelos de dominio).
- API (contratos, rutas, Response Layer v1).
- RBAC (roles, permisos, guards).
- Sistema multi-tenant.

Cualquier cambio que viole estas restricciones debe ser rechazado por el SYSTEM ARCHITECT y corregido antes de continuar.

---

## 7. Ejecución automática del pipeline

Cuando el **CEO solicita la ejecución de una etapa** (por ejemplo, "ejecutar Etapa 14"), el sistema debe **ejecutar automáticamente** el pipeline de agentes definido en la sección 3: el PO MASTER diseña (o utiliza el plan ya definido), el SYSTEM ARCHITECT valida, el PO MASTER genera el prompt, el MASTER DEVELOPER implementa y entrega evidencia, el QA ENGINEER valida y el PO MASTER audita el cierre. La automatización se entiende como la secuencia ordenada de pasos y entregables definidos en docs/CHECKLIST_ETAPAS_PROYECTO.md y en las reglas de gobernanza, de modo que cada agente pueda ejecutar su parte sin ambigüedad.

---

## 8. Manejo de fallos

- **Si el SYSTEM ARCHITECT rechaza la arquitectura:** El ciclo vuelve al **PO MASTER**. El PO MASTER debe ajustar el diseño o el alcance de la etapa según las observaciones del arquitecto (por ejemplo, incorporando ajustes en docs/AJUSTES_PO_ETAPA_*_SEGUN_ARCHITECT.md) y volver a someter a validación. No se genera prompt al MASTER DEVELOPER hasta que no exista aprobación del SYSTEM ARCHITECT.

- **Si el QA ENGINEER rechaza la validación:** El ciclo vuelve al **PO MASTER** y, en la práctica, al **MASTER DEVELOPER**: la implementación debe corregirse según los criterios de bloqueo o incumplimientos reportados por QA. El MASTER DEVELOPER entrega evidencia actualizada y el QA ENGINEER vuelve a validar. El PO MASTER no debe aprobar el cierre de etapa hasta que el QA ENGINEER haya aprobado la validación.

En ambos casos, la trazabilidad se mantiene mediante documentos de validación y ajustes (docs/VALIDACION_*, docs/AJUSTES_*, docs/QA_VALIDACION_*).

---

## 9. Beneficios del Autonomous Development Loop

El sistema permite:

- **Desarrollo gobernado:** Cada etapa pasa por diseño, validación arquitectónica, implementación controlada y validación de calidad antes del cierre.
- **Automatización del ciclo de vida:** El pipeline está definido y es repetible; los agentes saben qué paso sigue en cada momento.
- **Trazabilidad completa:** Planes, prompts, evidencias y validaciones quedan documentados y referenciados en el checklist.
- **Calidad verificable:** El QA ENGINEER valida de forma independiente en 6 niveles antes de que el PO MASTER audite el cierre.
- **Ejecución reproducible:** Mismas reglas (nexus-po-master-gobernanza, nexus-engineering-execution, nexus-plan-maestro-etapas) y mismo flujo para cada etapa, lo que facilita auditoría y cumplimiento de estándares tipo ISO 9001.

---

*Documento de arquitectura de gobernanza — NEXUS DevSuite. Las etapas 14–17 se ejecutan mediante este Autonomous Development Loop.*
