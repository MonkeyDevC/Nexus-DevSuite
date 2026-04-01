/**
 * Autorización tras autenticación: sin redirigir a login; muestra 403 si no cumple requisitos.
 * Usar solo bajo ProtectedRoute / MainLayout.
 */
import { useAuth } from "../context/AuthContext.jsx";
import { hasPermission, hasRole, canAccessRoute } from "../auth/authorization.js";
import ForbiddenPage from "../pages/ForbiddenPage.jsx";

/**
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @param {string[]} [props.requireRoles]
 * @param {string} [props.requirePermission]
 * @param {string} [props.routeKey] clave lógica para canAccessRoute (p. ej. "admin", "releases")
 */
export default function AuthorizedRoute({ children, requireRoles, requirePermission, routeKey }) {
  const { user } = useAuth();

  if (routeKey && !canAccessRoute(user, routeKey)) {
    return <ForbiddenPage title="Acceso denegado" />;
  }

  if (requireRoles && requireRoles.length > 0 && !hasRole(user, ...requireRoles)) {
    return <ForbiddenPage title="Acceso denegado" />;
  }

  if (requirePermission && !hasPermission(user, requirePermission)) {
    return <ForbiddenPage title="Acceso denegado" />;
  }

  return children;
}
