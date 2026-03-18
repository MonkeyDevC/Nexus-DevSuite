# Tutorial: Cómo usar el Delivery Workspace para subir una entrega

Esta guía explica **paso a paso** cómo usar el **Delivery Workspace** de Nexus DevSuite para subir una entrega de código: añadir archivos, revisar cambios y hacer **Commit & Push** (y opcionalmente crear el Pull Request) sin usar Git en tu máquina.

---

## ¿Qué es el Delivery Workspace?

Es la pantalla donde gestionas **una entrega de código concreta**: ves los archivos que forman parte de la entrega, los subes o los detectas desde Git en el servidor, revisas el diff, generas el mensaje de commit con IA y haces **Commit & Push** (y crear PR) desde la propia aplicación.

---

## Requisitos previos

Antes de abrir el Workspace necesitas:

1. **Proyecto** creado en Nexus.
2. **Conexión GitHub** del proyecto configurada (para ramas, commit y PR).
3. **Una entrega de código (Code Delivery)** ya creada.  
   La entrega se crea desde **Órdenes de trabajo** → detalle de la orden → **Tasks** → **Crear entrega** (título, task, tipo).  
   Si aún no tienes una entrega, sigue la sección *6b* de la [Guía de proyecto y entrega](GUIA_PROYECTO_ENTREGA.md) (User Story → Orden de trabajo → Task → Crear entrega).

---

## Paso 1: Abrir el Delivery Workspace

1. En el menú lateral, entra en **Proyectos** y abre tu proyecto.
2. Ve a **Repository** del proyecto (enlace o URL con hash).
3. En la tabla **Entregas de código** verás todas las entregas del proyecto.
4. En la fila de la entrega que quieras subir, haz clic en **Workspace** (o el enlace que abre el workspace de esa entrega).

**URLs que usarás:**

```text
# Ir a Repository del proyecto (sustituye PROJECT_ID por el ID del proyecto)
#/projects/PROJECT_ID/repository

# Abrir el Delivery Workspace de una entrega (sustituye PROJECT_ID y DELIVERY_ID)
#/projects/PROJECT_ID/deliveries/DELIVERY_ID/workspace
```

Ejemplo con IDs reales (los verás en la barra de direcciones al navegar):

```text
#/projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/repository
#/projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/deliveries/f9e8d7c6-b5a4-3210-9876-543210fedcba/workspace
```

Se abrirá la vista **Delivery Workspace**. En la parte superior verás el **título de la entrega**, la **rama** (si ya está creada) y un **badge de estado** (DRAFT, READY, LOCKED, COMMITTED, etc.).

---

## Paso 2: Crear la rama en GitHub (si aún no existe)

Para poder hacer Commit & Push, la entrega debe tener una **rama** en el repositorio.

- Si en el Workspace ves **rama: —** o un aviso de que crees la rama:
  1. Vuelve a **Repository** usando la URL (sustituye `PROJECT_ID` por el ID de tu proyecto):
  2. En la fila de tu entrega, pulsa **Crear rama**.
  3. Nexus creará la rama en GitHub (por ejemplo `feature/TASK-1-mi-entrega`).
  4. Regresa al **Delivery Workspace** y recarga si hace falta; ya debería mostrarse el nombre de la rama.

**Navegación directa (si ya conoces el ID del proyecto):**

```text
# En el navegador, ve a (sustituye PROJECT_ID):
#/projects/PROJECT_ID/repository
```

No hay comando de terminal para este paso; la rama se crea desde la interfaz con **Crear rama**.

---

## Paso 3: Añadir archivos a la entrega

Tienes **dos formas** de incluir archivos en la entrega.

### Opción A: Detectar desde Git (recomendado si el servidor tiene tu repo)

El servidor de Nexus puede ejecutar `git status` y `git diff` en el repositorio del proyecto y detectar los archivos modificados/nuevos/eliminados.

1. En el Workspace, en la tarjeta **Subir entrega (Git como fuente de verdad)**:
   - Elige **Incluir working directory** o **Solo staged**, según quieras incluir todos los cambios o solo los ya preparados con `git add`.
   - (Opcional) Si quieres validar que el servidor esté alineado con tu entorno, obtén el hash HEAD en tu máquina y pégalo en **HEAD local** en el Workspace:
2. Pulsa **Detectar archivos**.  
   Se listarán los archivos que Git considera cambiados (igual que en tu entorno si el servidor está sincronizado).
3. Si la lista es correcta, pulsa **Subir entrega desde Git**.  
   Los archivos y su contenido se añadirán a la entrega en Nexus.

**Comandos útiles en tu máquina (para comparar con el servidor):**

```bash
# Hash del commit actual (pegarlo en "HEAD local" en el Workspace)
git rev-parse HEAD

# Ver archivos modificados (working directory + staged)
git status --short

# Solo archivos ya preparados para commit (si eliges "Solo staged")
git diff --cached --name-only
```

Tras esto, en la tarjeta **Files** verás la lista de archivos con su estado (ADDED, MODIFIED, DELETED, etc.).

### Opción B: Método manual (git status + carpeta o archivo a mano)

Si no usas la detección desde Git en el servidor:

1. En tu máquina, en la **raíz del proyecto**, ejecuta en la terminal:

```bash
# Desde la raíz del repositorio (ej. C:\Users\tu\proyecto o ~/proyecto)
cd "C:\Users\santy\OneDrive\Escritorio\NEXUS DevSuite"

# Opción 1: salida larga (copia todo lo que imprima)
git status

# Opción 2: salida corta (más fácil de pegar)
git status --short
```

2. Copia **toda** la salida (ejemplo típico de `git status --short`):

```text
 M docs/GUIA_PROYECTO_ENTREGA.md
 M src/index.js
?? src/nuevo-modulo.js
D  src/viejo.js
```

3. En el Workspace, abre el acordeón **Método manual**.
4. En **Paso 1 — Salida de git status**, pega la salida y pulsa **Extraer archivos modificados**.  
   Aparecerá la lista de rutas (archivos y carpetas) que Git considera modificados.
5. En **Paso 2 — Carpeta del proyecto**, selecciona la **carpeta raíz** de tu proyecto (la misma que en Cursor).  
   Solo se tendrán en cuenta los archivos que coincidan con la lista del Paso 1.
6. Si las rutas incluyen un prefijo que no quieres en el repo, rellena **Prefijo a quitar de rutas**:

```text
# Ejemplo: si las rutas salen como "NEXUS DevSuite/src/index.js"
# y quieres que en GitHub sea "src/index.js", escribe:
NEXUS DevSuite/
```

7. Marca los archivos que quieras subir (**Seleccionar todos** si los quieres todos) y pulsa **Subir seleccionados a la entrega**.

**Añadir un archivo a mano:** en la sección correspondiente del Workspace indica **ruta** y **contenido**:

```text
Ruta:    src/utils/helper.js
Contenido: (pega o escribe el contenido del archivo)
```

Luego pulsa **Añadir archivo**.

---

## Paso 4: Revisar archivos y staging (qué va en el commit)

En la tarjeta **Files**:

- Verás cada archivo con un **checkbox**.  
  Por defecto todos van marcados; puedes **desmarcar** los que no quieras incluir en el próximo commit.
- Botones **Todos** y **Ninguno** sirven para marcar o desmarcar todos.
- Puedes hacer clic en un archivo para ver el **diff** (cambios respecto a la base) en el visor de la derecha.
- Si la entrega está **LOCKED**, no podrás modificar archivos ni sincronizar desde Git; solo podrás hacer commit con lo ya incluido.

Solo los archivos **marcados** se incluirán en el siguiente **Commit & Push**.

**Comprobación en tu máquina (opcional):** para ver qué archivos tienes modificados y comparar con la lista del Workspace:

```bash
# Listar archivos con cambios (staged + unstaged)
git status --short

# Ver diff de un archivo concreto
git diff -- path/to/file.js
```

---

## Paso 5: Estado de la entrega (READY / LOCKED para commit)

Para poder hacer **Commit & Push**, la entrega debe estar en estado **READY** o **LOCKED**.

- Si el badge de estado es **DRAFT** o **PREPARING**, en la tarjeta **Commit & Push** verás un aviso: *Solo puedes hacer commit cuando la entrega esté en estado READY o LOCKED*.
- Cambia el estado de la entrega a **READY** (o **LOCKED** si quieres bloquear más cambios).  
  Eso suele hacerse desde el detalle de la entrega o desde la orden de trabajo / tarea, según cómo esté implementado en tu versión de Nexus.

Cuando el estado sea **READY** o **LOCKED**, los botones **Vista previa** y **Commit & Push** se habilitarán (si además la entrega tiene rama).

**Dónde cambiar el estado:** desde la interfaz de Nexus (no hay comando de terminal). Navega a la orden de trabajo o al detalle de la entrega y usa el selector **Cambiar estado** → **READY** o **LOCKED**.

---

## Paso 6: Mensaje de commit y vista previa

1. En la tarjeta **Commit & Push** verás un cuadro **Mensaje de commit**.
2. (Opcional) Pulsa **Generar con IA** para que Nexus proponga un mensaje en formato convencional (por ejemplo `feat(scope): descripción`) según los archivos y el tipo de entrega.  
   Puedes editarlo después.
3. Marca o desmarca **Crear Pull Request después del push**, según quieras que tras el push se cree el PR en GitHub.
4. Pulsa **Vista previa** (o **Commit & Push** directamente).  
   - Si pulsas **Vista previa**, se abrirá un modal con:
     - Archivos que se incluirán.
     - Resumen de impacto (cantidad de archivos, líneas añadidas/eliminadas).
     - Mensaje que se usará.
     - Si el código ha cambiado respecto al snapshot de la entrega, verás un aviso y no podrás confirmar hasta sincronizar o revertir.
   - Si todo está bien, en el modal pulsa **Confirmar commit y push**.

Si no hay vista previa y pulsas **Commit & Push** directamente, Nexus hará una validación previa (incluido un “dry run”) y, si todo es correcto, ejecutará el commit y el push; si has marcado **Crear PR**, después creará el Pull Request.

**Ejemplos de mensaje de commit (Conventional Commits):**

```text
feat(release): add release planning and GitHub sync
fix(api): correct status code on validation error
docs: update delivery workspace tutorial
chore(deps): update dependency x to v2
```

---

## Paso 7: Commit & Push

1. Tras confirmar (en el modal de vista previa o en el flujo directo), Nexus:
   - Hará **commit** en la rama de la entrega con los archivos seleccionados y el mensaje indicado.
   - Hará **push** a `origin` de esa rama.
   - Si marcaste **Crear Pull Request después del push**, creará el PR en GitHub y te mostrará el enlace.
2. Verás un mensaje de éxito con el **hash del commit** (y el enlace al PR si se creó).
3. La lista **Último commit** en el Workspace se actualizará y el estado de la entrega puede pasar a **COMMITTED** o **PR_CREATED**.

**Comprobar en tu máquina que el commit llegó a GitHub:**

```bash
# Actualizar referencias remotas
git fetch origin

# Ver los últimos commits de la rama de la entrega (sustituye RAMA por ej. feature/TASK-1-mi-entrega)
git log origin/RAMA -3 --oneline

# Ver el detalle del último commit
git log origin/RAMA -1
```

**Comprobar en el navegador:** abre el repositorio en GitHub → rama de la entrega → pestaña **Commits**, o el **Pull Request** si lo creaste.

---

## Paso 8: Opcionales en el Workspace

### Diff Viewer

- En **Files**, haz clic en **Diff** para abrir el visor de diferencias.
- Selecciona un archivo de la lista para ver el diff línea a línea (verde = añadido, rojo = eliminado).

### AI Code Review

- En la tarjeta **AI Code Review**, pulsa **Run AI Review**.
- Revisa el resumen, issues, advertencias de seguridad y mejoras.  
  Si el riesgo es alto, Nexus te avisará; no bloquea el commit, pero es recomendable revisar antes de crear el PR.

### Code Review (aprobaciones)

- En la tarjeta **Code Review** verás las revisiones de la entrega (Aprobado / Cambios solicitados).
- Puedes usar **Aprobar** o **Solicitar cambios** para tu revisión.
- El indicador **Listo para merge** depende de que haya al menos una aprobación y no haya cambios solicitados.

### Release notes con IA

- En **Release notes (IA)** elige en el desplegable la **entrega base** con la que quieres comparar.
- Pulsa **Generar release notes**.  
  Nexus comparará las dos entregas y generará un resumen (features, fixes) con IA.

---

## Resumen rápido: subir una entrega

| Paso | Dónde | Comando / acción |
|------|--------|------------------|
| 1 | Navegador | `#/projects/PROJECT_ID/repository` → clic **Workspace** en la entrega |
| 2 | Repository | Clic **Crear rama** (no hay comando; solo UI) |
| 3 | Workspace | **Opción A:** Detectar archivos → Subir desde Git. **Opción B:** en terminal `git status --short` → copiar → pegar en Método manual → Extraer → elegir carpeta → Subir seleccionados |
| 4 | Workspace → Files | Marcar/desmarcar checkboxes (opcional en terminal: `git status --short`, `git diff -- path/to/file`) |
| 5 | Orden de trabajo / Entrega | En la UI: **Cambiar estado** → READY o LOCKED |
| 6 | Commit & Push | Mensaje (ej. `feat(scope): descripción`) → **Vista previa** → **Confirmar commit y push** |
| 7 | Terminal / GitHub | `git fetch origin` y `git log origin/RAMA -3` para verificar; o abrir la rama/PR en GitHub |

**Comandos de terminal que usarás en el flujo:**

```bash
# Paso 3 (método manual): obtener lista de archivos modificados
cd /ruta/al/proyecto
git status --short

# Paso 3 (opción A): hash para "HEAD local" (opcional)
git rev-parse HEAD

# Paso 7: verificar que el push llegó a GitHub
git fetch origin
git log origin/NOMBRE_RAMA -3 --oneline
```

Con esto puedes **subir una entrega** desde el dashboard (Delivery Workspace) de principio a fin: añadir archivos, revisar, hacer commit, push y crear el PR sin usar Git en tu máquina.
