/**
 * Documentos ISO — listado (GET /documents). Paridad con #/documents/iso.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import Modal from "../components/ui/Modal/Modal.jsx";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { Input } from "../design-system/components/Input/Input.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { DataTable } from "../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import {
  createIsoDocument,
  getIsoDocumentByCode,
  listIsoDocuments,
  listProjectsForIsoSelect,
  normalizeIsoDocError,
} from "../modules/documents/isoDocumentsService.js";
import wave1 from "./wave1Surfaces.module.css";

function filterBySearch(rows, q) {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((d) => {
    const blob = `${d.code || ""} ${d.title || ""} ${d.description || ""}`.toLowerCase();
    return blob.includes(s);
  });
}

export default function DocumentsIsoList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [rawItems, setRawItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeMsg, setCodeMsg] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newProjectId, setNewProjectId] = useState("");
  const [createError, setCreateError] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const payload = await listIsoDocuments(page, limit);
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setRawItems(rows);
      setMeta(payload?.meta || { total: rows.length, totalPages: 1, page, limit });
    } catch (e) {
      const err = normalizeIsoDocError(e);
      setError(err.message || "Error al cargar documentos.");
      setRawItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayRows = useMemo(() => {
    const filtered = filterBySearch(rawItems, search);
    return filtered;
  }, [rawItems, search]);

  const columns = useMemo(
    () => [
      { key: "code", label: "Código" },
      { key: "title", label: "Título" },
      { key: "ver", label: "Última versión" },
      { key: "status", label: "Estado" },
      { key: "actions", label: "Acciones", align: "end" },
    ],
    [],
  );

  const tableRows = useMemo(
    () =>
      displayRows.map((d) => ({
        id: d.id,
        code: d.code || "—",
        title: d.title || d.id,
        ver: "—",
        status: "—",
        _raw: d,
      })),
    [displayRows],
  );

  async function goCode() {
    setCodeMsg("");
    const code = codeInput.trim();
    if (!code) {
      setCodeMsg("Introduzca un código.");
      return;
    }
    try {
      const doc = await getIsoDocumentByCode(code);
      if (doc?.id) navigate(`/documents/iso/${doc.id}`);
      else setCodeMsg("No se encontró ningún documento con ese código.");
    } catch {
      setCodeMsg("No se encontró ningún documento con ese código.");
    }
  }

  async function openCreate() {
    setCreateError("");
    setNewCode("");
    setNewTitle("");
    setNewDesc("");
    setNewProjectId("");
    setCreateOpen(true);
    try {
      const list = await listProjectsForIsoSelect();
      setProjects(list);
    } catch {
      setProjects([]);
    }
  }

  async function submitCreate() {
    setCreateError("");
    const code = newCode.trim();
    const title = newTitle.trim();
    if (!code || !title) {
      setCreateError("Código y título son obligatorios.");
      return;
    }
    setCreateBusy(true);
    try {
      const payload = { code, title, description: newDesc.trim() || undefined };
      if (newProjectId) payload.project_id = newProjectId;
      await createIsoDocument(payload);
      setCreateOpen(false);
      await load();
    } catch (e) {
      const err = normalizeIsoDocError(e);
      setCreateError(err.message || "Error.");
    } finally {
      setCreateBusy(false);
    }
  }

  function formatProjectLabel(project) {
    if (!project) return "—";
    const pid =
      project.number != null && project.number !== ""
        ? `P${String(project.number)}`
        : String(project.id || "").slice(0, 8) || "—";
    const name = project.name && String(project.name).trim() ? String(project.name).trim() : project.id || "—";
    return `${pid} - ${name}`;
  }

  const totalPages = search.trim()
    ? 1
    : meta.totalPages != null
      ? meta.totalPages
      : meta.total === 0
        ? 0
        : Math.ceil((meta.total || 0) / limit);

  return (
    <div className={wave1.stack} data-testid="documents-iso-list-root">
      <PageHeader
        title="Documentos ISO"
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Panel", path: "/dashboard" },
              { label: "Documentos", path: "/documents" },
              { label: "Documentos ISO" },
            ]}
          />
        }
      />

      <p style={{ marginBottom: 0 }}>
        <Link to="/documents">← Volver a contenido de plataforma</Link>
      </p>

      <Card padding="default">
        <div className={wave1.navRow} style={{ flexWrap: "wrap", alignItems: "flex-end", marginBottom: "var(--ds-space-3)" }}>
          <div>
            <label className={wave1.fieldLabel} htmlFor="iso-limit">
              Por página
            </label>
            <select
              id="iso-limit"
              className={wave1.selectInput}
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value) || 10);
                setPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
          <div>
            <Input
              label="Buscar"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Título, código…"
            />
          </div>
          <div>
            <label className={wave1.fieldLabel} htmlFor="iso-code">
              Código
            </label>
            <div className={wave1.navRow}>
              <input
                id="iso-code"
                className={wave1.textarea}
                style={{ minHeight: "2.25rem", maxWidth: "12rem" }}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void goCode();
                  }
                }}
                placeholder="Código exacto"
                aria-label="Código del documento"
              />
              <Button type="button" variant="secondary" onClick={() => void goCode()}>
                Ir
              </Button>
            </div>
            {codeMsg ? (
              <span style={{ fontSize: "var(--ds-font-size-xs)", color: "var(--ds-color-text-muted)" }}>{codeMsg}</span>
            ) : null}
          </div>
          <Button type="button" variant="primary" onClick={() => void openCreate()} style={{ marginLeft: "auto" }}>
            + Nuevo documento ISO
          </Button>
        </div>

        {error ? (
          <p className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert">
            {error}
          </p>
        ) : null}
        {loading ? (
          <p className={wave1.loading}>Cargando…</p>
        ) : displayRows.length === 0 ? (
          <EmptyState
            title={search.trim() ? "Sin resultados" : "No hay documentos"}
            description="Cree un documento o ajuste la búsqueda."
          />
        ) : (
          <>
            <DataTable
              caption="Documentos ISO"
              columns={columns}
              rows={tableRows}
              getRowKey={(row) => row.id}
              renderCell={({ column, row }) => {
                const d = row._raw;
                if (column.key === "title") {
                  return (
                    <Link to={`/documents/iso/${d.id}`} data-testid={`documents-iso-link-${d.id}`}>
                      {d.title || d.id}
                    </Link>
                  );
                }
                if (column.key === "ver") return "—";
                if (column.key === "status") {
                  return <Badge variant="neutral">—</Badge>;
                }
                if (column.key === "actions") {
                  return <Link to={`/documents/iso/${d.id}`}>Ver</Link>;
                }
                return row[column.key];
              }}
            />
            {!search.trim() && totalPages > 1 ? (
              <div className={wave1.navRow} style={{ marginTop: "var(--ds-space-3)" }}>
                <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <span className={wave1.loading}>
                  Página {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Card>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo documento ISO">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-3)" }}>
          <Input label="Código" value={newCode} onChange={(e) => setNewCode(e.target.value)} required />
          <Input label="Título" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
          <div>
            <label className={wave1.fieldLabel} htmlFor="iso-new-desc">
              Descripción (opcional)
            </label>
            <textarea
              id="iso-new-desc"
              className={wave1.textarea}
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
          <div>
            <label className={wave1.fieldLabel} htmlFor="iso-new-proj">
              Proyecto (opcional)
            </label>
            <select
              id="iso-new-proj"
              className={wave1.selectInput}
              value={newProjectId}
              onChange={(e) => setNewProjectId(e.target.value)}
            >
              <option value="">Sin proyecto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatProjectLabel(p)}
                </option>
              ))}
            </select>
          </div>
          {createError ? (
            <p className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert">
              {createError}
            </p>
          ) : null}
          <div className={wave1.navRow}>
            <Button type="button" variant="primary" disabled={createBusy} onClick={() => void submitCreate()}>
              {createBusy ? "Creando…" : "Crear"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
