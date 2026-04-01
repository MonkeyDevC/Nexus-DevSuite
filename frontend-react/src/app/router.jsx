/**
 * ----
 * Modulo: router
 * Descripcion: Router principal de React SPA con BrowserRouter, rutas reales y fallback controlado.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import AuthGateShell from "../routes/AuthGateShell.jsx";
import AuthorizedRoute from "../routes/AuthorizedRoute.jsx";
import DefaultRouteRedirect from "../routes/DefaultRouteRedirect.jsx";
import ProtectedRoute from "../routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "../routes/PublicOnlyRoute.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import Login from "../pages/Login.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import TermsPage from "../pages/TermsPage.jsx";
import PrivacyPage from "../pages/PrivacyPage.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Projects from "../pages/Projects.jsx";
import ProjectDetail from "../pages/ProjectDetail.jsx";
import Backlog from "../pages/Backlog.jsx";
import StoryDetail from "../pages/StoryDetail.jsx";
import Features from "../pages/Features.jsx";
import FeatureDetail from "../pages/FeatureDetail.jsx";
import Sprints from "../pages/Sprints.jsx";
import SprintDetail from "../pages/SprintDetail.jsx";
import SprintEditor from "../pages/SprintEditor.jsx";
import Incidents from "../pages/Incidents.jsx";
import IncidentDetail from "../pages/IncidentDetail.jsx";
import IncidentEditor from "../pages/IncidentEditor.jsx";
import Releases from "../pages/Releases.jsx";
import ReleaseDetail from "../pages/ReleaseDetail.jsx";
import ReleaseEditor from "../pages/ReleaseEditor.jsx";
import Admin from "../pages/Admin.jsx";
import Settings from "../pages/Settings.jsx";
import SessionInactivityGuard from "../components/SessionInactivityGuard.jsx";
import DesignSystemSmoke from "../design-system/DesignSystemSmoke.jsx";
import Documentation from "../pages/Documentation.jsx";
import DocumentsPlatformHub from "../pages/DocumentsPlatformHub.jsx";
import DocumentsIsoList from "../pages/DocumentsIsoList.jsx";
import DocumentsIsoDetail from "../pages/DocumentsIsoDetail.jsx";
import PlatformDocumentationForm from "../pages/PlatformDocumentationForm.jsx";

/** Smoke DS: Vite dev, o bundle con VITE_DS_SMOKE=1 (p. ej. QA del estático en Express). */
const showDesignSystemSmokeRoute =
  Boolean(import.meta.env.DEV) || import.meta.env.VITE_DS_SMOKE === "1";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <SessionInactivityGuard />
      <AuthGateShell>
        <Routes>
          {showDesignSystemSmokeRoute ? (
            <Route path="/__dev/design-system-smoke" element={<DesignSystemSmoke />} />
          ) : null}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/documents/p/:platformId/edit" element={<PlatformDocumentationForm />} />
            <Route path="/documents/p/:platformId" element={<DocumentsPlatformHub />} />
            <Route path="/documents/new" element={<PlatformDocumentationForm />} />
            <Route path="/documents/iso/:isoId" element={<DocumentsIsoDetail />} />
            <Route path="/documents/iso" element={<DocumentsIsoList />} />
            <Route path="/documents" element={<DocumentsPlatformHub />} />
            <Route
              path="/admin"
              element={
                <AuthorizedRoute routeKey="admin">
                  <Admin />
                </AuthorizedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <AuthorizedRoute routeKey="settings">
                  <Settings />
                </AuthorizedRoute>
              }
            />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId/features/:featureId" element={<FeatureDetail />} />
            <Route path="/projects/:projectId/features" element={<Features />} />
            <Route path="/projects/:projectId/sprints/new" element={<SprintEditor />} />
            <Route path="/projects/:projectId/sprints/:sprintId/edit" element={<SprintEditor />} />
            <Route path="/projects/:projectId/sprints/:sprintId" element={<SprintDetail />} />
            <Route path="/projects/:projectId/sprints" element={<Sprints />} />
            <Route path="/projects/:projectId/incidents/new" element={<IncidentEditor />} />
            <Route path="/projects/:projectId/incidents/:incidentId/edit" element={<IncidentEditor />} />
            <Route path="/projects/:projectId/incidents/:incidentId" element={<IncidentDetail />} />
            <Route path="/projects/:projectId/incidents" element={<Incidents />} />
            <Route
              path="/projects/:projectId/releases"
              element={
                <AuthorizedRoute routeKey="releases">
                  <Outlet />
                </AuthorizedRoute>
              }
            >
              <Route index element={<Releases />} />
              <Route path="new" element={<ReleaseEditor />} />
              <Route path=":releaseId/edit" element={<ReleaseEditor />} />
              <Route path=":releaseId" element={<ReleaseDetail />} />
            </Route>
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/backlog" element={<Backlog />} />
            <Route path="/projects/:projectId/stories/:storyId" element={<StoryDetail />} />
          </Route>

          <Route path="*" element={<DefaultRouteRedirect />} />
        </Routes>
      </AuthGateShell>
    </BrowserRouter>
  );
}
