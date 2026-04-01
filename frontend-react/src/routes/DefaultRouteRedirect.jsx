/**
 * Ruta comodín: una sola navegación según sesión (evita * → /dashboard → /login en anónimo).
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function DefaultRouteRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}
