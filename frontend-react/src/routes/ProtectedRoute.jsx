/**
 * ----
 * Modulo: ProtectedRoute
 * Descripcion: Guard de rutas protegidas. Si no existe sesion valida, redirige a /login (React Router).
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import { useAuth } from "../app/context/AuthContext.jsx";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children || null;
}

