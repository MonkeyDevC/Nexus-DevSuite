/**
 * Búsqueda global por código de trabajo: PR-n, FT-n, US-n (tenant actual).
 */
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveWorkspaceItemCode } from "../shared/http/workspaceNavClient.js";
import {
  parseHumanWorkItemCodeInput,
} from "../shared/workspace/workItemHumanIds.js";
import {
  STORY_DETAIL_FROM_QUERY,
  STORY_DETAIL_FROM_PROJECT,
} from "../shared/routing/storyDetailRouteContext.js";
import styles from "./MainLayout.module.css";

function IconSearch() {
  return (
    <svg className={styles.searchGlyph} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
      />
    </svg>
  );
}

/**
 * @param {{ disabled?: boolean }} props
 */
export default function TopbarGlobalSearch({ disabled = false }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const runResolve = useCallback(async () => {
    const trimmed = value.trim();
    setMessage("");
    if (!trimmed) {
      setMessage("Escribe un código: PR-1, FT-2 o US-3.");
      return;
    }
    if (!parseHumanWorkItemCodeInput(trimmed)) {
      setMessage("Formato: PR-1, FT-2 o US-3 (solo el código).");
      return;
    }
    setBusy(true);
    try {
      const data = await resolveWorkspaceItemCode(trimmed);
      if (!data.matched) {
        if (data.reason === "not_a_code") {
          setMessage("Formato: PR-1, FT-2 o US-3.");
        } else if (data.reason === "tenant_required") {
          setMessage("No se pudo resolver el tenant. Recarga o vuelve a iniciar sesión.");
        } else if (data.reason === "not_found") {
          setMessage(data.code ? `No existe ${data.code} en tu organización.` : "Código no encontrado.");
        } else {
          setMessage("No se encontró ese código.");
        }
        return;
      }
      const pid = data.project_id != null ? String(data.project_id).trim() : "";
      if (data.kind === "project" && pid) {
        navigate(`/projects/${encodeURIComponent(pid)}`);
        setValue("");
        setMessage("");
        return;
      }
      if (data.kind === "feature" && pid && data.id) {
        navigate(`/projects/${encodeURIComponent(pid)}/features/${encodeURIComponent(String(data.id))}`);
        setValue("");
        setMessage("");
        return;
      }
      if (data.kind === "story" && pid && data.id) {
        const sid = String(data.id).trim();
        const qs = new URLSearchParams();
        qs.set(STORY_DETAIL_FROM_QUERY, STORY_DETAIL_FROM_PROJECT);
        navigate(`/projects/${encodeURIComponent(pid)}/stories/${encodeURIComponent(sid)}?${qs.toString()}`);
        setValue("");
        setMessage("");
        return;
      }
      setMessage("Respuesta incompleta del servidor.");
    } catch {
      setMessage("Error al buscar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }, [navigate, value]);

  const hintId = "app-topbar-global-search-hint";

  return (
    <div className={styles.searchWrap}>
      <IconSearch />
      <input
        type="search"
        className={styles.searchInput}
        placeholder="PR-1, FT-2, US-3…"
        aria-label="Ir a proyecto, feature o historia por código"
        aria-describedby={hintId}
        aria-busy={busy}
        disabled={disabled || busy}
        value={value}
        data-testid="app-topbar-global-search"
        onChange={(e) => {
          setValue(e.target.value);
          if (message) setMessage("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void runResolve();
          }
        }}
      />
      <span id={hintId} className={styles.srOnly}>
        Introduce PR, FT o US seguido de guion y número. Pulsa Entrar para ir al elemento.
      </span>
      {message ? (
        <div className={styles.globalSearchFeedback} role="status" data-testid="app-topbar-global-search-feedback">
          {message}
        </div>
      ) : null}
    </div>
  );
}
