/**
 * ----
 * Modulo: ForgotPassword
 * Descripcion: Flujo de recuperacion de contrasena (UX produccion; envio simulado hasta endpoint real).
 * ----
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import nexusMarkUrl from "../assets/nexus-mark.svg?url";
import { requestPasswordReset } from "../shared/auth/forgotPasswordRequest.js";
import styles from "./LoginPage.module.css";

const SUCCESS_COPY =
  "Si el correo existe, recibirás instrucciones para restablecer tu contraseña.";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [didSucceed, setDidSucceed] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setDidSucceed(true);
        return;
      }
      setErrorMessage(res.message || "No se pudo completar la solicitud.");
    } catch {
      setErrorMessage("Error en la solicitud. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const year = new Date().getFullYear();

  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <div className={styles.forgotCard}>
          <header className={styles.brand}>
            <div className={styles.logoTile}>
              <img src={nexusMarkUrl} alt="" width={26} height={26} />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>Nexus DevSuite</span>
              <span className={styles.brandTagline}>Enterprise Development Platform</span>
            </div>
          </header>

          <h1 className={styles.title}>Recuperar contraseña</h1>
          <p className={styles.lead}>
            Te enviaremos instrucciones al correo asociado a tu cuenta.
          </p>

          {didSucceed ? (
            <div className={styles.successBanner} role="status">
              <p className={styles.successText}>{SUCCESS_COPY}</p>
              <Link className={styles.backToLogin} to="/login">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="forgot-email">
                  Correo electrónico
                </label>
                <div className={styles.inputShell}>
                  <input
                    id="forgot-email"
                    className={`${styles.input} ${styles.inputPlain}`}
                    type="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    placeholder="tu@empresa.com"
                  />
                </div>
              </div>

              {errorMessage ? (
                <div className={styles.alert} role="alert">
                  {errorMessage}
                </div>
              ) : null}

              <button type="submit" className={styles.submit} disabled={isSubmitting}>
                {isSubmitting ? "Enviando…" : "Enviar instrucciones"}
              </button>

              <Link className={styles.backToLoginInline} to="/login">
                Volver al inicio de sesión
              </Link>
            </form>
          )}

          <p className={styles.copyright}>
            © {year} Nexus DevSuite. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
