/**
 * Repository Insights — UI para stats, commits, contributors y activity timeline.
 */
(function () {
  "use strict";

  var NexusUI = window.NexusUI;

  function esc(s) {
    return NexusUI && NexusUI.esc ? NexusUI.esc(s) : (s == null ? "" : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      var now = new Date();
      var diff = (now - d) / 1000;
      if (diff < 60) return "Ahora";
      if (diff < 3600) return Math.floor(diff / 60) + " min";
      if (diff < 86400) return Math.floor(diff / 3600) + " h";
      if (diff < 604800) return Math.floor(diff / 86400) + " días";
      return d.toLocaleDateString();
    } catch (e) {
      return iso;
    }
  }

  function renderStatsCards(stats) {
    if (!stats) return "";
    var s = stats;
    var lastCommit = s.last_commit_date ? formatDate(s.last_commit_date) : "—";
    return "<div class=\"row g-3 mb-4\">" +
      "<div class=\"col-6 col-md-3\"><div class=\"nui-card h-100\"><div class=\"nui-card-body text-center\"><div class=\"nexus-text-sm text-muted\">Branches</div><div class=\"fs-4 fw-bold\">" + esc(String(s.branches_count != null ? s.branches_count : 0)) + "</div></div></div></div>" +
      "<div class=\"col-6 col-md-3\"><div class=\"nui-card h-100\"><div class=\"nui-card-body text-center\"><div class=\"nexus-text-sm text-muted\">PRs abiertos</div><div class=\"fs-4 fw-bold\">" + esc(String(s.pull_requests_open != null ? s.pull_requests_open : 0)) + "</div></div></div></div>" +
      "<div class=\"col-6 col-md-3\"><div class=\"nui-card h-100\"><div class=\"nui-card-body text-center\"><div class=\"nexus-text-sm text-muted\">Contributors</div><div class=\"fs-4 fw-bold\">" + esc(String(s.contributors_count != null ? s.contributors_count : 0)) + "</div></div></div></div>" +
      "<div class=\"col-6 col-md-3\"><div class=\"nui-card h-100\"><div class=\"nui-card-body text-center\"><div class=\"nexus-text-sm text-muted\">Último commit</div><div class=\"fs-6\">" + esc(lastCommit) + "</div></div></div></div>" +
      "</div>";
  }

  function renderCommitsList(commits) {
    if (!commits || !commits.length) return "<p class=\"text-muted mb-0\">No hay commits recientes.</p>";
    var rows = commits.slice(0, 20).map(function (c) {
      var shaShort = (c.sha || "").slice(0, 7);
      var url = c.url ? "<a href=\"" + esc(c.url) + "\" target=\"_blank\" rel=\"noopener\">" + esc(shaShort) + "</a>" : esc(shaShort);
      return "<tr><td><code class=\"nexus-text-sm\">" + url + "</code></td><td class=\"text-break\">" + esc((c.message || "").slice(0, 60)) + "</td><td>" + esc(c.author || "—") + "</td><td class=\"nexus-text-sm text-muted\">" + formatDate(c.date) + "</td></tr>";
    }).join("");
    return "<div class=\"table-responsive\"><table class=\"table table-sm table-hover\"><thead><tr><th>SHA</th><th>Mensaje</th><th>Autor</th><th>Fecha</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
  }

  function contributorAvatarUrl(cc, projectId) {
    var base = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || "/api/v1";
    if (projectId && cc.id) return base + "/projects/" + projectId + "/repository/avatar?userId=" + encodeURIComponent(cc.id);
    var url = cc.avatar;
    if (url && /^https?:\/\//i.test(url)) return url;
    if (cc.id) return "https://avatars.githubusercontent.com/u/" + cc.id + "?v=4";
    return null;
  }

  function renderContributors(contributors, projectId) {
    if (!contributors || !contributors.length) return "<p class=\"text-muted mb-0\">No hay datos de contribuidores.</p>";
    var items = contributors.slice(0, 15).map(function (cc) {
      var avatarUrl = contributorAvatarUrl(cc, projectId);
      var initials = (cc.login || "?").slice(0, 2).toUpperCase();
      var img = avatarUrl
        ? "<span class=\"d-inline-flex me-2\" style=\"width:32px;height:32px;\"><img src=\"" + esc(avatarUrl) + "\" alt=\"\" class=\"rounded-circle\" width=\"32\" height=\"32\" loading=\"lazy\" referrerpolicy=\"no-referrer\" onerror=\"this.onerror=null;this.style.display='none';var s=this.nextElementSibling;if(s)s.style.display='inline-flex';\"><span class=\"rounded-circle d-none align-items-center justify-content-center bg-secondary text-white\" style=\"width:32px;height:32px;font-size:12px;\">" + esc(initials) + "</span></span>"
        : "<span class=\"rounded-circle me-2 d-inline-flex align-items-center justify-content-center bg-secondary text-white\" style=\"width:32px;height:32px;font-size:12px;\">" + esc(initials) + "</span>";
      var link = cc.profile_url ? "<a href=\"" + esc(cc.profile_url) + "\" target=\"_blank\" rel=\"noopener\">" + esc(cc.login || "—") + "</a>" : esc(cc.login || "—");
      return "<div class=\"d-flex align-items-center mb-2\">" + img + "<span class=\"me-2\">" + link + "</span><span class=\"badge bg-secondary\">" + esc(String(cc.commits != null ? cc.commits : 0)) + " commits</span></div>";
    }).join("");
    return "<div class=\"nexus-contributors-list\">" + items + "</div>";
  }

  function renderActivityTimeline(activities) {
    if (!activities || !activities.length) return "<p class=\"text-muted mb-0\">No hay actividad reciente.</p>";
    var items = activities.slice(0, 30).map(function (a) {
      var typeLabel = a.type === "commit" ? "Commit" : a.type === "pull_request" ? "PR" : a.type === "delivery" ? "Delivery" : a.type;
      var badge = "badge bg-secondary";
      if (a.type === "commit") badge = "badge bg-primary";
      if (a.type === "pull_request") badge = (a.state === "open" ? "badge bg-success" : "badge bg-secondary");
      if (a.type === "delivery") badge = "badge bg-info";
      var text = a.message || a.title || "";
      if (a.state) text += " (" + esc(a.state) + ")";
      if (a.status) text += " — " + esc(a.status);
      var author = a.author ? " <span class=\"text-muted\">" + esc(a.author) + "</span>" : "";
      return "<div class=\"d-flex align-items-start mb-2\"><span class=\"" + badge + " me-2\">" + esc(typeLabel) + "</span><span class=\"text-break flex-grow-1\">" + esc(text.slice(0, 70)) + author + "</span><span class=\"nexus-text-sm text-muted\">" + formatDate(a.date) + "</span></div>";
    }).join("");
    return "<div class=\"nexus-activity-timeline\">" + items + "</div>";
  }

  window.RepositoryInsightsUI = {
    esc: esc,
    formatDate: formatDate,
    renderStatsCards: renderStatsCards,
    renderCommitsList: renderCommitsList,
    renderContributors: renderContributors,
    renderActivityTimeline: renderActivityTimeline
  };
})();
