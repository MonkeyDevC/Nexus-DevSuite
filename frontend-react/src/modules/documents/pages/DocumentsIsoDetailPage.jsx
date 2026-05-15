/**
 * Detalle documento ISO + versiones. Paridad con #/documents/iso/:id.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import Modal from "../../../design-system/components/Modal/Modal.jsx";
import { Badge } from "../../../design-system/components/Badge/Badge.jsx";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import { Card } from "../../../design-system/components/Card/Card.jsx";
import { PageHeader } from "../../../design-system/patterns/PageHeader/PageHeader.jsx";
import { DataTable } from "../../../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../../../design-system/patterns/EmptyState/EmptyState.jsx";
import { useAuth } from "../../../app/context/AuthContext.jsx";
import { hasRole, ROLE_MASTER } from "../../../auth/authorization.js";
import { badgeVariantForDocStatus } from "../statusBadge.js";
import {
  createIsoVersion,
  getIsoVersion,
  listIsoVersions,
  normalizeIsoDocError,
  getIsoDocument,
  patchIsoVersionContent,
  patchIsoVersionStatus,
} from "../isoDocumentsService.js";
import wave1 from "../../../shared/wave1/wave1Surfaces.module.css";

export default function DocumentsIsoDetail() {
  const { isoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMaster = hasRole(user, ROLE_MASTER);

  const [doc, setDoc] = useState(null);
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [contentModal, setContentModal] = useState({ open: false, version: null, editable: false, text: "" });
  const [contentBusy, setContentBusy] = useState(false);
  const [contentError, setContentError] = useState("");

  const [newVerOpen, setNewVerOpen] = useState(false);
  const [newReason, setNewReason] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newVerBusy, setNewVerBusy] = useState(false);
  const [newVerError, setNewVerError] = useState("");

  const loadAll = useCallback(async () => {
    if (!isoId) return;
    setError("");
    setLoading(true);
    try {
      const d = await getIsoDocument(isoId);
      setDoc(d);
      const v = await listIsoVersions(isoId);
      setVersions(Array.isArray(v) ? v : []);
    } catch (e) {
      const err = normalizeIsoDocError(e);
      setError(err.message || "No se pudo cargar.");
      setDoc(null);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [isoId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function openContent(versionId, versionStatus) {
    setContentError("");
    const st = String(versionStatus || "").toUpperCase();
    try {
      const v = await getIsoVersion(isoId, versionId);
      const raw = v.content != null ? String(v.content) : "";
      setContentModal({
        open: true,
        version: v,
        editable: isMaster && st === "DRAFT",
        text: raw,
      });
    } catch (e) {
      const err = normalizeIsoDocError(e);
      setContentError(err.message || "No se pudo cargar.");
    }
  }

  async function saveContent() {
    if (!contentModal.version?.id) return;
    setContentBusy(true);
    setContentError("");
    try {
      await patchIsoVersionContent(isoId, contentModal.version.id, { content: contentModal.text });
      setContentModal({ open: false, version: null, editable: false, text: "" });
      await loadAll();
    } catch (e) {
      const err = normalizeIsoDocError(e);
      setContentError(err.message || "Error al guardar.");
    } finally {
      setContentBusy(false);
    }
  }

  async function approveVersion(versionId) {
    try {
      await patchIsoVersionStatus(isoId, versionId, { status: "APPROVED" });
      await loadAll();
    } catch (e) {
      const err = normalizeIsoDocError(e);
      setError(err.message || "Error al aprobar.");
    }
  }

  async function archiveVersion(versionId) {
    try {
      await patchIsoVersionStatus(isoId, versionId, { status: "ARCHIVED" });
      await loadAll();
    } catch (e) {
      const err = normalizeIsoDocError(e);
      setError(err.message || "Error al archivar.");
    }
  }

  async function submitNewVersionFixed() {
    setNewVerError("");
    setNewVerBusy(true);
    try {
      await createIsoVersion(isoId, {
        change_reason: newReason.trim() || undefined,
        content: newContent.trim() || undefined,
      });
      setNewVerOpen(false);
      setNewReason("");
      setNewContent("");
      await loadAll();
    } catch (e) {
      const err = normalizeIsoDocError(e);
      setNewVerError(err.message || "Error.");
    } finally {
      setNewVerBusy(false);
    }
  }

  const versionColumns = [
    { key: "vn", label: "Versión" },
    { key: "st", label: "Estado" },
    { key: "act", label: "Acciones", align: "end" },
  ];

  const versionRows = versions.map((v) => ({
    key: v.id,
    vn: v.version_number != null ? v.version_number : v.id,
    st: v.status,
    _v: v,
  }));

  if (loading && !doc) {
    return (
      <div className={wave1.stack} data-testid="documents-iso-detail-root">
        <p className={wave1.loading}>Cargando…</p>
      </div>
    );
  }

  if (error && !doc) {
    return (
      <div className={wave1.stack} data-testid="documents-iso-detail-root">
        <Card padding="default">
          <p className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert">
            {error}
          </p>
          <Button type="button" variant="secondary" onClick={() => navigate("/documents/iso")}>
            Volver
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={wave1.stack} data-testid="documents-iso-detail-root">
      <PageHeader
        title={doc?.title || doc?.code || "Documento ISO"}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Panel", path: "/dashboard" },
              { label: "Documentos", path: "/documents" },
              { label: "ISO", path: "/documents/iso" },
              { label: doc?.title || doc?.code || "Detalle" },
            ]}
          />
        }
      />

      <Card padding="default">
        <p style={{ fontSize: "var(--ds-font-size-sm)", color: "var(--ds-color-text-muted)" }}>Código: {doc?.code || "—"}</p>
        {doc?.description ? <p>{doc.description}</p> : null}
        {doc?.feature_id ? (
          <p style={{ fontSize: "var(--ds-font-size-sm)" }}>
            Feature: <code>{doc.feature_id}</code>
          </p>
        ) : null}
        {doc?.story_id ? (
          <p style={{ fontSize: "var(--ds-font-size-sm)" }}>
            Story: <code>{doc.story_id}</code>
          </p>
        ) : null}

        <h2 className={wave1.fieldLabel} style={{ marginTop: "var(--ds-space-4)" }}>
          Versiones
        </h2>
        <div style={{ marginBottom: "var(--ds-space-2)" }}>
          <Button type="button" variant="primary" onClick={() => setNewVerOpen(true)}>
            Nueva versión
          </Button>
        </div>

        {versions.length === 0 ? (
          <EmptyState title="No hay versiones" description="Cree una versión para este documento." />
        ) : (
          <DataTable
            caption="Versiones"
            columns={versionColumns}
            rows={versionRows}
            getRowKey={(row) => row.key}
            renderCell={({ column, row }) => {
              const v = row._v;
              if (column.key === "st") {
                return <Badge variant={badgeVariantForDocStatus(v.status)}>{v.status || "—"}</Badge>;
              }
              if (column.key === "act") {
                return (
                  <div className={wave1.navRow}>
                    <Button type="button" variant="secondary" onClick={() => void openContent(v.id, v.status)}>
                      Ver contenido
                    </Button>
                    {isMaster && String(v.status || "").toUpperCase() === "DRAFT" ? (
                      <Button type="button" variant="secondary" onClick={() => void approveVersion(v.id)}>
                        Aprobar
                      </Button>
                    ) : null}
                    {isMaster ? (
                      <Button type="button" variant="secondary" onClick={() => void archiveVersion(v.id)}>
                        Archivar
                      </Button>
                    ) : null}
                  </div>
                );
              }
              return row[column.key];
            }}
          />
        )}

        <div style={{ marginTop: "var(--ds-space-4)" }}>
          <Button type="button" variant="secondary" onClick={() => navigate("/documents/iso")}>
            Volver
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={contentModal.open}
        onClose={() => setContentModal({ open: false, version: null, editable: false, text: "" })}
        title="Contenido de la versión"
      >
        {contentModal.editable ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-3)" }}>
            <label className={wave1.fieldLabel} htmlFor="iso-ver-content">
              Contenido
            </label>
            <textarea
              id="iso-ver-content"
              className={wave1.textarea}
              rows={12}
              value={contentModal.text}
              onChange={(e) => setContentModal((m) => ({ ...m, text: e.target.value }))}
            />
            {contentError ? (
              <p className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert">
                {contentError}
              </p>
            ) : null}
            <div className={wave1.navRow}>
              <Button type="button" variant="primary" disabled={contentBusy} onClick={() => void saveContent()}>
                {contentBusy ? "Guardando…" : "Guardar"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setContentModal({ open: false, version: null, editable: false, text: "" })}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <pre
              style={{
                maxHeight: 320,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                padding: "var(--ds-space-3)",
                background: "var(--ds-color-surface-raised)",
                borderRadius: "var(--ds-radius-md)",
              }}
            >
              {contentModal.text || "(vacío)"}
            </pre>
            <Button type="button" variant="secondary" onClick={() => setContentModal({ open: false, version: null, editable: false, text: "" })}>
              Cerrar
            </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={newVerOpen} onClose={() => setNewVerOpen(false)} title="Nueva versión">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-3)" }}>
          <div>
            <label className={wave1.fieldLabel} htmlFor="nv-reason">
              Motivo del cambio (opcional)
            </label>
            <input id="nv-reason" className={wave1.textarea} style={{ minHeight: "2.25rem" }} value={newReason} onChange={(e) => setNewReason(e.target.value)} />
          </div>
          <div>
            <label className={wave1.fieldLabel} htmlFor="nv-content">
              Contenido (opcional)
            </label>
            <textarea id="nv-content" className={wave1.textarea} rows={4} value={newContent} onChange={(e) => setNewContent(e.target.value)} />
          </div>
          {newVerError ? (
            <p className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert">
              {newVerError}
            </p>
          ) : null}
          <div className={wave1.navRow}>
            <Button type="button" variant="primary" disabled={newVerBusy} onClick={() => void submitNewVersionFixed()}>
              {newVerBusy ? "Creando…" : "Crear"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setNewVerOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
