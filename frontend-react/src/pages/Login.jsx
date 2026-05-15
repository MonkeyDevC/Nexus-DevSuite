/**
 * ----
 * Modulo: Login
 * Descripcion: Pantalla de login (wireframe producto: dos columnas, recordarme, CTA, copyright).
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileCheck,
  GitBranch,
  LayoutDashboard,
  LogIn,
  Tag,
  Workflow,
} from "lucide-react";
import { useAuth } from "../app/context/AuthContext.jsx";
import { BRAND_LOGO_PNG_SRC } from "../constants/brandAssets.js";
import { consumeExpiryFlashMessage } from "../shared/session/sessionActivity.js";
import { mapLoginFailureToUserMessage } from "../utils/loginErrorMessage.js";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { Input } from "../design-system/components/Input/Input.jsx";
import styles from "./LoginPage.module.css";

const LOGIN_ERROR_VISIBLE_MS = 2400;

const LS_REMEMBER = "nexus_login_remember_me";
const LS_EMAIL = "nexus_login_saved_email";

const BENEFIT_ROWS = [
  { text: "Gestión de Proyectos y Sprints", Icon: LayoutDashboard },
  { text: "Control de Releases con SemVer", Icon: Tag },
  { text: "Motor de Reglas y Gobernanza", Icon: Workflow },
  { text: "Documentación ISO integrada", Icon: FileCheck },
  { text: "Trazabilidad completa Git", Icon: GitBranch },
];

function IconMail() {
  return (
    <svg className={styles.inputGlyph} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m22 6-10 7L2 6"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className={styles.inputGlyph} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 11V7a5 5 0 0110 0v4"
      />
      <rect x="5" y="11" width="14" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function Login() {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof localStorage === "undefined") return true;
    try {
      const v = localStorage.getItem(LS_REMEMBER);
      if (v === null) return true;
      return v === "1";
    } catch {
      return true;
    }
  });
  const [email, setEmail] = useState(() => {
    if (typeof localStorage === "undefined") return "";
    return localStorage.getItem(LS_REMEMBER) === "1" ? localStorage.getItem(LS_EMAIL) || "" : "";
  });
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sessionNotice, setSessionNotice] = useState(null);
  const errorHideTimerRef = useRef(null);
  const sessionNoticeInitRef = useRef(false);

  function clearLoginErrorTimer() {
    if (errorHideTimerRef.current != null) {
      clearTimeout(errorHideTimerRef.current);
      errorHideTimerRef.current = null;
    }
  }

  function showLoginErrorThenAutohide(message) {
    clearLoginErrorTimer();
    setErrorMessage(message);
    errorHideTimerRef.current = window.setTimeout(() => {
      errorHideTimerRef.current = null;
      setErrorMessage(null);
    }, LOGIN_ERROR_VISIBLE_MS);
  }

  useEffect(() => {
    return () => clearLoginErrorTimer();
  }, []);

  useEffect(() => {
    if (sessionNoticeInitRef.current) return;
    sessionNoticeInitRef.current = true;

    const fromState =
      location.state && typeof location.state.sessionExpiredMessage === "string"
        ? location.state.sessionExpiredMessage
        : null;
    if (fromState) {
      setSessionNotice(fromState);
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { replace: true, state: {} }
      );
      return;
    }
    const flash = consumeExpiryFlashMessage();
    if (flash) setSessionNotice(flash);
  }, [location, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    clearLoginErrorTimer();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await authLogin(email.trim(), password, { persistSession: rememberMe });
      if (res && res.success) {
        clearLoginErrorTimer();
        setErrorMessage(null);
        if (rememberMe) {
          localStorage.setItem(LS_REMEMBER, "1");
          localStorage.setItem(LS_EMAIL, email.trim());
        } else {
          localStorage.removeItem(LS_REMEMBER);
          localStorage.removeItem(LS_EMAIL);
        }
        return;
      }

      showLoginErrorThenAutohide(mapLoginFailureToUserMessage(res));
    } catch {
      showLoginErrorThenAutohide("No pudimos completar el inicio de sesión. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const year = new Date().getFullYear();

  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <div className={styles.card}>
          <section className={styles.panelForm} aria-labelledby="login-title">
            <div className={styles.panelFormInner}>
              <header className="auth-brand" aria-labelledby="auth-brand-heading">
                <img
                  className="auth-brand__logo"
                  src={BRAND_LOGO_PNG_SRC}
                  alt=""
                  width={44}
                  height={44}
                  decoding="async"
                />
                <div className="auth-brand__text">
                  <span id="auth-brand-heading" className="auth-brand__title">
                    Nexus DevSuite
                  </span>
                  <span className="auth-brand__subtitle">Enterprise Development Platform</span>
                </div>
              </header>

              <h1 id="login-title" className={styles.title}>
                Iniciar Sesión
              </h1>
              <p className={styles.lead}>Accede a tu cuenta para continuar</p>

              {sessionNotice ? (
                <div className={styles.sessionNotice} role="status">
                  {sessionNotice}
                </div>
              ) : null}

              <Card padding="none" className={styles.dsLoginFormCard} data-testid="ds-login-form-surface">
                <form className={styles.form} onSubmit={onSubmit} noValidate>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="email">
                      Correo Electrónico
                    </label>
                    <div className={styles.inputShell}>
                      <IconMail />
                      <div className={styles.dsInputGrow}>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          required
                          disabled={isSubmitting}
                          placeholder="john@example.com"
                          className={styles.dsFieldPadLeft}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="password">
                      Contraseña
                    </label>
                    <div className={styles.inputShell}>
                      <IconLock />
                      <div className={styles.dsInputGrow}>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          required
                          disabled={isSubmitting}
                          placeholder="••••••••"
                          className={styles.dsFieldPadLeft}
                        />
                      </div>
                    </div>
                  </div>

                <div className={styles.formActions}>
                  <label className={styles.remember} htmlFor="login-remember">
                    <input
                      id="login-remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    Recordarme
                  </label>
                  <Link className={styles.forgotLink} to="/forgot-password">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {errorMessage ? (
                  <div className={styles.alert} role="alert">
                    {errorMessage}
                  </div>
                ) : null}

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className={styles.submitDs}
                    data-testid="login-submit"
                  >
                    {isSubmitting ? (
                      "Ingresando…"
                    ) : (
                      <>
                        <LogIn className={styles.submitIcon} size={20} strokeWidth={2} aria-hidden />
                        Ingresar
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </div>

            <footer className={styles.loginFooter} role="contentinfo">
              <span className={styles.loginFooterCopyright}>
                © {year} Nexus DevSuite. Todos los derechos reservados.
              </span>
              <span className={styles.footerSep} aria-hidden="true">
                ·
              </span>
              <Link
                className={styles.loginFooterLink}
                to="/terms"
                aria-label="Ver términos y condiciones de uso"
              >
                Términos
              </Link>
              <span className={styles.footerSep} aria-hidden="true">
                ·
              </span>
              <Link
                className={styles.loginFooterLink}
                to="/privacy"
                aria-label="Ver política de privacidad"
              >
                Privacidad
              </Link>
            </footer>
          </section>

          <aside className={styles.panelWelcome} aria-label="Propuesta de valor">
            <span className={styles.panelWelcomeWatermark} aria-hidden>
              NEXUS
            </span>
            <div className={styles.panelWelcomeContent}>
              <div className="auth-brand auth-brand--welcome" aria-hidden="true">
                <img
                  className="auth-brand__logo"
                  src={BRAND_LOGO_PNG_SRC}
                  alt=""
                  width={88}
                  height={88}
                  decoding="async"
                />
              </div>
              <h2 className={styles.welcomeTitle}>Bienvenido a Nexus DevSuite</h2>
              <p className={styles.welcomeLead}>
                Plataforma integral para gestión de desarrollo ágil, documentación ISO y entregas de software.
              </p>
              <ul className={styles.benefits}>
                {BENEFIT_ROWS.map((row) => {
                  const IconComponent = row.Icon;
                  return (
                    <li key={row.text} className={styles.benefit}>
                      <span className={styles.benefitIconWrap} aria-hidden>
                        <IconComponent size={16} strokeWidth={2} />
                      </span>
                      <span>{row.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
