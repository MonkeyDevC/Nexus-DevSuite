/**
 * Rutas públicas que no deben mostrarse si ya hay sesión (p. ej. login).
 * Evita un frame del formulario antes del redirect.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return children;
  }

  const fromState =
    location.state && typeof location.state.from === "string" && location.state.from.startsWith("/")
      ? location.state.from
      : "/dashboard";

  return <Navigate to={fromState} replace />;
}
