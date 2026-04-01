/**
 * Crear / editar contenido de plataforma (POST|PATCH /documentation). Paridad con #/documents/create y /edit.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { FormSection } from "../design-system/patterns/FormSection/FormSection.jsx";
import { markdownToSafeHtml, sanitizePreviewHtml } from "../modules/documents/documentPreview.js";
import {
  createPlatformDocumentation,
  getPlatformDocumentation,
  normalizePlatformDocError,
  patchPlatformDocumentation,
} from "../modules/documents/platformDocumentationService.js";
import { CONTENT_MAX, messageForPlatformDocumentationError } from "../modules/documents/platformDocumentationMessages.js";
import wave1 from "./wave1Surfaces.module.css";

const DOC_TYPES = ["functional", "technical"];
const DOC_STATUSES = ["ACTIVE", "ARCHIVED"];

export default function PlatformDocumentationForm() {
  const { platformId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(platformId);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("functional");
  const [format, setFormat] = useState("html");
  const [status, setStatus] = useState("ACTIVE");
  const [content, setContent] = useState("");
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !platformId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const d = await getPlatformDocumentation(platformId);
        if (cancelled) return;
        setTitle(d.title || "");
        setType(DOC_TYPES.includes(d.type) ? d.type : "functional");
        setFormat(d.format === "markdown" ? "markdown" : "html");
        setStatus(DOC_STATUSES.includes(d.status) ? d.status : "ACTIVE");
        setContent(d.content != null ? String(d.content) : "");
      } catch (e) {
        if (!cancelled) {
          const err = normalizePlatformDocError(e);
          setLoadError(messageForPlatformDocumentationError(err) || err.message || "No se pudo cargar.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, platformId]);

  const previewHtml =
    format === "markdown"
      ? markdownToSafeHtml(content)
      : sanitizePreviewHtml(content) || "<p class='text-muted'>(vacío)</p>";

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    const t = title.trim();
    if (!t) {
      setSubmitError("El título es obligatorio.");
      return;
    }
    if (!DOC_TYPES.includes(type)) {
      setSubmitError("Seleccione un tipo de documento válido.");
      return;
    }
    if (!DOC_STATUSES.includes(status)) {
      setSubmitError("Seleccione un estado válido.");
      return;
    }
    if (!content.trim()) {
      setSubmitError("El contenido es obligatorio.");
      return;
    }
    if (content.length > CONTENT_MAX) {
      setSubmitError(`El contenido supera el máximo permitido (${CONTENT_MAX} caracteres).`);
      return;
    }
    setSaving(true);
    try {
      if (isEdit && platformId) {
        await patchPlatformDocumentation(platformId, {
          title: t,
          content,
          format,
          type,
          status,
        });
        navigate(`/documents/p/${platformId}`);
      } else {
        const created = await createPlatformDocumentation({
          type,
          format,
          content,
          title: t,
        });
        const id = created?.id;
        if (id) navigate(`/documents/p/${id}`);
        else navigate("/documents");
      }
    } catch (err) {
      const e = normalizePlatformDocError(err);
      setSubmitError(messageForPlatformDocumentationError(e) || e.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  const pageTitle = isEdit ? "Editar contenido" : "Nuevo contenido";

  return (
    <div className={wave1.stack} data-testid="documents-platform-form-root">
      <PageHeader
        title={pageTitle}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Panel", path: "/dashboard" },
              { label: "Documentos", path: "/documents" },
              { label: pageTitle },
            ]}
          />
        }
      />

      {loadError ? (
        <Card padding="default">
          <p className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert">
            {loadError}
          </p>
          <Button type="button" variant="secondary" onClick={() => navigate("/documents")}>
            Volver al listado
          </Button>
        </Card>
      ) : loading ? (
        <p className={wave1.loading}>Cargando…</p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          <p style={{ marginBottom: "var(--ds-space-3)" }}>
            <Link to="/documents">Volver al listado</Link>
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "var(--ds-space-4)",
            }}
            className={wave1.blockTopMargin}
          >
            <Card padding="default">
              <FormSection title="Metadatos y contenido">
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-3)" }}>
                  <div>
                    <label className={wave1.fieldLabel} htmlFor="pf-title">
                      Título <span style={{ color: "var(--ds-color-error)" }}>*</span>
                    </label>
                    <input
                      id="pf-title"
                      className={wave1.textarea}
                      style={{ minHeight: "unset", height: "2.5rem" }}
                      maxLength={255}
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className={wave1.fieldLabel} htmlFor="pf-type">
                      Tipo
                    </label>
                    <select id="pf-type" className={wave1.selectInput} value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="functional">Funcional</option>
                      <option value="technical">Técnico</option>
                    </select>
                  </div>
                  <div>
                    <label className={wave1.fieldLabel} htmlFor="pf-format">
                      Formato
                    </label>
                    <select id="pf-format" className={wave1.selectInput} value={format} onChange={(e) => setFormat(e.target.value)}>
                      <option value="html">HTML</option>
                      <option value="markdown">Markdown</option>
                    </select>
                  </div>
                  <div>
                    <label className={wave1.fieldLabel} htmlFor="pf-status">
                      Estado
                    </label>
                    <select id="pf-status" className={wave1.selectInput} value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                  <div>
                    <label className={wave1.fieldLabel} htmlFor="pf-content">
                      Contenido <span style={{ color: "var(--ds-color-error)" }}>*</span>
                    </label>
                    <textarea
                      id="pf-content"
                      className={wave1.textarea}
                      rows={14}
                      required
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                    <p style={{ fontSize: "var(--ds-font-size-xs)", color: "var(--ds-color-text-muted)" }}>
                      {content.length} / {CONTENT_MAX} caracteres
                    </p>
                  </div>
                </div>
              </FormSection>
              {submitError ? (
                <p className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert" style={{ marginTop: "var(--ds-space-3)" }}>
                  {submitError}
                </p>
              ) : null}
              <div className={wave1.navRow} style={{ marginTop: "var(--ds-space-4)" }}>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate("/documents")}>
                  Cancelar
                </Button>
              </div>
            </Card>
            <Card padding="default">
              <h2 className={wave1.fieldLabel} style={{ marginTop: 0 }}>
                Vista previa
              </h2>
              <div
                className={wave1.textarea}
                style={{ minHeight: "200px", maxHeight: "480px", overflow: "auto", background: "var(--ds-color-surface-raised)" }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
