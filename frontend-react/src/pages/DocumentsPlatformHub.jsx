/**
 * Contenido de plataforma (API /documentation) — maestro-detalle. Paridad con #/documents.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import ConfirmModal from "../components/ui/ConfirmModal/ConfirmModal.jsx";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { Input } from "../design-system/components/Input/Input.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { FilterToolbar } from "../design-system/patterns/FilterToolbar/FilterToolbar.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import { renderDocBodyHtml } from "../modules/documents/documentPreview.js";
import {
  deletePlatformDocumentation,
  getPlatformDocumentation,
  listPlatformDocumentation,
  normalizePlatformDocError,
} from "../modules/documents/platformDocumentationService.js";
import { messageForPlatformDocumentationError } from "../modules/documents/platformDocumentationMessages.js";
import { badgeVariantForDocStatus } from "../modules/documents/statusBadge.js";
import wave1 from "./wave1Surfaces.module.css";
import styles from "./DocumentsPlatformHub.module.css";

const HUB_FILTER_STORAGE_KEY = "nexus_documents_hub_filters_v1";

function loadHubFilters() {
  try {
    const raw = sessionStorage.getItem(HUB_FILTER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHubFilters(obj) {
  try {
    sessionStorage.setItem(HUB_FILTER_STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

export default function DocumentsPlatformHub() {
  const { platformId } = useParams();
  const navigate = useNavigate();
  const selectedId = platformId || null;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [listError, setListError] = useState("");
  const [loadingList, setLoadingList] = useState(true);

  const [detailDoc, setDetailDoc] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const saved = loadHubFilters();
    if (saved.q != null) setSearch(saved.q);
    if (saved.type != null) setFilterType(saved.type);
    if (saved.status != null) setFilterStatus(saved.status);
  }, []);

  const persistFilters = useCallback(() => {
    saveHubFilters({ q: search, type: filterType, status: filterStatus });
  }, [search, filterType, filterStatus]);

  const loadList = useCallback(async () => {
    setListError("");
    setLoadingList(true);
    try {
      const payload = await listPlatformDocumentation();
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setItems(rows);
      setMeta(payload?.meta || { total: rows.length });
    } catch (e) {
      const err = normalizePlatformDocError(e);
      setListError(messageForPlatformDocumentationError(err) || err.message || "Error al cargar contenidos.");
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadDetail = useCallback(async (id) => {
    if (!id) {
      setDetailDoc(null);
      setDetailError("");
      return;
    }
    setLoadingDetail(true);
    setDetailError("");
    try {
      const doc = await getPlatformDocumentation(id);
      setDetailDoc(doc);
    } catch (e) {
      const err = normalizePlatformDocError(e);
      setDetailDoc(null);
      setDetailError(messageForPlatformDocumentationError(err) || err.message || "No se pudo cargar el documento.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((it) => {
      if (filterType && it.type !== filterType) return false;
      if (filterStatus === "ACTIVE" || filterStatus === "ARCHIVED") {
        if (it.status !== filterStatus) return false;
      } else if (filterStatus === "" && it.status !== "ACTIVE") {
        return false;
      }
      /* __all__: sin filtro de estado (paridad legacy) */
      if (!q) return true;
      const t = `${it.title || ""} ${it.content || ""}`.toLowerCase();
      return t.includes(q);
    });
  }, [items, search, filterType, filterStatus]);

  const selectDoc = (id) => {
    navigate(`/documents/p/${id}`);
  };

  const clearSelection = () => {
    navigate("/documents");
  };

  const onSearchInput = (v) => {
    setSearch(v);
    window.clearTimeout(onSearchInput._t);
    onSearchInput._t = window.setTimeout(() => {
      persistFilters();
    }, 280);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setDeleteBusy(true);
    try {
      await deletePlatformDocumentation(selectedId);
      setDeleteOpen(false);
      clearSelection();
      await loadList();
    } catch (e) {
      const err = normalizePlatformDocError(e);
      setDetailError(messageForPlatformDocumentationError(err) || err.message || "No se pudo eliminar.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const totalLabel = meta.total != null ? meta.total : items.length;

  return (
    <div className={wave1.stack} data-testid="documents-platform-root">
      <PageHeader
        title="Documentos"
        description="Contenido de plataforma (guías y referencia). El control documental ISO está en Documentos ISO."
        breadcrumb={
          <Breadcrumb items={[{ label: "Panel", path: "/dashboard" }, { label: "Documentos" }]} />
        }
        actions={
          <div className={wave1.navRow}>
            <Button type="button" variant="primary" onClick={() => navigate("/documents/new")}>
              + Crear contenido
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/documents/iso")}>
              Documentos ISO
            </Button>
          </div>
        }
      />

      {listError ? (
        <Card padding="default">
          <p className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert">
            {listError}
          </p>
          <div className={wave1.navRow}>
            <Button type="button" variant="primary" onClick={() => void loadList()}>
              Reintentar
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/documents/iso")}>
              Ir a documentos ISO
            </Button>
          </div>
        </Card>
      ) : (
        <div className={styles.split}>
          <div className={styles.listCol}>
            <div className={styles.listHeader}>
              <FilterToolbar>
                <div>
                  <label className={wave1.fieldLabel} htmlFor="hub-search">
                    Buscar
                  </label>
                  <Input
                    id="hub-search"
                    type="search"
                    value={search}
                    onChange={(e) => onSearchInput(e.target.value)}
                    placeholder="Título o contenido…"
                    aria-label="Filtrar listado"
                  />
                </div>
                <div>
                  <label className={wave1.fieldLabel} htmlFor="hub-filter-type">
                    Tipo
                  </label>
                  <select
                    id="hub-filter-type"
                    className={wave1.selectInput}
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      persistFilters();
                    }}
                    aria-label="Filtrar por tipo"
                  >
                    <option value="">Todos</option>
                    <option value="functional">Funcional</option>
                    <option value="technical">Técnico</option>
                  </select>
                </div>
                <div>
                  <label className={wave1.fieldLabel} htmlFor="hub-filter-status">
                    Estado
                  </label>
                  <select
                    id="hub-filter-status"
                    className={wave1.selectInput}
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      persistFilters();
                    }}
                    aria-label="Filtrar por estado"
                  >
                    <option value="">Activos</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                    <option value="__all__">Todos</option>
                  </select>
                </div>
              </FilterToolbar>
              <p
                style={{
                  marginTop: "var(--ds-space-2)",
                  fontSize: "var(--ds-font-size-xs)",
                  color: "var(--ds-color-text-muted)",
                }}
              >
                {totalLabel} registro(s)
              </p>
            </div>
            <div className={styles.listScroll} role="list">
              {loadingList ? (
                <p className={wave1.loading} style={{ padding: "var(--ds-space-3)" }}>
                  Cargando…
                </p>
              ) : filteredItems.length === 0 ? (
                <div style={{ padding: "var(--ds-space-4)" }}>
                  {!items.length ? (
                    <EmptyState
                      title="No hay documentos aún"
                      description="Cree contenido de plataforma o ajuste los filtros."
                      actions={
                        <Button type="button" variant="primary" onClick={() => navigate("/documents/new")}>
                          Crear documento
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      title="Sin resultados"
                      description="No hay coincidencias con los filtros actuales."
                      actions={
                        <Button type="button" variant="secondary" onClick={() => navigate("/documents/new")}>
                          Crear contenido
                        </Button>
                      }
                    />
                  )}
                </div>
              ) : (
                filteredItems.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    role="listitem"
                    className={`${styles.listItem} ${selectedId === it.id ? styles.listItemActive : ""}`}
                    onClick={() => selectDoc(it.id)}
                    data-testid={`documents-platform-row-${it.id}`}
                  >
                    <div className={styles.rowHead}>
                      <div>
                        <div className={styles.rowTitle}>{it.title || "(sin título)"}</div>
                        <div className={styles.rowMeta}>
                          {it.type || "—"} · {it.format || "—"}
                        </div>
                      </div>
                      <Badge variant={badgeVariantForDocStatus(it.status)}>{it.status || "—"}</Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={styles.detailCol} id="hub-detail">
            {detailError && selectedId ? (
              <Card padding="default">
                <p className={`${wave1.banner} ${wave1.bannerWarning}`} role="alert">
                  {detailError}
                </p>
                <div className={wave1.navRow}>
                  <Button type="button" variant="primary" onClick={() => void loadDetail(selectedId)}>
                    Reintentar
                  </Button>
                  <Button type="button" variant="secondary" onClick={clearSelection}>
                    Quitar selección
                  </Button>
                </div>
              </Card>
            ) : loadingDetail && selectedId ? (
              <p className={wave1.loading}>Cargando documento…</p>
            ) : !selectedId || !detailDoc ? (
              <EmptyState
                title="Seleccione un documento"
                description="Elija un elemento de la lista o cree uno nuevo."
                actions={
                  <Button type="button" variant="primary" onClick={() => navigate("/documents/new")}>
                    Crear documento
                  </Button>
                }
              />
            ) : (
              <article aria-label="Detalle documento">
                <div className={wave1.navRow} style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                  <div>
                    <h2 className={wave1.fieldLabel} style={{ fontSize: "var(--ds-font-size-lg)", margin: 0 }}>
                      {detailDoc.title || "(sin título)"}
                    </h2>
                    <p style={{ fontSize: "var(--ds-font-size-sm)", color: "var(--ds-color-text-muted)" }}>
                      {detailDoc.type || "—"} · {detailDoc.format || "—"} · {detailDoc.status || "—"}
                    </p>
                  </div>
                  <div className={wave1.navRow}>
                    <Button type="button" variant="secondary" onClick={() => navigate(`/documents/p/${detailDoc.id}/edit`)}>
                      Editar
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setDeleteOpen(true)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
                <section className={styles.docBody} aria-label="Contenido">
                  <div dangerouslySetInnerHTML={{ __html: renderDocBodyHtml(detailDoc) }} />
                </section>
              </article>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        title="Eliminar contenido"
        message="Esta acción no se puede deshacer."
        confirmLabel={deleteBusy ? "Eliminando…" : "Eliminar"}
        cancelLabel="Cancelar"
      />
    </div>
  );
}
