/**
 * Documentación técnica — Guía para mantener/extender Nexus DevSuite (nivel SaaS).
 * Público: backend/frontend engineers, arquitectos.
 *
 * Importante:
 * - No contiene guías paso a paso para usuarios finales.
 * - Se enfoca en arquitectura, flujo interno, contratos API, validaciones y puntos de extensión.
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
  var code = "<code class=\"nexus-code\">";
  var pre = "<pre class=\"bg-light border rounded p-2 small mb-2\"><code class=\"d-block text-break\">";
  var prec = "</code></pre>";

  window.DocumentationTechnicalContent =
    '<div class="nexus-doc-body">' +
    h2 + "1. Arquitectura del sistema" + end +
    h3 + "Backend" + end3 +
    p + "Stack: Express + Sequelize. Autenticación/autorización vía JWT y middlewares en " + code + "src/middlewares</code> (authenticate, authorize, errorHandler). El dominio se organiza por módulos en " + code + "src/modules</code> (delivery-workspace, code-deliveries, github-integration, releases, backlog, work-orders, documents, etc.)." + "</p>" +
    h3 + "Frontend" + end3 +
    p + "SPA ligera con hash router en " + code + "public/js/router.js</code>. Vistas en " + code + "public/js/views</code> y módulos de UI/API en " + code + "public/js/modules</code>. La documentación vive en " + code + "public/js/documentation</code> y se renderiza en " + code + "public/js/views/documentation.js</code>." + "</p>" +
    h3 + "Integración con Git y GitHub" + end3 +
    ul +
    li + "<strong>Git local (servidor):</strong> se usa cuando el proyecto tiene repo local disponible (diff real, status local, sync-from-git, etc.)." + "</li>" +
    li + "<strong>GitHub API:</strong> se usa para default branch, árbol de repo, contenido por path, compare base..branch, crear PR y crear ramas (según configuración del proyecto)." + "</li>" +
    "</ul>" +

    h2 + "2. Módulo de Code Deliveries" + end +
    p + "Modelo base: " + code + "src/modules/code-deliveries/models/codeDelivery.model.js</code>. Estados soportados: " + code + "PREPARING, DRAFT, READY, LOCKED, COMMITTED, PR_CREATED, MERGED</code>." + "</p>" +
    ul +
    li + code + "code_deliveries</code> — entrega asociada a " + code + "task_id</code> y " + code + "project_id</code>. Campos clave: " + code + "branch_name</code>, " + code + "commit_hash</code>, " + code + "base_commit_hash</code>, " + code + "git_snapshot_json</code>." + "</li>" +
    li + code + "delivery_files</code> (repo) — archivos de la entrega (path + content/content_base64 + status). Acceso vía " + code + "deliveryFile.repository.js</code>." + "</li>" +
    li + code + "delivery_commits</code> — historial de commits por entrega. Acceso vía " + code + "deliveryCommit.repository.js</code>." + "</li>" +
    li + "<strong>Code review:</strong> " + code + "delivery_reviews</code> y " + code + "review_comments</code> (si está habilitado en tu build) consumidos desde delivery-workspace." + "</li>" +
    "</ul>" +

    h2 + "3. Flujo interno de una entrega (end-to-end)" + end +
    p + "Orquestación principal en " + code + "src/modules/delivery-workspace/deliveryWorkspace.service.js</code>. Secuencia típica (sin UI):" + "</p>" +
    pre + "ensureDeliveryBelongsToProject()\\n→ listFiles/addFile/syncFromGit\\n→ buildDeliverySnapshot() (git_snapshot_json)\\n→ compareSnapshotWithCurrent() (drift)\\n→ getCommitPreview()/simulateCommit()\\n→ commitDelivery() (commit+push)\\n→ (opcional) create PR + actualizar estado" + prec +
    ul +
    li + "<strong>Creación:</strong> se crea un registro en " + code + "code_deliveries</code> (fuera del módulo delivery-workspace)." + "</li>" +
    li + "<strong>Subida/ingesta de archivos:</strong> se persisten en BD en " + code + "delivery_files</code> (manual o desde Git)." + "</li>" +
    li + "<strong>Snapshot:</strong> se genera y persiste en " + code + "code_deliveries.git_snapshot_json</code> para reproducibilidad/auditoría." + "</li>" +
    li + "<strong>Validación:</strong> " + code + "compareSnapshotWithCurrent</code> bloquea preview/commit ante drift." + "</li>" +
    li + "<strong>Commit:</strong> ejecuta commit y push; luego actualiza estado y (opcional) crea PR." + "</li>" +
    "</ul>" +

    h2 + "4. Integración con Git (profundo)" + end +
    h3 + "4.1. Parsing de git status --porcelain=v2" + end3 +
    p + "Implementación: " + code + "src/modules/delivery-workspace/git.service.js</code> → " + code + "parsePorcelainV2(text)</code>." + "</p>" +
    ul +
    li + "Tipo <code>1</code>: entradas normales (path único). Interpreta <code>XY</code> para mapear a " + code + "ADDED, MODIFIED, DELETED, UNTRACKED</code>." + "</li>" +
    li + "Tipo <code>2</code>: renames/copies. Extrae <code>oldPath</code> y <code>path</code> (nuevo) y asigna " + code + "RENAMED</code> o " + code + "COPIED</code>." + "</li>" +
    "</ul>" +
    h3 + "4.2. Mapa unificado (staged vs working vs untracked)" + end3 +
    p + "Implementación: " + code + "buildUnifiedFileMap(projectId, { stagedOnly })</code>. Define prioridad: staged &gt; working &gt; untracked. Resultado:" + "</p>" +
    pre + "{ files: [{ path, status, oldPath? }], rawV2, rawDiffCached, rawDiffHead }" + prec +
    p + "Este mapa se usa para mostrar al usuario qué va a entrar en la entrega y para sincronizar desde Git de forma determinista." + "</p>" +
    h3 + "4.3. Diff real por archivo (git diff)" + end3 +
    p + "Endpoint: " + code + "GET /.../files/:fileId/git-diff</code> → " + code + "deliveryWorkspace.service.getFileGitDiff</code>. Notas:" + "</p>" +
    ul +
    li + "Si existe " + code + "base_commit_hash</code> en la entrega, se calcula el diff contra ese ref; si no, contra HEAD." + "</li>" +
    li + "Para binarios se devuelve " + code + "{ binary: true, message }</code> (detección basada en numstat/paths)." + "</li>" +
    "</ul>" +

    h2 + "5. Sistema de snapshot" + end +
    p + "Persistencia en " + code + "code_deliveries.git_snapshot_json</code> (JSON). Se construye desde los " + code + "delivery_files</code> actuales y metadata del repo." + "</p>" +
    ul +
    li + "<strong>Hashing:</strong> SHA-256 con " + code + "crypto.createHash(\"sha256\")</code> en " + code + "hashContent</code>." + "</li>" +
    li + "<strong>Deduplicación:</strong> " + code + "content_by_hash</code> guarda contenido por hash para evitar duplicados. El snapshot guarda por archivo: " + code + "{ path, status, hash, large_file? }</code>." + "</li>" +
    li + "<strong>Archivos grandes:</strong> " + code + "MAX_FILE_SIZE_FOR_DIFF = 512 * 1024</code>; marca " + code + "large_file</code> y omite contenido." + "</li>" +
    li + "<strong>Drift:</strong> " + code + "compareSnapshotWithCurrent</code> compara snapshot vs estado actual de delivery_files y retorna " + code + "modified/missing/extra</code>." + "</li>" +
    "</ul>" +

    h2 + "6. Validaciones internas" + end +
    p + "Validaciones críticas se aplican en preview, simulate y commit (mismo núcleo en " + code + "deliveryWorkspace.service.js</code>):" + "</p>" +
    ul +
    li + code + "DELIVERY_STATUS_NOT_COMMITTABLE</code> — se dispara en " + code + "ensureDeliveryReadyOrLockedForCommit</code> cuando el status no es READY ni LOCKED." + "</li>" +
    li + code + "DELIVERY_LOCKED</code> — se dispara en " + code + "ensureDeliveryNotLocked</code> cuando el status es LOCKED y se intenta modificar archivos o sincronizar desde Git." + "</li>" +
    li + code + "SNAPSHOT_DRIFT</code> — se dispara cuando " + code + "compareSnapshotWithCurrent</code> detecta diferencias y se intenta preview/simulate/commit." + "</li>" +
    "</ul>" +

    h2 + "7. Commit & Push interno" + end +
    p + "API: " + code + "POST /api/v1/projects/:projectId/code-deliveries/:deliveryId/commit</code> → " + code + "commitDeliveryController</code> → " + code + "deliveryWorkspaceService.commitDelivery</code>." + "</p>" +
    ul +
    li + "Entrada: " + code + "{ file_ids, message, create_pr? }</code> (validada por " + code + "commitDeliveryValidator</code>)." + "</li>" +
    li + "Precondiciones: delivery en READY/LOCKED, snapshot sin drift, branch definida." + "</li>" +
    li + "Efectos: commit local (Git), push a origin, actualización en BD: " + code + "commit_hash</code> y status " + code + "COMMITTED</code> o " + code + "PR_CREATED</code>." + "</li>" +
    "</ul>" +

    h2 + "8. Generación de PR" + end +
    p + "PR se crea cuando el payload incluye " + code + "create_pr === true</code>. El servicio llama a GitHub (vía módulos en " + code + "src/modules/github-integration</code>) y persiste " + code + "pull_request_url</code> / estado " + code + "PR_CREATED</code>." + "</p>" +
    ul +
    li + "<strong>Manejo de errores:</strong> errores de permisos/token/repositorio deben propagarse como AppError o error de GitHub API; revisar logs (eventos PR_CREATED / fallos) para diagnóstico." + "</li>" +
    li + "<strong>Sync de merge:</strong> el backend puede consultar el estado del PR y actualizar a MERGED cuando " + code + "merged_at</code> está presente (ver integración GitHub)." + "</li>" +
    "</ul>" +

    h2 + "9. Diff Viewer (cálculo y endpoints)" + end +
    p + "La UI del Diff Viewer está en " + code + "public/js/views/delivery-workspace.js</code> (modal fullscreen). Soporta dos modos:" + "</p>" +
    ul +
    li + "<strong>Comparación Workspace vs GitHub base:</strong> usa " + code + "GET /files/:fileId/compare</code> → " + code + "compareFileController</code> → " + code + "compareFileWithGitHub(fileId,...)</code>. Devuelve " + code + "workspace_content</code> y " + code + "github_content</code> y un status (ADDED/MODIFIED/DELETED)." + "</li>" +
    li + "<strong>Diff real de Git:</strong> usa " + code + "GET /files/:fileId/git-diff</code> → " + code + "getFileGitDiff</code> → " + code + "gitService.getDiffForFile</code> y muestra el patch." + "</li>" +
    "</ul>" +
    p + "Clasificación del conjunto (Added/Modified/Unchanged/Deleted) se calcula en backend con " + code + "getDiffClassification</code> contra el árbol de la rama base (default branch) y se cachea 5 min." + "</p>" +

    h2 + "10. Problemas conocidos y mejoras" + end +
    ul +
    li + "<strong>Diferencias entre Git local y GitHub API:</strong> parte del sistema compara contra el árbol/contenido de GitHub base branch; si el repo local y GitHub divergen, puede haber discrepancias. Mejoras: normalizar siempre la base (default branch) y exponerla en UI." + "</li>" +
    li + "<strong>Untracked y rutas con espacios:</strong> el parser de porcelain v2 maneja rutas con espacios y renames/copies; aún así, casos extremos pueden requerir tests adicionales (ya existe suite en " + code + "src/tests/unit/delivery-workspace/git.service.edge.test.js</code>)." + "</li>" +
    li + "<strong>Archivos grandes/binarios:</strong> snapshots omiten contenido y el diff detallado puede truncarse; mejorar UX con indicadores consistentes y enlaces a descarga/inspección." + "</li>" +
    "</ul>" +

    "</div>";

})();
