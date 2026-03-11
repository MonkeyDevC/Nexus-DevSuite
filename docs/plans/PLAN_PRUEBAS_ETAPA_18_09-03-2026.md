# Plan de pruebas ETAPA 18 — 09-03-2026 (ejecutable)

**Objetivo:** Ejecutar pruebas humanas de todos los flujos actuales antes de conectar nuevos endpoints (Semana 2).  
**Referencia:** docs/plans/PLAN_ETAPA_18_09-03-2026.md, docs/ENDPOINTS_API_Y_USO_FRONTEND.md  
**Roles:** Probar como **MASTER** (todas las pantallas); opcional como **EMPLOYEE** (ver que Admin/acciones restringidas no estén disponibles).

---

## 1. Flujos y casos a probar

Cada fila es un **caso ejecutable**. Marcar ☐ → ☑ al pasar.

### 1.1 Autenticación

| # | Caso | Qué hacer | ☑ |
|---|------|-----------|---|
| A1 | Login OK | Credenciales válidas → redirección a #/dashboard; UI muestra usuario (GET /auth/me). | |
| A2 | Logout | Cerrar sesión → redirección a login; no acceder a #/dashboard sin login. | |
| A3 | Ruta protegida sin login | Ir a #/projects sin estar logueado → redirección a login o 401. | |

### 1.2 Dashboard

| # | Caso | Qué hacer | ☑ |
|---|------|-----------|---|
| D1 | Carga dashboard | #/dashboard carga sin error; breadcrumb y tarjetas o empty state visibles. | |
| D2 | Enlaces del menú | Clic en Projects, Features, Sprints, Releases, Incidents, Documents, Reports → cargan las vistas. | |

### 1.3 Proyectos

| # | Caso | Qué hacer | ☑ |
|---|------|-----------|---|
| P1 | Listar proyectos | #/projects → lista o "No projects yet". Filtro por estado si existe. | |
| P2 | Crear proyecto | Botón crear → formulario → guardar → proyecto en lista o detalle. | |
| P3 | Detalle proyecto | Clic en proyecto → #/projects/:id; enlaces a Features, Sprints, Incidents. | |
| P4 | Archivar (MASTER) | En detalle, Archivar → proyecto pasa a ARCHIVED o desaparece del listado activo. | |

### 1.4 Features

| # | Caso | Qué hacer | ☐ |
|---|------|-----------|---|
| F1 | Listar features | Seleccionar proyecto → lista de features o empty. | |
| F2 | Crear feature | Crear feature → aparece en lista. | |
| F3 | Stories de feature | Entrar a una feature → listar/crear stories. | |

### 1.5 Stories

| # | Caso | Qué hacer | ☐ |
|---|------|-----------|---|
| S1 | Listar stories | Por proyecto/feature → lista o empty. | |
| S2 | Crear story | Crear story → aparece en lista. Consola sin errores. | |

### 1.6 Sprints

| # | Caso | Qué hacer | ☐ |
|---|------|-----------|---|
| SP1 | Listar sprints | Por proyecto → lista o empty. | |
| SP2 | Crear sprint | Crear sprint → aparece. | |
| SP3 | Detalle sprint | Clic en sprint → detalle carga. | |
| SP4 | Cerrar sprint | Botón cerrar → verificar que la llamada funciona (si falla, anotar para Etapa 21: /close vs /status). | |

### 1.7 Releases

| # | Caso | Qué hacer | ☐ |
|---|------|-----------|---|
| R1 | Listar releases | #/releases → lista o empty. | |
| R2 | Crear release | Crear → aparece. | |
| R3 | Detalle release | Clic en release → detalle carga. | |

### 1.8 Incidentes

| # | Caso | Qué hacer | ☐ |
|---|------|-----------|---|
| I1 | Listar por proyecto | Desde proyecto → incidentes; lista o empty. | |
| I2 | Crear incidente | Crear incidente en proyecto → aparece en lista. | |

### 1.9 Documentos

| # | Caso | Qué hacer | ☐ |
|---|------|-----------|---|
| DOC1 | Listar documentos | #/documents → lista o empty. | |
| DOC2 | Crear documento | Crear → aparece. | |
| DOC3 | Detalle documento | Clic en documento → detalle carga. | |

### 1.10 Reportes

| # | Caso | Qué hacer | ☐ |
|---|------|-----------|---|
| REP1 | Resumen proyecto | Reports → elegir proyecto → resumen carga. | |
| REP2 | Resumen sprint | Elegir sprint → resumen carga. | |
| REP3 | Auditoría (MASTER) | Ver log de auditoría → datos o empty. | |

### 1.11 Admin — Usuarios (MASTER)

| # | Caso | Qué hacer | ☐ |
|---|------|-----------|---|
| U1 | Listar usuarios | #/admin → usuarios → lista. | |
| U2 | Crear usuario | Crear usuario → aparece; roles desde GET /auth/roles. | |
| U3 | Editar usuario | Editar (PUT), foto, cambiar contraseña. | |
| U4 | Eliminar usuario | Soft delete → usuario ya no en lista activa. | |

### 1.12 Admin — Métricas (MASTER)

| # | Caso | Qué hacer | ☐ |
|---|------|-----------|---|
| M1 | Panel métricas | GET /system/metrics → panel carga sin error. | |

### 1.13 Rol EMPLOYEE (opcional)

| # | Caso | Qué hacer | ☐ |
|---|------|-----------|---|
| E1 | Sin acceso Admin | #/admin no accesible o mensaje "Sin permisos". | |
| E2 | Acciones restringidas | Botones Archivar, Cerrar sprint, etc., no visibles o deshabilitados según API. | |

---

## 2. Registro de fallos

Al encontrar un fallo, anotar aquí (o en docs/project-logs/resultados-pruebas-etapa-18-09-03-2026.md):

| Caso | Descripción | Pasos para reproducir | Error (consola/UI) |
|------|-------------|------------------------|---------------------|
|     |             |                        |                     |

---

## 3. Criterio de paso

- **Pasa:** Caso ejecutado y comportamiento correcto (o empty state coherente).
- **Falla:** Caso ejecutado pero error, pantalla en blanco, o comportamiento incorrecto → registrar en sección 2.

Al final del día: lista de fallos priorizada para MASTER DEVELOPER (bloqueantes > mayores > menores).

---

*Documento listo para ejecutar el Día 1 (Etapa 18). Responsable ejecución: TEAM. Validación: QA ENGINEER. Cierre: PO MASTER.*
