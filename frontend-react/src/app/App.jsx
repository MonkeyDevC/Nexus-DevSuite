/**
 * ----
 * Modulo: App
 * Descripcion: Root del micro-frontend React. Integra AuthProvider y delega navegación a React Router interno.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import { AuthProvider } from "../context/AuthContext.jsx";
import { ProjectProvider } from "../context/ProjectContext.jsx";
import { UIProvider } from "../context/UIContext.jsx";
import AppRouter from "./router.jsx";
import DevDataResetScheduler from "../components/settings/DevDataResetScheduler.jsx";

export default function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <ProjectProvider>
          <DevDataResetScheduler />
          <AppRouter />
        </ProjectProvider>
      </AuthProvider>
    </UIProvider>
  );
}

