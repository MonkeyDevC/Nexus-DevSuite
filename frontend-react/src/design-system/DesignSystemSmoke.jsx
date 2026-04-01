/**
 * Montaje de primitivas DS + patrones admin para smoke manual o QA local.
 */
import { useState } from "react";
import { Badge } from "./components/Badge/Badge.jsx";
import { Button } from "./components/Button/Button.jsx";
import { Card } from "./components/Card/Card.jsx";
import { Input } from "./components/Input/Input.jsx";
import Modal from "./components/Modal/Modal.jsx";
import { Select } from "./components/Select/Select.jsx";
import { Textarea } from "./components/Textarea/Textarea.jsx";
import { PageContainer } from "./layout/PageContainer/PageContainer.jsx";
import { Sidebar } from "./layout/Sidebar/Sidebar.jsx";
import { Topbar } from "./layout/Topbar/Topbar.jsx";
import { DataTable } from "./patterns/DataTable/DataTable.jsx";
import { EmptyState } from "./patterns/EmptyState/EmptyState.jsx";
import { FilterToolbar } from "./patterns/FilterToolbar/FilterToolbar.jsx";
import { FormPage } from "./patterns/FormPage/FormPage.jsx";
import { FormSection } from "./patterns/FormSection/FormSection.jsx";
import { PageHeader } from "./patterns/PageHeader/PageHeader.jsx";
import { ReportLayout } from "./patterns/ReportLayout/ReportLayout.jsx";
import { SettingsLayout } from "./patterns/SettingsLayout/SettingsLayout.jsx";
import { StatCard, StatCardGrid } from "./patterns/StatCard/StatCard.jsx";
import { Tabs } from "./patterns/Tabs/Tabs.jsx";
import { WorkspaceShell } from "./patterns/WorkspaceShell/WorkspaceShell.jsx";
import smokeStyles from "./DesignSystemSmoke.module.css";
import dsLayout from "./utils/layout.module.css";

const DEMO_COLUMNS = [
  { key: "name", label: "Nombre" },
  { key: "status", label: "Estado", align: "center" },
  { key: "qty", label: "Cantidad", align: "end" },
];

const DEMO_ROWS = [
  { id: "1", name: "Item Alpha", status: "OK", qty: 12 },
  { id: "2", name: "Item Beta", status: "—", qty: 3 },
];

export default function DesignSystemSmoke() {
  const [settingsTab, setSettingsTab] = useState("general");
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const settingsPanels = {
    general: (
      <FormSection title="General" description="Preferencias básicas (demo).">
        <Input label="Nombre de la org" defaultValue="Nexus" />
      </FormSection>
    ),
    security: (
      <FormSection title="Seguridad" description="Opciones de acceso (demo).">
        <Input type="password" label="Rotación de clave" placeholder="••••••••" />
      </FormSection>
    ),
  };

  return (
    <div className={`${dsLayout.flexCol} ${smokeStyles.root}`} data-design-system-smoke>
      <Topbar
        start={<span className={smokeStyles.topbarLabel}>DS Smoke — primitivas + patrones admin</span>}
        end={
          <div className={`${dsLayout.flex} ${dsLayout.gap2}`}>
            <Button variant="ghost" type="button">
              Acción
            </Button>
            <Button variant="primary" type="button" loading>
              Carga
            </Button>
          </div>
        }
      />
      <div className={`${smokeStyles.mainRow} ${dsLayout.flex}`}>
        <Sidebar brandTitle="Nexus" brandSubtitle="Design System">
          <Button variant="secondary" type="button" fullWidth>
            Nav slot
          </Button>
        </Sidebar>
        <PageContainer className={dsLayout.flex1}>
          <div className={smokeStyles.sectionStack}>
            <Card padding="compact">
              <p className={smokeStyles.sectionTitle}>Primitivas</p>
              <div className={`${dsLayout.flex} ${dsLayout.gap2} ${dsLayout.wrap}`}>
                <Badge variant="success">OK light</Badge>
                <Badge variant="success" appearance="solid">
                  OK solid
                </Badge>
                <Badge variant="warning">Aviso</Badge>
                <Badge variant="danger">Error</Badge>
                <Badge variant="neutral">Neutral</Badge>
              </div>
              <div className={`${dsLayout.flexCol} ${dsLayout.gap4} ${smokeStyles.primitivesFields}`}>
                <Input label="Campo" placeholder="Texto" />
                <Input label="Éxito" message="Validación correcta" success />
                <Select label="Selector" message="Opción demo">
                  <option value="">Elegir…</option>
                  <option value="a">Opción A</option>
                  <option value="b">Opción B</option>
                </Select>
                <Textarea label="Notas" placeholder="Texto multilínea" rows={3} />
                <div className={`${dsLayout.flex} ${dsLayout.gap2} ${dsLayout.wrap}`}>
                  <Button variant="primary" type="button">
                    Primary
                  </Button>
                  <Button variant="secondary" type="button">
                    Secondary
                  </Button>
                  <Button variant="outline" type="button">
                    Outline
                  </Button>
                  <Button variant="ghost" type="button">
                    Ghost
                  </Button>
                  <Button variant="link" type="button">
                    Link
                  </Button>
                  <Button variant="primary" type="button" onClick={() => setDemoModalOpen(true)}>
                    Abrir modal
                  </Button>
                </div>
                <Modal isOpen={demoModalOpen} title="Modal DS" onClose={() => setDemoModalOpen(false)}>
                  <div className={`${dsLayout.flexCol} ${dsLayout.gap4}`}>
                    <p className={smokeStyles.breadcrumbFake}>Contenido del modal (Design System).</p>
                    <div className={`${dsLayout.flex} ${dsLayout.gap2} ${dsLayout.wrap}`}>
                      <Button variant="secondary" type="button" onClick={() => setDemoModalOpen(false)}>
                        Cerrar
                      </Button>
                    </div>
                  </div>
                </Modal>
              </div>
            </Card>

            <Card padding="compact">
              <p className={smokeStyles.sectionTitle}>Patrones admin (T0)</p>
              <div className={smokeStyles.sectionStack}>
                <PageHeader
                  title="Título de página"
                  description="Descripción breve del módulo o listado. Patrón tipo admin dashboard."
                  breadcrumb={<span className={smokeStyles.breadcrumbFake}>Inicio / Demostración</span>}
                  actions={
                    <>
                      <Button variant="secondary" type="button">
                        Exportar
                      </Button>
                      <Button variant="primary" type="button">
                        Crear
                      </Button>
                    </>
                  }
                />

                <StatCardGrid>
                  <StatCard label="Total" value="1.284" hint="+12% vs mes anterior" variant="primary" />
                  <StatCard label="Activos" value="96" variant="success" />
                  <StatCard label="Alertas" value="3" variant="warning" />
                </StatCardGrid>

                <FilterToolbar
                  actions={
                    <>
                      <Button variant="ghost" type="button">
                        Limpiar
                      </Button>
                      <Button variant="primary" type="button">
                        Aplicar
                      </Button>
                    </>
                  }
                >
                  <Input label="Buscar" placeholder="Texto…" />
                  <Input label="Filtrar" placeholder="Estado" />
                </FilterToolbar>

                <DataTable
                  caption="Tabla administrativa (demo)"
                  columns={DEMO_COLUMNS}
                  rows={DEMO_ROWS}
                  toolbarStart={<span className={smokeStyles.breadcrumbFake}>0–2 de 2</span>}
                  toolbarEnd={<Button variant="ghost" type="button">Columnas</Button>}
                />

                <div className={smokeStyles.emptyBox}>
                  <EmptyState
                    title="Sin resultados"
                    description="Prueba ajustando filtros o crea un registro nuevo."
                    actions={<Button variant="primary" type="button">Nuevo</Button>}
                  />
                </div>

                <Tabs
                  defaultValue="a"
                  items={[
                    { id: "a", label: "Resumen", panel: <p className={smokeStyles.breadcrumbFake}>Panel A</p> },
                    { id: "b", label: "Detalle", panel: <p className={smokeStyles.breadcrumbFake}>Panel B</p> },
                  ]}
                />

                <FormPage
                  wide
                  actions={
                    <>
                      <Button variant="secondary" type="button">
                        Cancelar
                      </Button>
                      <Button variant="primary" type="button">
                        Guardar
                      </Button>
                    </>
                  }
                >
                  <FormSection title="Datos" description="Sección de formulario de ejemplo.">
                    <Input label="Campo" name="demo-field" />
                  </FormSection>
                </FormPage>

                <SettingsLayout
                  activeId={settingsTab}
                  onNavChange={setSettingsTab}
                  navItems={[
                    { id: "general", label: "General" },
                    { id: "security", label: "Seguridad" },
                  ]}
                  panels={settingsPanels}
                />

                <ReportLayout
                  filters={
                    <FilterToolbar>
                      <Input label="Desde" type="date" />
                      <Input label="Hasta" type="date" />
                    </FilterToolbar>
                  }
                  summary={
                    <StatCardGrid>
                      <StatCard label="Ingresos" value="$0" variant="neutral" />
                    </StatCardGrid>
                  }
                  chart={<p className={smokeStyles.chartPlaceholderLabel}>Área para gráficos (slot)</p>}
                  table={<DataTable columns={DEMO_COLUMNS} rows={DEMO_ROWS} dense />}
                />

                <WorkspaceShell
                  header={
                    <PageHeader title="Workspace" description="Área principal + panel lateral." actions={null} />
                  }
                  sidebar={<span>Propiedades / filtros contextuales</span>}
                  sidebarPosition="start"
                >
                  <p className={smokeStyles.breadcrumbFake}>Contenido principal del workspace (p. ej. tablero Kanban).</p>
                </WorkspaceShell>
              </div>
            </Card>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
