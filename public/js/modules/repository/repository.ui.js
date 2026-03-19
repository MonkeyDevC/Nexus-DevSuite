/**
 * Repository — Helpers de UI (tablas Code Deliveries, Branches, Pull Requests).
 */
(function () {
  "use strict";

  var NexusUI = window.NexusUI;

  function esc(s) {
    return NexusUI && NexusUI.esc ? NexusUI.esc(s) : (s == null ? "" : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));
  }

  function badgeStatus(s) {
    if (!s) return "badge bg-secondary";
    var x = String(s).toUpperCase();
    if (x === "MERGED" || x === "COMPLETED") return "badge bg-success";
    if (x === "CLOSED" || x === "FAILED") return "badge bg-danger";
    if (x === "OPEN" || x === "PR_CREATED" || x === "COMMITTED") return "badge bg-primary";
    if (x === "PREPARING") return "badge bg-secondary";
    return "badge bg-secondary";
  }

  function deliveriesTableRows(items, projectId, onCreateBranch, onCreatePR, onSync) {
    return (items || []).map(function (d) {
      var prNum = "";
      if (d.pull_request_url) {
        var m = (d.pull_request_url || "").match(/\/pull\/(\d+)/);
        if (m) prNum = "#" + m[1];
      }
      var branchId = "repo-create-branch-" + d.id;
      var prId = "repo-create-pr-" + d.id;
      var syncId = "repo-sync-" + d.id;
      var workspaceHref = "#/projects/" + encodeURIComponent(projectId) + "/deliveries/" + encodeURIComponent(d.id) + "/workspace";
      return "<tr>" +
        "<td>" + esc("Delivery " + (d.delivery_number != null ? d.delivery_number : "")) + " " + esc((d.title || "").slice(0, 30)) + "</td>" +
        "<td>" + esc(d.delivery_type || "—") + "</td>" +
        "<td><code class=\"nexus-text-sm\">" + esc(d.branch_name || "—") + "</code></td>" +
        "<td><span class=\"" + badgeStatus(d.status) + "\">" + esc(d.status || "") + "</span></td>" +
        "<td>" + (prNum ? "<a href=\"" + esc(d.pull_request_url || "#") + "\" target=\"_blank\" rel=\"noopener\">" + esc(prNum) + "</a>" : "—") + "</td>" +
        "<td>" +
        "<a href=\"" + workspaceHref + "\" class=\"btn btn-outline-success btn-sm me-1\">Workspace</a>" +
        "<button type=\"button\" class=\"btn btn-outline-secondary btn-sm me-1 \" id=\"" + branchId + "\">Crear rama</button>" +
        "<button type=\"button\" class=\"btn btn-outline-primary btn-sm me-1\" id=\"" + prId + "\">Crear PR</button>" +
        "<button type=\"button\" class=\"btn btn-outline-secondary btn-sm\" id=\"" + syncId + "\">Sincronizar</button>" +
        "</td></tr>";
    }).join("");
  }

  function branchesTableRows(items) {
    return (items || []).map(function (b) {
      return "<tr>" +
        "<td><code class=\"nexus-text-sm\">" + esc(b.name || "—") + "</code></td>" +
        "<td>—</td>" +
        "<td>" + (b.commit_sha ? esc(String(b.commit_sha).slice(0, 7)) : "—") + "</td>" +
        "<td>" + (b.protected ? "Sí" : "No") + "</td>" +
        "</tr>";
    }).join("");
  }

  function branchesTableHeader() {
    return "<thead><tr><th>Rama</th><th>Work Order origen</th><th>Último commit</th><th>Protegida</th></tr></thead>";
  }

  function prTableHeader() {
    return "<thead><tr><th>PR</th><th>Título</th><th>Rama</th><th>Estado</th><th>Autor</th><th>Creado</th></tr></thead>";
  }

  function deliveriesTableHeader() {
    return "<thead><tr><th>Entrega</th><th>Tipo</th><th>Rama</th><th>Estado</th><th>PR</th><th>Acciones</th></tr></thead>";
  }

  function pullRequestsTableRows(items) {
    return (items || []).map(function (pr) {
      var state = (pr.state || "").toUpperCase();
      return "<tr>" +
        "<td><a href=\"" + esc(pr.html_url || "#") + "\" target=\"_blank\" rel=\"noopener\">#" + esc(pr.number) + "</a></td>" +
        "<td>" + esc((pr.title || "").slice(0, 50)) + "</td>" +
        "<td><code class=\"nexus-text-sm\">" + esc(pr.head || "—") + "</code></td>" +
        "<td><span class=\"" + badgeStatus(state) + "\">" + esc(state) + "</span></td>" +
        "<td>" + esc(pr.user || "—") + "</td>" +
        "<td>" + (pr.created_at ? esc(pr.created_at.slice(0, 10)) : "—") + "</td>" +
        "</tr>";
    }).join("");
  }

  window.RepositoryUI = {
    esc: esc,
    badgeStatus: badgeStatus,
    deliveriesTableRows: deliveriesTableRows,
    deliveriesTableHeader: deliveriesTableHeader,
    branchesTableRows: branchesTableRows,
    branchesTableHeader: branchesTableHeader,
    pullRequestsTableRows: pullRequestsTableRows,
    prTableHeader: prTableHeader
  };
})();
