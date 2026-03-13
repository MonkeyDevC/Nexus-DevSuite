# Tutorial: Manejo de entregas entre desarrolladores — NEXUS DevSuite

**Objetivo:** Que todo el equipo suba entregas a GitHub de forma coordinada, sin perder trabajo ni generar conflictos evitables.

**Audiencia:** Todos los desarrolladores del proyecto (incluidos nuevos integrantes).

---

## 1. Principio fundamental

> **Antes de subir tu entrega, siempre sincroniza con lo que hay en GitHub.**

Si otro desarrollador ya subió cambios, tu copia local está desactualizada. Si intentas hacer `git push` sin antes integrar esos cambios, Git puede rechazarte o generar situaciones confusas. La regla de oro:

1. **Traer** los cambios remotos (`git fetch` + `git pull`)
2. **Integrar** tus cambios con los del equipo (merge)
3. **Subir** el resultado (`git push`)

---

## 2. Flujo recomendado antes de cada entrega

### Paso 1 — Guardar tu trabajo local

Asegúrate de tener todos tus cambios commiteados. Si tienes archivos modificados sin commit:

```powershell
git status
```

- Si ves "Changes not staged" o "Untracked files", añade y commitea:

```powershell
git add .
git commit -m "feat: descripción breve de tus cambios"
```

### Paso 2 — Traer cambios del remoto

```powershell
git fetch origin
```

Esto descarga los commits de GitHub **sin mezclarlos** todavía con tu rama local.

### Paso 3 — Ver si hay cambios nuevos

```powershell
git status
```

- **"Your branch is up to date with 'origin/master'"** → No hay nada nuevo en GitHub. Puedes hacer `git push` directamente.
- **"Your branch is behind 'origin/master' by X commit(s)"** → Hay cambios de otros. Continúa al Paso 4.

### Paso 4 — Integrar cambios remotos (merge)

```powershell
git pull origin master
```

Git fusionará los cambios de GitHub con tu rama local. En la mayoría de casos no habrá conflictos.

### Paso 5 — Resolver conflictos (si aparecen)

Si Git indica conflictos, verás algo como:

```
CONFLICT (content): Merge conflict in ruta/archivo.js
Automatic merge failed; fix conflicts and then commit the result.
```

**Qué hacer:**

1. Abre los archivos marcados como conflictivos.
2. Busca los marcadores `<<<<<<<`, `=======`, `>>>>>>>`.
3. Edita el archivo para dejar la versión correcta (puede ser combinar ambas).
4. Elimina los marcadores de conflicto.
5. Guarda y añade los archivos resueltos:

```powershell
git add ruta/archivo.js
git commit -m "merge: resolver conflictos con origin/master"
```

### Paso 6 — Subir tu entrega

```powershell
git push origin master
```

---

## 3. Checklist antes de cada push

| # | Verificación | Comando / Acción |
|---|--------------|------------------|
| 1 | ¿Tienes cambios sin commitear? | `git status` → si hay cambios, `git add` + `git commit` |
| 2 | ¿Estás al día con GitHub? | `git fetch origin` → `git status` |
| 3 | Si estás detrás, ¿integración hecha? | `git pull origin master` |
| 4 | ¿Conflictos resueltos? | Si hubo conflictos, editarlos y `git add` + `git commit` |
| 5 | ¿Reporte diario actualizado? | Crear/actualizar `docs/project-logs/daily-dev-report-YYYY-MM-DD.md` |
| 6 | ¿Tickets implementados registrados? | Actualizar `docs/project-logs/TICKETS_IMPLEMENTADOS.md` si aplica |
| 7 | ¿Documentación de endpoints actualizada? | Revisar `docs/ENDPOINTS_API_Y_USO_FRONTEND.md` si aplica |

**Referencias:**  
- `docs/project-logs/README.md` — Reportes diarios y trazabilidad  
- `docs/process/PROTOCOLO_IMPLEMENTACION_TICKETS.md` — Registro de tickets

---

## 4. Formato de commits

### Para entregas generales

```
feat: descripción breve de la funcionalidad
fix: descripción del bug corregido
chore: tarea de mantenimiento (ej. actualizar dependencias)
docs: cambios en documentación
```

### Para checklists y trazabilidad

```
[CHECKLIST] Autor: <nombre> | Archivo: <archivo> | Acción: <resumen>
```

### Para releases

```
chore(release): initialize project version v0.1.0
```

**Ejemplos:**

```
feat: filtro por estado en sprints y botón eliminar filtro
fix: mensaje de error en login visible 2 segundos
[CHECKLIST] Autor: Javier | Archivo: docs/CHECKLIST_ETAPAS_PROYECTO.md | Acción: Completadas tareas Etapa 14
```

---

## 5. Casos de uso frecuentes

### Caso A — Nuevo integrante se une al equipo

**Situación:** Un desarrollador nuevo clona el repo y empieza a trabajar. Otros ya tienen commits en GitHub.

**Qué hacer el nuevo integrante:**

1. Clonar el repositorio: `git clone https://github.com/MonkeyDevC/Nexus-DevSuite.git`
2. Entrar a la carpeta: `cd Nexus-DevSuite`
3. Antes de empezar a codear: `git pull origin master` (por si acaso)
4. Trabajar normalmente. Antes de su primera entrega, seguir el flujo de la Sección 2.

### Caso B — Varios desarrolladores trabajando en paralelo

**Situación:** Tú y un compañero trabajáis en archivos distintos. Él sube primero.

**Qué hacer tú:**

1. Antes de subir: `git fetch origin` → `git pull origin master`
2. Git fusionará los cambios. Si no tocasteis los mismos archivos, no habrá conflictos.
3. `git push origin master`

### Caso C — Modificasteis el mismo archivo

**Situación:** Tú y otro desarrollador modificasteis `public/js/views/dashboard.js`.

**Qué hacer:**

1. `git pull origin master` → Git indicará conflicto en ese archivo.
2. Abre `public/js/views/dashboard.js`.
3. Busca `<<<<<<<`, `=======`, `>>>>>>>`.
4. Decide qué código conservar o cómo combinar ambas versiones.
5. Elimina los marcadores, guarda.
6. `git add public/js/views/dashboard.js`
7. `git commit -m "merge: resolver conflicto en dashboard.js"`
8. `git push origin master`

**Consejo:** Comunicarse antes de tocar los mismos archivos reduce conflictos. Si dos personas trabajan en el mismo módulo, coordinar por chat o en el daily.

### Caso D — Tienes cambios locales y no quieres perderlos

**Situación:** Tienes cambios sin terminar pero necesitas traer lo de GitHub.

**Opción 1 — Commitear (recomendado):**

```powershell
git add .
git commit -m "WIP: trabajo en progreso - descripción"
git pull origin master
# Resolver conflictos si los hay
git push origin master
```

**Opción 2 — Stash (guardar temporalmente):**

```powershell
git stash
git pull origin master
git stash pop
# Resolver conflictos si los hay al hacer pop
git add .
git commit -m "feat: descripción"
git push origin master
```

---

## 6. Comandos de referencia rápida

| Acción | Comando |
|--------|---------|
| Ver estado | `git status` |
| Traer cambios remotos (sin mezclar) | `git fetch origin` |
| Traer y mezclar con tu rama | `git pull origin master` |
| Añadir archivos | `git add .` o `git add ruta/archivo` |
| Commitear | `git commit -m "mensaje"` |
| Subir a GitHub | `git push origin master` |
| Ver ramas | `git branch -a` |
| Ver últimos commits | `git log --oneline -5` |

---

## 7. Documentos relacionados

| Documento | Contenido |
|-----------|-----------|
| `docs/GUIA_SUBIDA_ENTREGA_GITHUB.md` | Guía paso a paso para subir a master |
| `docs/project-logs/README.md` | Reportes diarios, checklist-change-log, TICKETS_IMPLEMENTADOS |
| `docs/process/PROTOCOLO_IMPLEMENTACION_TICKETS.md` | Ciclo de vida de tickets y trazabilidad |
| `docs/process/WORKFLOW_DESARROLLO_AUDITORIA.md` | Flujo PO → Auditoría → Implementación → QA |

---

## 8. Resumen en una frase

> **Antes de cada push: `git fetch` → `git pull origin master` → resolver conflictos si los hay → `git push origin master`.**

Siguiendo este flujo, el equipo mantiene el repositorio sincronizado y se evitan pérdidas de trabajo y conflictos innecesarios.
