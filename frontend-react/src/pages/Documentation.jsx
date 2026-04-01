/**
 * ----
 * Módulo: Documentation
 * Descripción: Superficie de lectura (paridad con #/documentation) — Admin UI System.
 * Sin editor/CMS; contenido desde módulo estático (legacy *-content.js).
 * ----
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { FormSection } from "../design-system/patterns/FormSection/FormSection.jsx";
import { SettingsLayout } from "../design-system/patterns/SettingsLayout/SettingsLayout.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import {
  DOCUMENTATION_FUNCTIONAL_HTML,
  DOCUMENTATION_NAV_ITEMS,
  DOCUMENTATION_SECTION_IDS,
  DOCUMENTATION_TECHNICAL_HTML,
} from "../modules/documentation/documentationContent.js";
import { downloadDocumentationDocx } from "../modules/documentation/documentationExport.js";
import wave1 from "./wave1Surfaces.module.css";
import styles from "./Documentation.module.css";

function breadcrumbForSection(sectionId) {
  const third =
    sectionId === "technical"
      ? "Documentación técnica"
      : sectionId === "documents"
        ? "Documentos"
        : "Documentación funcional";
  return [
    { label: "Panel", path: "/dashboard" },
    { label: "Documentación", path: "/documentation" },
    { label: third },
  ];
}

function DocHtmlPanel({ html, testId }) {
  const trimmed = (html || "").trim();
  if (!trimmed) {
    return (
      <Card padding="default" data-testid={testId}>
        <EmptyState
          title="Sin contenido"
          description="No hay HTML de documentación cargado para esta sección."
        />
      </Card>
    );
  }

  return (
    <Card padding="default" data-testid={testId}>
      <div className={styles.docShell}>
        <div className={styles.docProse} dangerouslySetInnerHTML={{ __html: trimmed }} />
      </div>
    </Card>
  );
}

function ExportBar({ primaryMode, busy, error, onExportThis, onExportAll }) {
  return (
    <Card padding="default" data-testid="documentation-export-card">
      <div className={styles.exportBlock}>
        <div>
          <div className={wave1.fieldLabel}>Exportar</div>
          <p className={styles.exportHint}>
            Exporta a .docx (Word) con formato (títulos, listas, tablas y código).
          </p>
          {error ? (
            <p className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert" style={{ marginTop: "var(--ds-space-3)" }}>
              {error}
            </p>
          ) : null}
        </div>
        <div className={styles.exportActions}>
          <Button type="button" variant="primary" disabled={busy} onClick={() => onExportThis(primaryMode)}>
            Descargar como Word
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={onExportAll}>
            Descargar ambos
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function Documentation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const activeId = DOCUMENTATION_SECTION_IDS.includes(sectionParam) ? sectionParam : "functional";

  const setSection = useCallback(
    (id) => {
      const next = DOCUMENTATION_SECTION_IDS.includes(id) ? id : "functional";
      setSearchParams({ section: next }, { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (sectionParam && !DOCUMENTATION_SECTION_IDS.includes(sectionParam)) {
      setSearchParams({ section: "functional" }, { replace: true });
    }
  }, [sectionParam, setSearchParams]);

  const htmlBySection = useMemo(
    () => ({
      functional: DOCUMENTATION_FUNCTIONAL_HTML,
      technical: DOCUMENTATION_TECHNICAL_HTML,
    }),
    [],
  );

  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    setExportError("");
  }, [activeId]);

  const runExport = useCallback(
    async (mode) => {
      setExportError("");
      setExportBusy(true);
      try {
        const result = await downloadDocumentationDocx(mode, htmlBySection);
        if (!result.ok) setExportError(result.message);
      } finally {
        setExportBusy(false);
      }
    },
    [htmlBySection],
  );

  const onExportThis = useCallback(
    (mode) => {
      void runExport(mode);
    },
    [runExport],
  );

  const onExportAll = useCallback(() => {
    void runExport("all");
  }, [runExport]);

  const panels = useMemo(
    () => ({
      functional: (
        <>
          <ExportBar
            primaryMode="functional"
            busy={exportBusy}
            error={exportError}
            onExportThis={onExportThis}
            onExportAll={onExportAll}
          />
          <DocHtmlPanel html={htmlBySection.functional} testId="documentation-panel-functional" />
        </>
      ),
      technical: (
        <>
          <ExportBar
            primaryMode="technical"
            busy={exportBusy}
            error={exportError}
            onExportThis={onExportThis}
            onExportAll={onExportAll}
          />
          <DocHtmlPanel html={htmlBySection.technical} testId="documentation-panel-technical" />
        </>
      ),
      documents: (
        <Card padding="default" data-testid="documentation-panel-documents">
          <FormSection
            title="Documentos de plataforma"
            description="Gestión de contenido de plataforma (API /documentation) y documentos ISO (API /documents) en React."
          >
            <p className={styles.exportHint}>
              No confundir con esta ayuda: <strong>Documentación</strong> es lectura de guías; <strong>Documentos</strong>{" "}
              es el módulo CRUD de documentos de plataforma e ISO.
            </p>
            <div className={wave1.navRow} style={{ marginTop: "var(--ds-space-3)" }}>
              <Link className={styles.docLink} to="/documents">
                Ir a Documentos
              </Link>
            </div>
          </FormSection>
        </Card>
      ),
    }),
    [exportBusy, exportError, htmlBySection, onExportAll, onExportThis],
  );

  const panelContent = panels[activeId] ?? panels.functional;

  return (
    <div className={wave1.stack} data-testid="documentation-root">
      <PageHeader
        title="Documentación"
        description="Guías funcionales y técnicas del producto. Solo lectura en esta fase."
        breadcrumb={<Breadcrumb items={breadcrumbForSection(activeId)} />}
      />

      <SettingsLayout
        data-testid="documentation-layout"
        navItems={DOCUMENTATION_NAV_ITEMS}
        activeId={activeId}
        onNavChange={setSection}
        panels={{ [activeId]: panelContent }}
      />
    </div>
  );
}
