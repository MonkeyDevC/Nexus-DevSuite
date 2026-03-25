/**
 * Documentación funcional — Guía profesional operativa (nivel SaaS).
 * Paso a paso, comandos reales, validaciones, errores y troubleshooting.
 */
(function () {
  "use strict";

  var h2 = "<h2 class=\"h5 mt-4 mb-2 nexus-font-semibold\">";
  var h3 = "<h3 class=\"h6 mt-3 mb-1 nexus-font-semibold\">";
  var end = "</h2>";
  var end3 = "</h3>";
  var p = "<p class=\"mb-2\">";
  var ul = "<ul class=\"mb-2\">";
  var li = "<li>";
  var ol = "<ol class=\"mb-2\">";
  var table = "<table class=\"table table-sm nexus-table mb-3\"><thead><tr><th>";
  var td = "</th><th>";
  var tr = "</th></tr></thead><tbody><tr><td>";
  var tde = "</td><td>";
  var tre = "</td></tr></tbody></table>";
  var trr = "</td></tr><tr><td>";
  var pre = "<pre class=\"bg-light border rounded p-2 small mb-2\"><code class=\"d-block text-break\">";
  var prec = "</code></pre>";
  var step = "<p class=\"mb-1\"><strong class=\"text-nexus-primary\">";

  window.DocumentationFunctionalContent =
    '<div class="nexus-doc-body">' +

    /* ========== 1. INTRODUCCIÓN (MEJORADA) ========== */
    h2 + "1. Introducción" + end +
    h3 + "Qué es Nexus DevSuite" + end3 +
    p + "Nexus DevSuite es una plataforma de gestión de proyectos y entregas de código que une planificación de versiones (releases), backlog SCRUM (features, user stories, sprints), órdenes de trabajo (work orders) y un flujo Git completo: commit, push y Pull Request desde la aplicación, con trazabilidad entre planificación y repositorio." + "</p>" +
    h3 + "Qué problema resuelve" + end3 +
    ul +
    li + "Trazabilidad: vincular releases, features, stories, work orders y entregas de código con ramas, commits y PRs en GitHub." + "</li>" +
    li + "Un solo lugar para planificar, desarrollar y entregar sin cambiar de herramienta para el flujo básico de commit/PR." + "</li>" +
    li + "Validaciones: snapshot de la entrega, detección de drift (cambios externos), dry run antes de commit, estados (DRAFT, READY, LOCKED) para controlar qué se puede editar o commitear." + "</li>" +
    "</ul>" +
    h3 + "Casos de uso reales" + end3 +
    ul +
    li + "Equipo que planifica releases por features y quiere que cada entrega de código quede ligada a una task y a una rama/PR." + "</li>" +
    li + "Desarrollador que sube cambios desde Nexus (sync desde Git o método manual) y hace commit y PR sin usar la consola local." + "</li>" +
    li + "Lead que revisa el estado de entregas (COMMITTED, PR_CREATED, MERGED) y genera release notes comparando entregas con IA." + "</li>" +
    "</ul>" +
    h3 + "Cuándo usarlo y cuándo no" + end3 +
    p + "<strong>Usar Nexus DevSuite</strong> cuando quieras planificación de releases + backlog SCRUM + flujo de entregas trazado a Git/PR en una sola app. <strong>No usarlo</strong> como sustituto de Git en tu máquina para trabajo local diario (branching, merge, rebase); úsalo como orquestador de entregas y PRs a partir del código que ya tienes en el servidor o que subes manualmente." + "</p>" +

    /* ========== 2. SETUP DESDE CERO (PROYECTO → RELEASE → STORY → WO) ========== */
    h2 + "2. Setup desde cero (proyecto → release → story → work order)" + end +
    p + "Si ya tienes un proyecto con release/backlog y solo quieres entregar código, salta al Quick Start. Si estás empezando desde cero, usa este setup. (Referencia extendida: <code>docs/GUIA_PROYECTO_ENTREGA.md</code>.)" + "</p>" +
    h3 + "2.1 Crear el proyecto" + end3 +
    ul +
    li + "<strong>UI:</strong> Menú → Proyectos → Crear proyecto → guardar." + "</li>" +
    li + "<strong>Qué debes ver:</strong> El proyecto aparece en la lista y tiene un ID (UUID)." + "</li>" +
    li + "<strong>URL útil:</strong> <code>#/projects</code>." + "</li>" +
    "</ul>" +
    h3 + "2.2 Crear Features" + end3 +
    ul +
    li + "<strong>UI:</strong> Features → Crear → asociar al proyecto (si aplica)." + "</li>" +
    li + "<strong>Qué debes ver:</strong> Al menos una feature representando el alcance de la release (ej. “Entrega v0.1.0”)." + "</li>" +
    "</ul>" +
    h3 + "2.3 Crear la Release y asociar Features (Release Planning)" + end3 +
    ul +
    li + "<strong>UI:</strong> Proyecto → Release Planning → Create Release → versión (ej. <code>v0.1.0</code>) → Crear." + "</li>" +
    li + "<strong>UI:</strong> En el detalle de la release: Add features desde <em>Available Features</em> a <em>Planned Features</em>." + "</li>" +
    li + "<strong>Qué debes ver:</strong> La release queda en estado PLANNING y el resumen técnico se actualiza (aunque Work Orders/Deliveries aún puede estar en 0)." + "</li>" +
    li + "<strong>URL útil:</strong> <code>#/projects/&lt;projectId&gt;/releases</code>." + "</li>" +
    "</ul>" +
    h3 + "2.4 Crear User Story, Work Order y Task (cadena SCRUM → entrega)" + end3 +
    ul +
    li + "<strong>UI:</strong> Product Backlog → crear User Story asociada a una Feature que esté en la release." + "</li>" +
    li + "<strong>UI:</strong> En Backlog → Órdenes de trabajo → Crear work order para esa story." + "</li>" +
    li + "<strong>UI:</strong> En el detalle de la work order → Tasks → Add Task (mínimo 1) — sin Task no podrás crear una entrega." + "</li>" +
    li + "<strong>Qué debes ver:</strong> WO creada con al menos una Task en estado PENDING/IN_PROGRESS." + "</li>" +
    li + "<strong>URL útil:</strong> <code>#/projects/&lt;projectId&gt;/work-orders</code>." + "</li>" +
    "</ul>" +

    /* ========== 2. QUICK START ========== */
    h2 + "3. Quick Start — Primera entrega en menos de 10 pasos" + end +
    p + "Flujo mínimo para crear una entrega, subir archivos, hacer commit y crear PR." + "</p>" +
    step + "Paso 1:</strong> Si aún no tienes proyecto/release/story/WO, haz el “Setup desde cero” (sección 2). Si ya existe, abre tu proyecto → Órdenes de trabajo.</p>" +
    step + "Paso 2:</strong> Crear orden de trabajo (asocia User Story). En el detalle, añade una Task (Add Task).</p>" +
    step + "Paso 3:</strong> En <strong>Entregas de código</strong> → <strong>Crear entrega</strong>. Task, título, tipo (Feature/Bugfix). Guardar.</p>" +
    step + "Paso 4:</strong> Ir a <strong>Repository</strong> del proyecto. En la fila de tu entrega → <strong>Crear rama</strong>.</p>" +
    step + "Paso 5:</strong> En la misma tabla → <strong>Workspace</strong> (abre el Delivery Workspace).</p>" +
    step + "Paso 6:</strong> En &quot;Subir entrega (Git como fuente de verdad)&quot; → <strong>Detectar archivos</strong> → <strong>Subir entrega desde Git</strong>. (O método manual: pegar <code>git status --short</code>, Extraer archivos, elegir carpeta, Subir seleccionados.)</p>" +
    step + "Paso 7:</strong> En la tarjeta <strong>Files</strong>, deja marcados los archivos que quieras en el commit. Cambia el estado de la entrega a <strong>READY</strong> (o LOCKED) si aún no lo está.</p>" +
    step + "Paso 8:</strong> En <strong>Commit &amp; Push</strong>: escribe mensaje (o <strong>Generar con IA</strong>), marca <strong>Crear Pull Request después del push</strong> si quieres PR.</p>" +
    step + "Paso 9:</strong> <strong>Vista previa</strong> → revisar lista y mensaje → <strong>Confirmar commit y push</strong>.</p>" +
    step + "Paso 10:</strong> Tras el push, si creaste PR abre el enlace en GitHub para revisión y merge.</p>" +
    p + "Referencia operativa extendida del Workspace: <code>docs/TUTORIAL_DELIVERY_WORKSPACE.md</code>." + "</p>" +

    /* ========== 3. WORKFLOW COMPLETO (PASO A PASO) ========== */
    h2 + "4. Workflow completo (paso a paso — súper operativo)" + end +
    p + "Este flujo asume que ya existe el proyecto y la work order (si no, empieza en la sección 2). Aquí te digo exactamente qué verás en cada pantalla, qué hacer primero y qué comandos (PowerShell) ejecutar antes cuando aplique." + "</p>" +

    h3 + "PASO 0 — Antes de tocar Nexus (PowerShell)" + end3 +
    p + "Si vas a usar <strong>Método manual</strong> o quieres comparar lo que ves en Nexus vs tu repo local, abre PowerShell en la raíz del proyecto y ejecuta:" + "</p>" +
    pre + "cd \"C:\\\\ruta\\\\a\\\\tu\\\\repo\"\n\n# Ver cambios (recomendado para copiar/pegar en Nexus si usas método manual)\ngit status --short\n\n# (Opcional) hash del commit actual (útil para comparar con el servidor)\ngit rev-parse HEAD\n\n# (Opcional) ver cambios por archivo\ngit diff" + prec +
    p + "<strong>Qué debes obtener:</strong> una lista tipo <code>M src/...</code>, <code>?? src/...</code>, <code>D src/...</code>. Esa lista es la que pegarás en el Workspace si usas Método manual." + "</p>" +

    h3 + "PASO 1 — Ir a Work Orders (y ubicar la WO correcta)" + end3 +
    ul +
    li + "<strong>Acción (UI):</strong> Menú → Product Backlog (o Proyecto → Backlog) → Órdenes de trabajo." + "</li>" +
    li + "<strong>Qué verás:</strong> una tabla/listado de Work Orders con acciones típicas (View/Detalle)." + "</li>" +
    li + "<strong>Primero haz:</strong> abre (View) la WO que corresponde a la User Story que acabas de terminar." + "</li>" +
    li + "<strong>Resultado esperado:</strong> estás en el detalle de la WO y ves secciones de Tasks y Entregas de código." + "</li>" +
    "</ul>" +

    h3 + "PASO 2 — Crear Task (si no existe) y luego Crear entrega" + end3 +
    ul +
    li + "<strong>Acción (UI):</strong> En el detalle de la WO, sección <strong>Tasks</strong> → <strong>Add Task</strong> (crea al menos 1)." + "</li>" +
    li + "<strong>Qué verás:</strong> la task aparece en la lista con estado PENDING/IN_PROGRESS." + "</li>" +
    li + "<strong>Acción (UI):</strong> Sección <strong>Entregas de código</strong> → <strong>Crear entrega</strong>." + "</li>" +
    li + "<strong>Formulario:</strong> selecciona la <strong>Task</strong>, define <strong>Título</strong> y <strong>Tipo</strong> (FEATURE/BUGFIX/etc.) → Guardar." + "</li>" +
    li + "<strong>Resultado esperado:</strong> la entrega aparece en la tabla de Entregas de código dentro de la WO, con un ID y estado inicial (DRAFT/PREPARING)." + "</li>" +
    "</ul>" +

    h3 + "PASO 3 — Ir a Repository del proyecto (crear rama y abrir Workspace)" + end3 +
    ul +
    li + "<strong>Acción (UI):</strong> Abre <strong>Repository</strong> del proyecto. (URL: <code>#/projects/&lt;projectId&gt;/repository</code>)." + "</li>" +
    li + "<strong>Qué verás:</strong> una tabla <strong>Entregas de código</strong> con columnas típicas: Entrega, Tipo, Rama, Estado, PR, Acciones." + "</li>" +
    li + "<strong>Primero haz:</strong> en la fila de tu entrega, pulsa <strong>Crear rama</strong> si la columna Rama está vacía." + "</li>" +
    li + "<strong>Resultado esperado:</strong> la columna Rama ahora muestra algo como <code>feature/TASK-…</code>." + "</li>" +
    li + "<strong>Después:</strong> en esa misma fila, pulsa <strong>Workspace</strong> para abrir el Delivery Workspace." + "</li>" +
    "</ul>" +

    h3 + "PASO 4 — Delivery Workspace: confirmar contexto (arriba de la pantalla)" + end3 +
    ul +
    li + "<strong>Qué verás:</strong> título de la entrega, proyecto, y datos clave como <strong>Rama</strong> y <strong>Estado</strong> (badge)." + "</li>" +
    li + "<strong>Chequeo rápido:</strong> si no hay Rama, vuelve a Repository y crea la rama. Si el estado es DRAFT/PREPARING, más adelante deberás pasarlo a READY/LOCKED antes de commit." + "</li>" +
    "</ul>" +

    h3 + "PASO 5 — Subir archivos (elige un flujo)" + end3 +
    p + "<strong>Flujo recomendado:</strong> Git como fuente de verdad (si el servidor tiene el repo disponible). <strong>Flujo alterno:</strong> Método manual (si tu repo está solo en tu PC o el servidor no puede leer Git local)." + "</p>" +
    h3 + "5A — Subir desde Git (Git como fuente de verdad)" + end3 +
    ul +
    li + "<strong>Acción (UI):</strong> En la tarjeta &quot;Subir entrega (Git como fuente de verdad)&quot;, selecciona <strong>Incluir working directory</strong> (o <strong>Solo staged</strong> si quieres estrictamente staged)." + "</li>" +
    li + "<strong>Acción (UI):</strong> pulsa <strong>Detectar archivos</strong>." + "</li>" +
    li + "<strong>Qué verás:</strong> una lista de archivos detectados (con estados ADDED/MODIFIED/DELETED/etc.)." + "</li>" +
    li + "<strong>Acción (UI):</strong> pulsa <strong>Subir entrega desde Git</strong>." + "</li>" +
    li + "<strong>Resultado esperado:</strong> la tarjeta <strong>Files</strong> se llena con los archivos de la entrega." + "</li>" +
    "</ul>" +
    h3 + "5B — Método manual (PowerShell + selección de carpeta)" + end3 +
    ul +
    li + "<strong>Primero (PowerShell):</strong> copia la salida de <code>git status --short</code> (del PASO 0)." + "</li>" +
    li + "<strong>Acción (UI):</strong> abre el acordeón <strong>Método manual</strong> → pega en “Salida de git status” → pulsa <strong>Extraer archivos modificados</strong>." + "</li>" +
    li + "<strong>Qué verás:</strong> lista de rutas detectadas a partir del status." + "</li>" +
    li + "<strong>Acción (UI):</strong> selecciona la <strong>Carpeta del proyecto</strong> (raíz del repo en tu PC)." + "</li>" +
    li + "<strong>Importante:</strong> si las rutas salen con prefijo (ej. <code>NEXUS DevSuite/src/index.js</code>), rellena “Prefijo a quitar” con <code>NEXUS DevSuite/</code>." + "</li>" +
    li + "<strong>Acción (UI):</strong> marca archivos → <strong>Subir seleccionados a la entrega</strong>." + "</li>" +
    li + "<strong>Resultado esperado:</strong> la tarjeta <strong>Files</strong> se llena con los archivos de la entrega." + "</li>" +
    "</ul>" +

    h3 + "PASO 6 — Files: revisar, desmarcar lo que NO va al commit" + end3 +
    ul +
    li + "<strong>Qué verás:</strong> lista de archivos con checkbox y estado. Botones &quot;Todos&quot; / &quot;Ninguno&quot;." + "</li>" +
    li + "<strong>Acción:</strong> desmarca archivos que no quieres incluir en este commit (por ejemplo docs o cambios accidentales)." + "</li>" +
    li + "<strong>Acción opcional:</strong> abre el <strong>Diff Viewer</strong> y revisa el diff de archivos sensibles." + "</li>" +
    li + "<strong>Resultado esperado:</strong> queda marcado exactamente lo que irá al commit." + "</li>" +
    "</ul>" +

    h3 + "PASO 7 — Cambiar estado a READY o LOCKED (requisito para commit)" + end3 +
    ul +
    li + "<strong>Qué verás si falta:</strong> en Commit &amp; Push aparecerá aviso de que solo se puede commitear en READY/LOCKED." + "</li>" +
    li + "<strong>Acción (UI):</strong> desde el detalle de la entrega o desde la WO (según tu build), usa <strong>Cambiar estado</strong> → <strong>READY</strong> o <strong>LOCKED</strong>." + "</li>" +
    li + "<strong>Guía:</strong> usa READY si aún puedes necesitar ajustar archivos; usa LOCKED si ya está final y quieres congelar (pero recuerda: LOCKED bloquea editar/sync y puede disparar DELIVERY_LOCKED si intentas cambiar algo)." + "</li>" +
    li + "<strong>Resultado esperado:</strong> botones Vista previa / Commit &amp; Push quedan operativos." + "</li>" +
    "</ul>" +

    h3 + "PASO 8 — Commit & Push: vista previa, validaciones y confirmación" + end3 +
    ul +
    li + "<strong>Acción (UI):</strong> escribe el mensaje o pulsa <strong>Generar con IA</strong>." + "</li>" +
    li + "<strong>Acción (UI):</strong> marca <strong>Crear Pull Request después del push</strong> si quieres PR automático." + "</li>" +
    li + "<strong>Acción (UI):</strong> pulsa <strong>Vista previa</strong>." + "</li>" +
    li + "<strong>Qué verás:</strong> modal con lista final, resumen (+/- líneas) y validaciones. Si hay <strong>SNAPSHOT_DRIFT</strong>, el modal te impedirá confirmar." + "</li>" +
    li + "<strong>Acción (UI):</strong> si todo está OK, pulsa <strong>Confirmar commit y push</strong>." + "</li>" +
    li + "<strong>Resultado esperado:</strong> éxito con hash del commit; estado pasa a COMMITTED o PR_CREATED; si hay PR, verás enlace." + "</li>" +
    "</ul>" +

    h3 + "PASO 9 — Verificación final (qué comprobar para decir “listo”)" + end3 +
    ul +
    li + "<strong>En Nexus:</strong> la entrega muestra commit_hash y estado COMMITTED/PR_CREATED." + "</li>" +
    li + "<strong>En GitHub:</strong> la rama tiene el commit; si se creó PR, el PR está abierto." + "</li>" +
    li + "<strong>En PowerShell (opcional):</strong> verifica que el PR/branch contiene el commit esperado:" + "</li>" +
    "</ul>" +
    pre + "git fetch origin\n# Sustituye RAMA por el nombre real (ej. feature/TASK-1-mi-entrega)\ngit log origin/RAMA -3 --oneline" + prec +
    ul +
    li + "Si esto no coincide, revisa si subiste archivos por el método correcto o si hubo drift/errores durante el commit." + "</li>" +
    "</ul>" +

    /* ========== 4. GESTIÓN DE ARCHIVOS (PROFESIONAL) ========== */
    h2 + "5. Gestión de archivos" + end +
    h3 + "A. Desde Git (recomendado)" + end3 +
    p + "El servidor ejecuta Git en el repositorio del proyecto. Comandos que Nexus usa internamente (o que tú puedes usar para comparar):" + "</p>" +
    pre + "git status --porcelain=v2" + prec +
    p + "Salida en formato v2: una línea por archivo con estado (XY), path, y para renames/copies path origen y destino. Nexus parsea esto con <code>parsePorcelainV2</code> y obtiene ADDED, MODIFIED, DELETED, RENAMED, COPIED, UNTRACKED." + "</p>" +
    pre + "git add .\ngit diff --cached --name-status" + prec +
    p + "Si eliges <strong>Solo staged</strong>, Nexus usa el diff en staging para saber qué archivos incluir. <code>git add .</code> prepara todos los cambios; <code>git diff --cached --name-status</code> lista los preparados." + "</p>" +
    pre + "git diff -- path/to/file.js" + prec +
    p + "Para ver el diff de un archivo concreto; Nexus usa el diff para rellenar el contenido que sube y para el visor de diferencias en el Workspace." + "</p>" +
    p + "<strong>En la UI:</strong> Tarjeta &quot;Subir entrega (Git como fuente de verdad)&quot; → Incluir working directory o Solo staged → <strong>Detectar archivos</strong> → <strong>Subir entrega desde Git</strong>. El backend construye un mapa unificado por path y sube contenido." + "</p>" +

    /* ========== 5.X REQUISITO REAL: CLON DE GIT EN EL SERVIDOR ========== */
    h3 + "A0. Requisito real: el clon Git del servidor" + end3 +
    p + "<strong>Clave:</strong> cuando usas “Detectar archivos” / “Subir entrega desde Git”, Nexus <strong>no</strong> lee tu repo local de Cursor. Lee el estado del repo que el <strong>backend</strong> tiene clonado en el <strong>servidor</strong>." + "</p>" +
    ul +
    li + "<strong>Variable:</strong> configura <code>NEXUS_REPOS_BASE_PATH</code> en <code>.env</code>." + "</li>" +
    li + "<strong>Ruta esperada:</strong> para cada <code>projectId</code>, debe existir <code>NEXUS_REPOS_BASE_PATH/&lt;projectId&gt;</code> y dentro debe haber un <code>.git</code>." + "</li>" +
    li + "<strong>Ejemplo:</strong> si tu <code>projectId</code> es <code>e945781e-27a1-46f2-95b3-be0e8848fb03</code>, Nexus busca <code>&lt;NEXUS_REPOS_BASE_PATH&gt;/e945781e-27a1-46f2-95b3-be0e8848fb03/.git</code>." + "</li>" +
    li + "<strong>Tras editar .env:</strong> reinicia el backend para que la configuración se aplique." + "</li>" +
    "</ul>" +

    h3 + "A0.1 Desarrollo local (Windows): junction para que apunte al repo real" + end3 +
    p + "<strong>Cómo funciona en local:</strong> si el repo real está en tu workspace de Cursor, puedes crear un <strong>junction</strong> para que el backend lo vea como si estuviera bajo <code>NEXUS_REPOS_BASE_PATH</code>." + "</p>" +
    pre + "# 1) En Nexus DevSuite (.env)\nNEXUS_REPOS_BASE_PATH=C:\\\\nexus-repos\n\n# 2) Crea la carpeta base\nmkdir C:\\\\nexus-repos\n\n# 3) Enlaza el projectId esperado al repo real (ejemplo)\ncmd /c mklink /J \"C:\\\\nexus-repos\\\\&lt;projectId&gt;\" \"C:\\\\ruta\\\\a\\\\tu\\\\repo\"\n\n# 4) Reinicia el backend" + prec +

    h3 + "A0.2 Troubleshooting: “Detectar archivos” no detecta nada" + end3 +
    ul +
    li + "Revisa que <code>NEXUS_REPOS_BASE_PATH</code> <strong>no esté vacío</strong> y que exista la carpeta <code>NEXUS_REPOS_BASE_PATH/&lt;projectId&gt;</code>." + "</li>" +
    li + "Confirma que dentro hay <code>.git</code> (si no existe, Nexus no puede ejecutar <code>git diff</code>/<code>status</code> en ese repo)." + "</li>" +
    li + "Reinicia el backend después de cualquier cambio en <code>.env</code>." + "</li>" +
    li + "Si ves la advertencia de “repositorio del servidor no está sincronizado con tu entorno local”, significa que el clon del servidor está en otro HEAD: en ese caso, primero actualiza el clon del servidor (vía Git en el servidor) y luego vuelve a “Detectar archivos”." + "</li>" +
    "</ul>" +

    h3 + "A0.3 Binarios grandes (PDF/imagenes) — comportamiento esperado" + end3 +
    p + "Para archivos binarios grandes (por ejemplo <code>.pdf</code>), Nexus puede evitar guardar el contenido base64 completo en la base de datos por límites de MySQL; aun así, para el commit puede leer el contenido desde el filesystem del repo del servidor. Si ves errores relacionados con tamaño o persistencia, revisa que el servidor pueda leer el repo bajo <code>NEXUS_REPOS_BASE_PATH</code>." + "</p>" +
    h3 + "B. Método manual" + end3 +
    p + "<strong>Cuándo usarlo:</strong> Cuando el servidor no tiene el repositorio Git clonado o no puedes usar sync-from-git (ej. desarrollo local en otra máquina)." + "</p>" +
    p + "<strong>Riesgos:</strong> Rutas o prefijos incorrectos (usar &quot;Prefijo a quitar de rutas&quot; si las rutas incluyen el nombre de la carpeta del proyecto); olvidar archivos; no reflejar exactamente lo que Git vería. En producción se recomienda usar Git como fuente de verdad." + "</p>" +
    p + "<strong>Pasos:</strong> Ejecutar <code>git status</code> o <code>git status --short</code> en tu máquina → copiar toda la salida → Workspace → Método manual → Pegar en Paso 1 → Extraer archivos modificados → Paso 2 elegir carpeta → Subir seleccionados a la entrega." + "</p>" +
    h3 + "Estados de archivo (MODIFIED, ADDED, DELETED, RENAMED, COPIED)" + end3 +
    table + "Estado" + td + "Significado" + tr +
    "MODIFIED" + tde + "Archivo existente con cambios respecto a la base." + tre +
    "ADDED" + tde + "Archivo nuevo (no existía en la rama base/master)." + tre +
    "DELETED" + tde + "Archivo eliminado." + tre +
    "RENAMED" + tde + "Archivo renombrado (origen → destino)." + tre +
    "COPIED" + tde + "Archivo copiado (origen → copia)." + tre +
    "</table>" +

    /* ========== 5. ESTADOS DE ENTREGA (DETALLADO) ========== */
    h2 + "6. Estados de entrega" + end +
    table + "Estado" + td + "Qué significa" + td + "Permite" + td + "Bloquea" + tr +
    "PREPARING" + tde + "Inicial; entrega recién creada." + tde + "Editar metadatos, añadir archivos." + tde + "Commit." + trr +
    "DRAFT" + tde + "Borrador en edición." + tde + "Añadir/quitar archivos, sync desde Git, editar." + tde + "Commit (hay que pasar a READY o LOCKED)." + trr +
    "READY" + tde + "Validada; lista para commit." + tde + "Commit, push, crear PR; modificar archivos y sync." + tde + "Nada crítico." + trr +
    "LOCKED" + tde + "Snapshot congelado." + tde + "Commit y push con el contenido actual." + tde + "Añadir/quitar archivos, sync-from-git (error DELIVERY_LOCKED)." + trr +
    "COMMITTED" + tde + "Commit y push realizados." + tde + "Ver historial; nuevo ciclo requiere nueva entrega o re-apertura según tu proceso." + tde + "Editar archivos de esta entrega." + trr +
    "PR_CREATED" + tde + "Pull Request creado en GitHub." + tde + "Enlace al PR; revisión en GitHub." + tde + "Editar archivos de esta entrega." + trr +
    "MERGED" + tde + "PR mergeado en GitHub." + tde + "Trazabilidad cerrada." + tde + "Editar archivos de esta entrega." + tre +
    "</table>" +
    p + "<strong>Ejemplo LOCKED:</strong> Caso de uso típico: congelar la entrega justo antes de producción; nadie puede añadir o quitar archivos; solo se permite commit con lo ya incluido. Evita cambios de último momento no revisados." + "</p>" +

    /* ========== 6. COMMIT DESDE NEXUS (PRO) ========== */
    h2 + "7. Commit desde Nexus (guía operativa)" + end +
    ul +
    li + "<strong>Selección de archivos:</strong> En la tarjeta Files cada archivo tiene un checkbox; solo los marcados se incluyen en el commit. Usa Todos / Ninguno para marcar o desmarcar todos." + "</li>" +
    li + "<strong>Preview:</strong> Vista previa llama a la API commit-preview: muestra archivos que se incluirán, resumen de impacto (líneas +/-) y mensaje. Si hay SNAPSHOT_DRIFT no podrás confirmar hasta re-sincronizar." + "</li>" +
    li + "<strong>Validaciones:</strong> (1) Estado READY o LOCKED. (2) Si LOCKED, no se pueden cambiar archivos ni sync. (3) Snapshot sin drift (código no cambió fuera de Nexus desde el último snapshot)." + "</li>" +
    "</ul>" +
    h3 + "Ejemplo real de mensaje de commit" + end3 +
    pre + "feat(auth): implement login validation\n\nDelivery: DEL-001\nWO: Fix login issue" + prec +
    p + "Formato convencional: tipo(alcance): descripción. Líneas opcionales para referencia a entrega y work order." + "</p>" +

    /* ========== 7. VALIDACIONES Y ERRORES ========== */
    h2 + "8. Validaciones y errores" + end +
    h3 + "SNAPSHOT_DRIFT" + end3 +
    p + "<strong>Qué significa:</strong> El contenido del repositorio (o de los archivos de la entrega en BD) no coincide con el snapshot guardado en la entrega (git_snapshot_json)." + "</p>" +
    p + "<strong>Por qué ocurre:</strong> Alguien modificó archivos en el repo después de que se creó el snapshot; o se editaron archivos de la entrega fuera del flujo de sync; o se borraron/añadieron archivos sin volver a sincronizar." + "</p>" +
    p + "<strong>Solución paso a paso:</strong> (1) En el Workspace, vuelve a <strong>Detectar archivos</strong> y <strong>Subir entrega desde Git</strong> para regenerar el snapshot con el estado actual. (2) O revierte los cambios externos en el repo y vuelve a abrir el Workspace. (3) Tras eso, Vista previa debería pasar y podrás Confirmar commit y push." + "</p>" +
    h3 + "DELIVERY_LOCKED" + end3 +
    p + "<strong>Causa:</strong> La entrega está en estado LOCKED y se intentó añadir, eliminar o actualizar archivos, o llamar a sync-from-git." + "</p>" +
    p + "<strong>Solución:</strong> Si debes cambiar archivos, cambia el estado de la entrega a READY (desde la gestión de la WO/entrega, si tu proceso lo permite). Si la política es no desbloquear, crea una nueva entrega con los cambios." + "</p>" +
    h3 + "DELIVERY_STATUS_NOT_COMMITTABLE" + end3 +
    p + "<strong>Causa:</strong> La entrega no está en READY ni LOCKED (está en PREPARING, DRAFT, etc.) y se intentó hacer commit o preview de commit." + "</p>" +
    p + "<strong>Solución:</strong> Cambiar el estado de la entrega a <strong>READY</strong> o <strong>LOCKED</strong> desde la interfaz (detalle de la entrega o de la orden de trabajo). Solo entonces estarán habilitados Vista previa y Commit &amp; Push." + "</p>" +

    /* ========== 8. DRY RUN Y SEGURIDAD ========== */
    h2 + "9. Dry run y seguridad" + end +
    p + "<strong>Qué es simulateCommit:</strong> Es un dry run del commit: el backend valida los mismos pasos que en el commit real (estado READY/LOCKED, snapshot sin drift, archivos seleccionados) pero <strong>no escribe</strong> en el repositorio Git. La API es <code>POST .../commit-simulate</code> con el mismo payload que commit-preview." + "</p>" +
    p + "<strong>Cuándo usarlo:</strong> Antes de Commit &amp; Push en entornos críticos; para comprobar que no hay SNAPSHOT_DRIFT ni otros fallos sin realizar el commit." + "</p>" +
    p + "<strong>Cómo interpretarlo:</strong> Si la respuesta es correcta (ok, validations), el commit real con el mismo payload debería funcionar. Si devuelve errores (snapshot, branch, files), corrige lo indicado antes de hacer el commit real." + "</p>" +

    /* ========== 9. IA EN NEXUS ========== */
    h2 + "10. IA en Nexus" + end +
    p + "<strong>Generación de mensaje de commit:</strong> El botón <strong>Generar con IA</strong> llama al endpoint suggest-commit-message. La IA recibe información sobre los archivos de la entrega y el tipo (Feature, Bugfix, etc.) y propone un mensaje en formato Conventional Commits (feat, fix, docs, chore, etc.)." + "</p>" +
    p + "<strong>Cómo mejorar resultados:</strong> Incluir en la entrega solo los archivos que corresponden al cambio que quieres describir; elegir el tipo de entrega correcto (Feature/Bugfix); editar la sugerencia para añadir alcance o referencia (Delivery, WO)." + "</p>" +
    p + "<strong>Limitaciones:</strong> La IA no conoce el contexto completo del negocio; puede generalizar. Revisa siempre el mensaje antes de confirmar. La generación depende del servicio de IA configurado en el backend." + "</p>" +

    /* ========== 10. RELEASE NOTES ========== */
    h2 + "11. Release notes (pro)" + end +
    p + "Se generan comparando la entrega actual con una <strong>entrega base</strong> que eliges en el desplegable (otherDeliveryId). El backend calcula diff (added, removed, modified) y envía un resumen a la IA para producir bullets (Features/changes, Fixes)." + "</p>" +
    h3 + "Ejemplo de salida" + end3 +
    pre + "## Features / changes\n- Add login validation and error messages\n- Update auth middleware\n\n## Fixes\n- Fix redirect loop on session expiry" + prec +
    p + "<strong>Estructura recomendada:</strong> Usar como base la última entrega mergeada de la rama principal o la entrega del tag anterior; así las release notes describen solo lo nuevo de esta entrega." + "</p>" +

    /* ========== 11. FLUJO SCRUM COMPLETO ========== */
    h2 + "12. Flujo SCRUM completo (guía operativa)" + end +
    h3 + "Sprint típico" + end3 +
    ol +
    li + "Crear release (Release Planning → Create Release → versión, nombre)." + "</li>" +
    li + "Crear features y asociarlas a la release (Add en Available Features)." + "</li>" +
    li + "Crear user stories (Backlog) asociadas a esas features; poner en READY." + "</li>" +
    li + "Asignar stories al sprint (Sprints → sprint activo → asignar)." + "</li>" +
    li + "Crear work orders por story; en cada WO, crear tasks y luego <strong>Crear entrega</strong> por task." + "</li>" +
    li + "Repository → Crear rama por entrega → Workspace → subir archivos → READY/LOCKED → Commit &amp; Push → Crear PR." + "</li>" +
    "</ol>" +
    p + "Al mergear los PRs en GitHub, las entregas pasan a MERGED y el resumen técnico de la release (entregas, PRs, commits) queda actualizado." + "</p>" +

    /* ========== 12. MEJORES PRÁCTICAS ========== */
    h2 + "13. Mejores prácticas" + end +
    ul +
    li + "<strong>Usar LOCKED antes de commit en producción:</strong> Congela el conjunto de archivos para que nadie añada cambios de último momento sin revisión." + "</li>" +
    li + "<strong>Siempre usar Vista previa:</strong> Evita sorpresas por SNAPSHOT_DRIFT o archivos no deseados; revisa el resumen antes de confirmar." + "</li>" +
    li + "<strong>Git como fuente de verdad:</strong> Preferir Detectar archivos + Subir desde Git frente al método manual; así el estado en Nexus coincide con el del repositorio." + "</li>" +
    li + "<strong>Evitar método manual en producción:</strong> Riesgo de rutas incorrectas o archivos faltantes; usar solo cuando el servidor no tenga el repo o sea un caso excepcional." + "</li>" +
    "</ul>" +

    /* ========== 13. TROUBLESHOOTING ========== */
    h2 + "14. Troubleshooting" + end +
    h3 + "No detecta archivos" + end3 +
    p + "<strong>Síntoma:</strong> Detectar archivos no muestra nada o muestra lista vacía." + "</p>" +
    p + "<strong>Pasos:</strong> (1) Comprobar que el proyecto tiene repositorio configurado y que el servidor tiene acceso al repo clonado. (2) Si usas &quot;Solo staged&quot;, asegurarte de que hay archivos en staging (<code>git diff --cached --name-only</code>). (3) Si el repo está en otra ruta o branch, verificar configuración del proyecto. (4) Como alternativa, usar método manual con la salida de <code>git status --short</code> desde tu máquina." + "</p>" +
    h3 + "Commit falla" + end3 +
    p + "<strong>Síntoma:</strong> Al confirmar Commit &amp; Push aparece error o no se completa." + "</p>" +
    p + "<strong>Pasos:</strong> (1) Revisar mensaje de error: si es SNAPSHOT_DRIFT, re-sincronizar (Detectar archivos → Subir desde Git) y volver a Vista previa. (2) Si es DELIVERY_STATUS_NOT_COMMITTABLE, cambiar estado a READY o LOCKED. (3) Si es DELIVERY_LOCKED y necesitas cambiar archivos, cambiar estado a READY si la política lo permite. (4) Comprobar que la rama existe en GitHub (Crear rama desde Repository si falta). (5) Revisar logs del backend para errores de Git o de GitHub API." + "</p>" +
    h3 + "PR no se crea" + end3 +
    p + "<strong>Síntoma:</strong> El commit y push funcionan pero el Pull Request no aparece en GitHub." + "</p>" +
    p + "<strong>Pasos:</strong> (1) Comprobar que marcaste <strong>Crear Pull Request después del push</strong> antes de confirmar. (2) Verificar que la conexión GitHub del proyecto tiene permisos para crear PRs (token o OAuth con repo scope). (3) Revisar la respuesta del backend tras el commit: puede incluir el enlace al PR o un error de la API de GitHub. (4) Si el push fue correcto, puedes crear el PR manualmente en GitHub desde la rama y, si aplica, actualizar el estado de la entrega en Nexus." + "</p>" +

    "</div>";

})();
