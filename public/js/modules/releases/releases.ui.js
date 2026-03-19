/**
 * Release Planning — Helpers de UI (tablas, cards, summary).
 */
(function () {
  "use strict";

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusBadgeClass(status) {
    if (status === "RELEASED") return "bg-success";
    if (status === "READY") return "bg-info";
    if (status === "PLANNING") return "bg-secondary";
    if (status === "ARCHIVED") return "bg-dark";
    return "bg-secondary";
  }

  function releaseListRows(releases) {
    if (!releases || releases.length === 0) return "";
    return releases
      .map(
        function (r) {
          var href = "#/projects/" + encodeURIComponent(r.project_id) + "/releases/" + encodeURIComponent(r.id);
          var featuresCount = r.features_count != null ? r.features_count : (r.summary && r.summary.features_count) || 0;
          var prCount = (r.summary && r.summary.pull_requests_count) != null ? r.summary.pull_requests_count : "—";
          var commitsCount = (r.summary && r.summary.commits_count) != null ? r.summary.commits_count : "—";
          // Sincronizado = existe en GitHub (tag y/o release). Tag importado desde GitHub ya cuenta como sincronizado.
var ghStatus = r.github_tag
            ? (r.github_release_id ? '<span class="badge bg-success">Sincronizado</span>' : '<span class="badge bg-info">Tag en GitHub</span>')
            : '<span class="badge bg-secondary">No sincronizado</span>';
          return (
            "<tr><td><a href=\"" +
            href +
            "\">" +
            esc(r.version) +
            "</a></td><td><span class=\"badge " +
            statusBadgeClass(r.status) +
            "\">" +
            esc(r.status) +
            "</span></td><td>" +
            featuresCount +
            "</td><td>" +
            prCount +
            "</td><td>" +
            commitsCount +
            "</td><td>" +
            ghStatus +
            "</td></tr>"
          );
        }
      )
      .join("");
  }

  function summaryCards(summary) {
    if (!summary) return "";
    var s = summary;
    return (
      '<div class="row g-2 mb-3">' +
      '<div class="col-md-2"><div class="card"><div class="card-body py-2 text-center"><div class="nexus-text-sm text-muted">Features</div><div class="fw-bold">' +
      (s.features_count || 0) +
      "</div></div></div></div>" +
      '<div class="col-md-2"><div class="card"><div class="card-body py-2 text-center"><div class="nexus-text-sm text-muted">Stories</div><div class="fw-bold">' +
      (s.stories_count || 0) +
      "</div></div></div></div>" +
      '<div class="col-md-2"><div class="card"><div class="card-body py-2 text-center"><div class="nexus-text-sm text-muted">Work Orders</div><div class="fw-bold">' +
      (s.work_orders_count || 0) +
      "</div></div></div></div>" +
      '<div class="col-md-2"><div class="card"><div class="card-body py-2 text-center"><div class="nexus-text-sm text-muted">Code Deliveries</div><div class="fw-bold">' +
      (s.code_deliveries_count || 0) +
      "</div></div></div></div>" +
      '<div class="col-md-2"><div class="card"><div class="card-body py-2 text-center"><div class="nexus-text-sm text-muted">Pull Requests</div><div class="fw-bold">' +
      (s.pull_requests_count || 0) +
      "</div></div></div></div>" +
      '<div class="col-md-2"><div class="card"><div class="card-body py-2 text-center"><div class="nexus-text-sm text-muted">Commits</div><div class="fw-bold">' +
      (s.commits_count || 0) +
      "</div></div></div></div>" +
      "</div>"
    );
  }

  window.ReleasesUI = {
    esc: esc,
    statusBadgeClass: statusBadgeClass,
    releaseListRows: releaseListRows,
    summaryCards: summaryCards
  };
})();
