/**
 * Repository (Code Hub) — Vista #/projects/:projectId/repository
 * Code Deliveries, Branches, Pull Requests. Nexus UI Kit.
 */
(function () {
  "use strict";

  var NexusUI = window.NexusUI;
  var RepositoryAPI = window.RepositoryAPI;
  var RepositoryService = window.RepositoryService;
  var RepositoryUI = window.RepositoryUI;
  var RepositoryInsightsUI = window.RepositoryInsightsUI;

  function esc(s) {
    return NexusUI && NexusUI.esc ? NexusUI.esc(s) : (s == null ? "" : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));
  }

  /** Cierra el modal de detalle de proyecto si está abierto (evita "panel inferior" al entrar desde Proyectos). */
  function closeProjectDetailModalIfOpen() {
    var modal = document.getElementById("projectDetailModal");
    if (modal && modal.classList.contains("show") && typeof bootstrap !== "undefined" && bootstrap.Modal) {
      var inst = bootstrap.Modal.getInstance(modal);
      if (inst) inst.hide();
    }
  }

  window.registerView("repository", async function () {
    await window.showNav();
    closeProjectDetailModalIfOpen();
    var segs = window.getHashSegments();
    var projectId = "";
    if (segs[0] === "projects" && segs[1] && segs[2] === "repository") projectId = segs[1];
    if (!projectId) {
      window.setContent('<div class="nui-card"><div class="nui-card-body"><p class="text-danger">Proyecto no especificado.</p><a href="#/projects" class="btn btn-nexus-primary btn-sm">Ir a Proyectos</a></div></div>');
      return;
    }

    var state = {
      projectId: projectId,
      projectName: "",
      deliveries: [],
      branches: [],
      pullRequests: [],
      githubConnection: { connected: false, repo_owner: null, repo_name: null },
      insights: { stats: null, commits: [], contributors: [], activity: [] }
    };

    console.log("REPOSITORY_VIEW_LOADED", { projectId: state.projectId });

    function renderBreadcrumbs() {
      var parts = [
        { label: "Panel", href: "#/dashboard" },
        { label: "Proyectos", href: "#/projects" },
        { label: state.projectName || state.projectId.slice(0, 8), href: "#/projects/" + encodeURIComponent(state.projectId) + "/repository" }
      ];
      return window.renderBreadcrumbs ? window.renderBreadcrumbs(parts) : "";
    }

    function bindDeliveryButtons() {
      var connected = state.githubConnection && state.githubConnection.connected;
      (state.deliveries || []).forEach(function (d) {
        var branchBtn = document.getElementById("repo-create-branch-" + d.id);
        var prBtn = document.getElementById("repo-create-pr-" + d.id);
        var syncBtn = document.getElementById("repo-sync-" + d.id);
        if (branchBtn) {
          if (!connected) branchBtn.disabled = true;
          else branchBtn.onclick = function () {
            RepositoryService.createBranch(state.projectId, { delivery_id: d.id }).then(function (res) {
              if (res && res.success) {
                console.log("BRANCH_CREATED", { deliveryId: d.id });
                if (typeof window.showSuccessMessage === "function") {
                  var branchName = (res.data && res.data.branch) ? res.data.branch : (d.branch_name || "");
                  window.showSuccessMessage("Rama creada correctamente" + (branchName ? ": " + branchName : "") + ".");
                }
                loadAll();
              } else if (res && res.error && res.error.message && typeof window.openNexusAlertModal === "function") {
                window.openNexusAlertModal({ title: "Error", message: res.error.message });
              }
            });
          };
        }
        if (prBtn) {
          if (!connected) prBtn.disabled = true;
          else prBtn.onclick = function () {
            function doCreatePR() {
              RepositoryService.createPR(state.projectId, { delivery_id: d.id }).then(function (res) {
                if (res && res.success) {
                  console.log("PR_CREATED", { deliveryId: d.id });
                  if (typeof window.showSuccessMessage === "function") {
                    var prUrl = (res.data && (res.data.html_url || res.data.url)) ? (res.data.html_url || res.data.url) : null;
                    window.showSuccessMessage(prUrl ? "Pull Request creada: " + prUrl : "Pull Request creada correctamente.");
                  }
                  loadAll();
                } else if (res && res.error && res.error.message && typeof window.openNexusAlertModal === "function") {
                  window.openNexusAlertModal({ title: "Error", message: res.error.message });
                }
              });
            }
            window.fetchApi("/ai/review/deliveries/" + d.id + "?project_id=" + encodeURIComponent(state.projectId)).then(function (reviewRes) {
              var hasReview = reviewRes && reviewRes.success && reviewRes.data && reviewRes.data.review_id;
              var riskLevel = (reviewRes && reviewRes.data && reviewRes.data.risk_level) ? String(reviewRes.data.risk_level).toLowerCase() : "";
              if (!hasReview) {
                var goWorkspace = window.confirm("Run AI Code Review before creating PR?\n\nNo hay revisión de IA para esta entrega. Aceptar = ir al Workspace. Cancelar = crear PR de todos modos.");
                if (goWorkspace) {
                  window.location.hash = "#/projects/" + encodeURIComponent(state.projectId) + "/deliveries/" + encodeURIComponent(d.id) + "/workspace";
                } else {
                  doCreatePR();
                }
                return;
              }
              if (riskLevel === "high") {
                var createAnyway = window.confirm("High risk detected. Review recommended before creating Pull Request.\n\n¿Crear PR de todos modos?");
                if (!createAnyway) return;
              }
              doCreatePR();
            }).catch(function () {
              doCreatePR();
            });
          };
        }
        if (syncBtn) {
          if (!connected) syncBtn.disabled = true;
          else syncBtn.onclick = function () {
            RepositoryService.sync(state.projectId, { delivery_id: d.id }).then(function (res) {
              if (res && res.success) {
                console.log("REPOSITORY_SYNC", { deliveryId: d.id });
                if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Sincronización completada.");
                loadAll();
              }
            });
          };
        }
      });
    }

    function getApiBase() {
      return (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ? window.APP_CONFIG.API_BASE : "/api/v1";
    }

    function loadAll() {
      var connectionUrl = "/projects/" + state.projectId + "/github-connection";
      Promise.all([
        window.fetchApi("/projects/" + state.projectId).then(function (r) {
          if (r && r.success && r.data) state.projectName = r.data.name || r.data.title;
        }),
        window.fetchApi(connectionUrl).then(function (r) {
          if (r && r.success && r.data) {
            state.githubConnection = {
              connected: !!r.data.connected,
              repo_owner: r.data.repo_owner || null,
              repo_name: r.data.repo_name || null
            };
          }
        }).catch(function () {
          state.githubConnection = { connected: false, repo_owner: null, repo_name: null };
        }),
        RepositoryService.listDeliveries(state.projectId).then(function (r) {
          state.deliveries = (r && r.data) ? r.data : [];
        })
      ]).then(function () {
        var promises = [];
        if (state.githubConnection.connected) {
          promises.push(RepositoryService.getBranches(state.projectId).then(function (r) {
            state.branches = (r && r.branches) ? r.branches : [];
          }).catch(function () { state.branches = []; }));
          promises.push(RepositoryService.getPullRequests(state.projectId, "all").then(function (r) {
            state.pullRequests = (r && r.pull_requests) ? r.pull_requests : [];
          }).catch(function () { state.pullRequests = []; }));
          promises.push(loadRepositoryInsights());
        } else {
          state.branches = [];
          state.pullRequests = [];
          state.insights = { stats: null, commits: [], contributors: [], activity: [] };
        }
        return Promise.all(promises);
      }).then(render);
    }

    function loadRepositoryInsights() {
      if (!state.githubConnection || !state.githubConnection.connected) return Promise.resolve();
      var api = RepositoryAPI;
      return Promise.all([
        api.getStats(state.projectId).then(function (r) {
          state.insights.stats = (r && r.success && r.data) ? r.data : null;
        }).catch(function () { state.insights.stats = null; }),
        api.getCommits(state.projectId, 20).then(function (r) {
          state.insights.commits = (r && r.success && Array.isArray(r.data)) ? r.data : [];
        }).catch(function () { state.insights.commits = []; }),
        api.getContributors(state.projectId).then(function (r) {
          state.insights.contributors = (r && r.success && Array.isArray(r.data)) ? r.data : [];
        }).catch(function () { state.insights.contributors = []; }),
        api.getActivity(state.projectId).then(function (r) {
          state.insights.activity = (r && r.success && Array.isArray(r.data)) ? r.data : [];
        }).catch(function () { state.insights.activity = []; })
      ]).then(function () {
        console.log("REPOSITORY_INSIGHTS_LOADED", { projectId: state.projectId });
      });
    }

    function render() {
      var html = renderBreadcrumbs();
      var connected = state.githubConnection && state.githubConnection.connected;
      var repoLabel = connected && (state.githubConnection.repo_owner || state.githubConnection.repo_name)
        ? esc(state.githubConnection.repo_owner || "") + " / " + esc(state.githubConnection.repo_name || "")
        : "";
      var headerActions = connected
        ? '<button type="button" class="btn btn-outline-secondary btn-sm" id="repo-sync-all">Sincronizar todo</button>'
        : '';
      html += NexusUI && NexusUI.viewHeader ? NexusUI.viewHeader({
        title: "Repository",
        subtitle: "Proyecto: " + esc(state.projectName || state.projectId),
        actionsHtml: headerActions
      }) : '<div class="nui-view-header"><h1 class="nui-view-header-title">Repository</h1>' + headerActions + '</div>';

      if (!connected) {
        html += '<section class="nui-card"><div class="nui-card-body"><p class="text-muted mb-2">Conecte su cuenta de GitHub para crear ramas, Pull Requests y sincronizar el estado.</p><button type="button" class="btn btn-nexus-primary" id="repo-connect-github">Conectar con GitHub</button></div></section>';
      } else {
        html += '<section class="nui-card"><div class="nui-card-body"><p class="mb-0"><span class="text-success">Conectado a:</span> <strong>' + repoLabel + '</strong></p></div></section>';
      }

      if (connected && RepositoryInsightsUI) {
        html += '<section class="nui-card"><div class="nui-card-header d-flex justify-content-between align-items-center"><h2 class="nui-card-title mb-0">Repository Insights</h2><button type="button" class="btn btn-outline-secondary btn-sm" id="repo-refresh-insights">Refresh Insights</button></div><div class="nui-card-body">';
        html += RepositoryInsightsUI.renderStatsCards(state.insights.stats) || "";
        html += "</div></section>";

        html += '<section class="nui-card"><div class="nui-card-header"><h2 class="nui-card-title">Recent Commits</h2></div><div class="nui-card-body">';
        html += RepositoryInsightsUI.renderCommitsList(state.insights.commits) || "";
        html += "</div></section>";

        html += '<section class="nui-card"><div class="nui-card-header"><h2 class="nui-card-title">Activity Timeline</h2></div><div class="nui-card-body">';
        html += RepositoryInsightsUI.renderActivityTimeline(state.insights.activity) || "";
        html += "</div></section>";

        html += '<section class="nui-card"><div class="nui-card-header"><h2 class="nui-card-title">Top Contributors</h2></div><div class="nui-card-body">';
        html += RepositoryInsightsUI.renderContributors(state.insights.contributors, state.projectId) || "";
        html += "</div></section>";
      }

      html += '<section class="nui-card"><div class="nui-card-header"><h2 class="nui-card-title">Entregas de código</h2></div><div class="nui-card-body table-responsive">';
      var delRows = state.deliveries.length
        ? RepositoryUI.deliveriesTableRows(state.deliveries, state.projectId)
        : "<tr><td colspan=\"6\" class=\"text-center text-muted\">No hay entregas. Cree entregas desde la orden de trabajo.</td></tr>";
      html += '<table class="table table-hover nexus-table">' + (RepositoryUI.deliveriesTableHeader ? RepositoryUI.deliveriesTableHeader() : "<thead><tr><th>Entrega</th><th>Tipo</th><th>Rama</th><th>Estado</th><th>PR</th><th>Acciones</th></tr></thead>") + "<tbody>" + delRows + "</tbody></table>";
      html += "</div></section>";

      html += '<section class="nui-card"><div class="nui-card-header"><h2 class="nui-card-title">Ramas</h2></div><div class="nui-card-body table-responsive">';
      var branchRows = state.branches.length
        ? RepositoryUI.branchesTableRows(state.branches)
        : "<tr><td colspan=\"4\" class=\"text-center text-muted\">No se pudieron cargar las ramas. Configure GITHUB_TOKEN y repositorio.</td></tr>";
      html += '<table class="table table-hover nexus-table">' + (RepositoryUI.branchesTableHeader ? RepositoryUI.branchesTableHeader() : "<thead><tr><th>Rama</th><th>Work Order origen</th><th>Último commit</th><th>Protegida</th></tr></thead>") + "<tbody>" + branchRows + "</tbody></table>";
      html += "</div></section>";

      html += '<section class="nui-card"><div class="nui-card-header"><h2 class="nui-card-title">Pull Requests</h2></div><div class="nui-card-body table-responsive">';
      var prRows = state.pullRequests.length
        ? RepositoryUI.pullRequestsTableRows(state.pullRequests)
        : "<tr><td colspan=\"6\" class=\"text-center text-muted\">No hay PRs o no se pudo conectar con GitHub.</td></tr>";
      html += '<table class="table table-hover nexus-table">' + (RepositoryUI.prTableHeader ? RepositoryUI.prTableHeader() : "<thead><tr><th>PR</th><th>Título</th><th>Rama</th><th>Estado</th><th>Autor</th><th>Creado</th></tr></thead>") + "<tbody>" + prRows + "</tbody></table>";
      html += "</div></section>";

      window.setContent(html);
      bindDeliveryButtons();
      var connectBtn = document.getElementById("repo-connect-github");
      if (connectBtn) {
        connectBtn.onclick = function () {
          var token = typeof window.getToken === "function" ? window.getToken() : null;
          if (!token) {
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Sesión requerida", message: "Inicie sesión para conectar con GitHub." });
            return;
          }
          var apiBase = getApiBase();
          var url = (apiBase.indexOf("http") === 0 ? apiBase : window.location.origin + apiBase) + "/auth/github?project_id=" + encodeURIComponent(state.projectId);
          connectBtn.disabled = true;
          fetch(url, { method: "GET", headers: { Authorization: "Bearer " + token, Accept: "application/json" } })
            .then(function (res) {
              return res.json().then(function (data) {
                if (res.ok && data && data.redirect_url) {
                  window.location.href = data.redirect_url;
                  return;
                }
                if (res.status === 401) {
                  if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Sesión expirada", message: "Token de acceso requerido. Inicie sesión de nuevo." });
                  connectBtn.disabled = false;
                  return;
                }
                var err = (data && data.error && data.error.message) ? data.error.message : "No se pudo iniciar la conexión con GitHub.";
                if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: err });
                connectBtn.disabled = false;
              }).catch(function () {
                if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo iniciar la conexión con GitHub." });
                connectBtn.disabled = false;
              });
            })
            .catch(function () {
              if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "Error de conexión. Compruebe la red." });
              connectBtn.disabled = false;
            });
        };
      }
      var syncAllBtn = document.getElementById("repo-sync-all");
      if (syncAllBtn) syncAllBtn.onclick = function () {
        RepositoryService.sync(state.projectId, {}).then(function (res) {
          if (res && res.success) {
            console.log("REPOSITORY_SYNC", { scope: "all" });
            loadAll();
          }
        });
      };
      var refreshInsightsBtn = document.getElementById("repo-refresh-insights");
      if (refreshInsightsBtn) refreshInsightsBtn.onclick = function () {
        refreshInsightsBtn.disabled = true;
        loadRepositoryInsights().then(function () {
          refreshInsightsBtn.disabled = false;
          render();
        }).catch(function () {
          refreshInsightsBtn.disabled = false;
          render();
        });
      };
      if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
    }

    window.setContent(window.showLoading ? window.showLoading() : "<p>Cargando…</p>");
    loadAll();
  });
})();
