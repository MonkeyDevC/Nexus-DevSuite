/**
 * ----
 * Módulo: Settings
 * Descripción: Ajustes del sistema (paridad mínima con public/js/views/settings.js) — Admin UI System.
 * Solo MASTER (misma política que legacy + admin:access).
 * ----
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { FormSection } from "../design-system/patterns/FormSection/FormSection.jsx";
import { SettingsLayout } from "../design-system/patterns/SettingsLayout/SettingsLayout.jsx";
import { DataTable } from "../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import DevDataSettingsPanel from "../modules/settings/dev-data/DevDataSettingsPanel.jsx";
import { SETTINGS_STATIC_SECTIONS } from "../modules/settings/settingsReferenceData.js";
import { listAuthRoles } from "../modules/settings/settingsService.js";
import wave1 from "./wave1Surfaces.module.css";

const MSG_ROLES_ERROR = "No se pudieron cargar los roles.";
const SECTION_IDS = [
  "overview",
  "roles",
  "dev-data",
  ...SETTINGS_STATIC_SECTIONS.map((s) => s.id),
];

const NAV_ITEMS = [
  { id: "overview", label: "Resumen" },
  { id: "roles", label: "Roles del sistema" },
  { id: "dev-data", label: "Datos (DEV)" },
  { id: "sprint", label: "Estados de sprint" },
  { id: "project", label: "Estados de proyecto" },
  { id: "release", label: "Estados de release" },
  { id: "feature", label: "Estados de feature" },
  { id: "story", label: "Estados de user story" },
  { id: "incident", label: "Estados de incidente" },
  { id: "document", label: "Estados de documento" },
];

const statusColumns = [
  { key: "code", label: "Código" },
  { key: "description", label: "Descripción" },
];

const roleColumns = [
  { key: "name", label: "Nombre" },
  { key: "description", label: "Descripción" },
];

function OverviewPanel({ navigate }) {
  return (
    <Card padding="default" data-testid="settings-panel-overview">
      <FormSection
        title="Administración"
        description="Accesos rápidos equivalentes al legacy (#/admin/organization y #/admin/users). En React la gestión se centraliza en el panel Admin."
      >
        <div className={wave1.navRow}>
          <Button type="button" variant="secondary" onClick={() => navigate("/admin")}>
            Gestionar organización
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/admin")}>
            Gestionar usuarios
          </Button>
        </div>
      </FormSection>
    </Card>
  );
}

function StaticStatusPanel({ title, rows, testId }) {
  return (
    <Card padding="default" data-testid={testId}>
      <h2 className={wave1.fieldLabel} style={{ marginTop: 0, marginBottom: "var(--ds-space-4)" }}>
        {title}
      </h2>
      <DataTable
        caption={title}
        columns={statusColumns}
        rows={rows}
        getRowKey={(row) => row.code}
      />
    </Card>
  );
}

function RolesPanel({ roles, loading, error, onRetry }) {
  if (loading) {
    return (
      <Card padding="default" data-testid="settings-panel-roles">
        <p className={wave1.loading} data-testid="settings-roles-loading">
          Cargando roles…
        </p>
      </Card>
    );
  }
  if (error) {
    return (
      <Card padding="default" data-testid="settings-panel-roles">
        <div className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert">
          {error}
        </div>
        <div className={wave1.navRow} style={{ marginTop: "var(--ds-space-3)" }}>
          <Button type="button" variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }
  const displayRows = roles.map((r) => ({
    id: r.id,
    name: r.name || "—",
    description: r.description || "—",
  }));

  return (
    <Card padding="default" data-testid="settings-panel-roles">
      <h2 className={wave1.fieldLabel} style={{ marginTop: 0, marginBottom: "var(--ds-space-4)" }}>
        Roles del sistema
      </h2>
      {roles.length === 0 ? (
        <EmptyState
          title="Sin roles"
          description="No hay roles o no se pudieron cargar desde la API."
          actions={
            <Button type="button" variant="secondary" onClick={onRetry}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <DataTable
          caption="Roles del sistema"
          columns={roleColumns}
          rows={displayRows}
          getRowKey={(row) => String(row.id)}
        />
      )}
    </Card>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const sectionParam = searchParams.get("section");
  const activeId = SECTION_IDS.includes(sectionParam) ? sectionParam : "overview";

  const setSection = useCallback(
    (id) => {
      const next = SECTION_IDS.includes(id) ? id : "overview";
      setSearchParams({ section: next }, { replace: true });
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (sectionParam && !SECTION_IDS.includes(sectionParam)) {
      setSearchParams({ section: "overview" }, { replace: true });
    }
  }, [sectionParam, setSearchParams]);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState("");

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError("");
    try {
      const list = await listAuthRoles();
      setRoles(Array.isArray(list) ? list : []);
    } catch {
      setRoles([]);
      setRolesError(MSG_ROLES_ERROR);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const panels = useMemo(() => {
    const p = {
      overview: <OverviewPanel navigate={navigate} />,
      roles: (
        <RolesPanel roles={roles} loading={rolesLoading} error={rolesError} onRetry={() => void loadRoles()} />
      ),
      "dev-data": <DevDataSettingsPanel />,
    };
    SETTINGS_STATIC_SECTIONS.forEach((s) => {
      p[s.id] = (
        <StaticStatusPanel
          key={s.id}
          title={s.title}
          rows={s.rows}
          testId={`settings-panel-${s.id}`}
        />
      );
    });
    return p;
  }, [navigate, roles, rolesLoading, rolesError, loadRoles]);

  const breadcrumbItems = useMemo(
    () => [
      { label: "Panel", path: "/dashboard" },
      { label: "Ajustes del sistema" },
    ],
    []
  );

  return (
    <div className={wave1.stack} data-testid="settings-root">
      <PageHeader
        title="Ajustes del sistema"
        description="Parámetros básicos del sistema: roles y estados permitidos en cada módulo."
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
      />

      <SettingsLayout
        data-testid="settings-layout"
        navItems={NAV_ITEMS}
        activeId={activeId}
        onNavChange={setSection}
        panels={panels}
      />
    </div>
  );
}
