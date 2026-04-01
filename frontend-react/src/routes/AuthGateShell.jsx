/**
 * Bloquea el árbol de rutas hasta que loadSession() inicial termine.
 * Evita montar Login, layout protegido o redirects antes de conocer el estado real.
 */
import { useAuth } from "../context/AuthContext.jsx";
import AuthBootstrapSplash from "../components/AuthBootstrapSplash.jsx";

export default function AuthGateShell({ children }) {
  const { authStatus } = useAuth();
  if (authStatus === "loading") {
    return <AuthBootstrapSplash />;
  }
  return children;
}
