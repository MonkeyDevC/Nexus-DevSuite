/**
 * Nexus DevSuite Design System — API pública.
 * Tokens: importar una vez en entrada (main.jsx): `import "./design-system/tokens.css"`.
 */
export { Button } from "./components/Button/Button.jsx";
export { Input } from "./components/Input/Input.jsx";
export { Card } from "./components/Card/Card.jsx";
export { Badge } from "./components/Badge/Badge.jsx";
export { Select } from "./components/Select/Select.jsx";
export { Textarea } from "./components/Textarea/Textarea.jsx";
export { default as Modal } from "./components/Modal/Modal.jsx";
export { default as AlertDialog } from "./components/AlertDialog/AlertDialog.jsx";
export { Sidebar } from "./layout/Sidebar/Sidebar.jsx";
export { Topbar } from "./layout/Topbar/Topbar.jsx";
export { PageContainer } from "./layout/PageContainer/PageContainer.jsx";

import layoutUtils from "./utils/layout.module.css";

/** Clases utilitarias mínimas (flex, gap, alineación). */
export const dsLayout = layoutUtils;

export { default as DesignSystemSmoke } from "./DesignSystemSmoke.jsx";

export {
  PageHeader,
  StatCard,
  StatCardGrid,
  FilterToolbar,
  DataTable,
  EmptyState,
  Tabs,
  FormSection,
  FormPage,
  SettingsLayout,
  ReportLayout,
  WorkspaceShell,
} from "./patterns/index.js";
