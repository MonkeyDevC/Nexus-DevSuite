/**
 * ----
 * Modulo: App
 * Descripcion: Root del micro-frontend React. Integra AuthProvider y delega navegación a React Router interno.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProjectProvider } from "../modules/projects/index.js";
import { UIProvider } from "./context/UIContext.jsx";
import AppRouter from "./router.jsx";
import DevDataResetScheduler from "../modules/settings/dev-data/DevDataResetScheduler.jsx";

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

