/**
 * ----
 * Modulo: PrivacyPage
 * Descripcion: Politica de privacidad v1 (Nexus DevSuite). Texto informativo; revision legal recomendada.
 * ----
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LEGAL_LAST_UPDATED } from "../legal/legalMeta.js";
import loginStyles from "./LoginPage.module.css";
import styles from "./LegalPages.module.css";

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={loginStyles.shell}>
      <div className={loginStyles.frame}>
        <div className={styles.docFrame}>
          <article className={styles.docCard}>
            <header className={styles.docTopBar}>
              <span className={styles.docBrand}>Nexus DevSuite</span>
              <Link className={styles.backToLogin} to="/login">
                Volver al inicio de sesión
              </Link>
            </header>

            <div className={styles.docBody}>
              <h1 className={styles.docTitle}>Política de privacidad</h1>
              <p className={styles.docUpdated}>Última actualización: {LEGAL_LAST_UPDATED}</p>

              <section className={styles.docSection} aria-labelledby="priv-collect">
                <h2 id="priv-collect">1. Información que recopilamos</h2>
                <p>
                  Para operar Nexus DevSuite recopilamos y tratamos, entre otros, los datos necesarios para autenticar
                  a los usuarios y prestar el servicio dentro del contexto de su organización:
                </p>
                <ul>
                  <li>
                    <strong>Datos de cuenta:</strong> por ejemplo, correo electrónico e identificadores asociados al
                    usuario en la plataforma.
                  </li>
                  <li>
                    <strong>Datos de uso operativo:</strong> información generada al utilizar las funciones del producto
                    (proyectos, elementos de trabajo, registros de actividad que el sistema almacene conforme a la
                    configuración del servicio), siempre en el marco del aislamiento por organización.
                  </li>
                </ul>
                <p>
                  No solicitamos en esta versión pública del producto datos de pago ni información financiera para
                  facturación a través de la aplicación; cualquier tratamiento contractual o comercial adicional se
                  regirá por los acuerdos aplicables fuera de este texto.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="priv-use">
                <h2 id="priv-use">2. Cómo usamos la información</h2>
                <p>
                  Utilizamos los datos para proporcionar y mantener el servicio, autenticar sesiones, aplicar permisos
                  según la organización, mejorar la seguridad y la estabilidad de la plataforma, y facilitar la
                  trazabilidad y la gestión del trabajo de desarrollo según las funcionalidades habilitadas.
                </p>
                <p>
                  <strong>Nexus DevSuite no vende ni comercializa datos personales de los usuarios.</strong>
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="priv-security">
                <h2 id="priv-security">3. Seguridad de los datos</h2>
                <p>
                  Aplicamos <strong>medidas de seguridad razonables</strong> acordes a un producto SaaS empresarial
                  (incluida, según la implementación, autenticación basada en credenciales y tokens, y separación de
                  datos por organización).{" "}
                  <strong>Sin embargo, ningún sistema es completamente seguro</strong>; no podemos garantizar la
                  imposibilidad absoluta de incidentes.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="priv-retention">
                <h2 id="priv-retention">4. Retención de datos</h2>
                <p>
                  <strong>
                    Conservamos los datos mientras la cuenta del usuario esté activa y/o mientras resulten necesarios
                    para prestar el servicio
                  </strong>{" "}
                  y cumplir obligaciones legales o contractuales aplicables. Los plazos concretos o procedimientos de
                  baja pueden depender del acuerdo con su organización y del administrador del entorno; no fijamos aquí
                  plazos numéricos genéricos que no estén respaldados contractualmente.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="priv-share">
                <h2 id="priv-share">5. Compartición de datos</h2>
                <p>
                  El acceso a la información dentro de la plataforma se limita según la organización y los permisos
                  configurados. Podemos recurrir a proveedores de infraestructura o servicios técnicos estrictamente
                  necesarios para operar el SaaS; en ese caso, el tratamiento deberá ajustarse a lo acordado con el
                  responsable del tratamiento (por ejemplo, su organización o el titular contractual del servicio), sin
                  vender datos personales a terceros para fines publicitarios.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="priv-rights">
                <h2 id="priv-rights">6. Derechos del usuario</h2>
                <p>
                  Según la legislación aplicable, usted puede tener derecho a solicitar <strong>acceso</strong>,{" "}
                  <strong>rectificación o corrección</strong> y, en los casos previstos por la ley,{" "}
                  <strong>supresión u oposición</strong> respecto de sus datos personales.
                </p>
                <p>
                  Para ejercer estos derechos en el contexto de su uso empresarial, contacte primero al{" "}
                  <strong>administrador de su organización</strong> y, en su caso, utilice los{" "}
                  <strong>canales definidos contractualmente</strong> con el proveedor del servicio. Este documento no
                  describe un portal de autoservicio ni plazos de respuesta que no existan en el producto actual.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="priv-storage">
                <h2 id="priv-storage">7. Almacenamiento en el navegador (sesión)</h2>
                <p>
                  La aplicación web puede utilizar <strong>localStorage</strong> y/o <strong>sessionStorage</strong> del
                  navegador para guardar tokens de sesión y preferencias relacionadas con el inicio de sesión (por
                  ejemplo, la opción &quot;Recordarme&quot;). La finalidad es{" "}
                  <strong>autenticación y mantenimiento de la sesión</strong>, no el seguimiento publicitario.
                </p>
                <p>
                  No empleamos cookies con fines publicitarios en esta versión del producto en el sentido descrito aquí;
                  el mecanismo principal de persistencia de sesión en el cliente es el almacenamiento del navegador
                  mencionado, según la implementación actual.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="priv-contact">
                <h2 id="priv-contact">8. Contacto</h2>
                <p>
                  Para consultas sobre privacidad en su entorno, diríjase al <strong>administrador de su organización</strong>{" "}
                  o al <strong>canal previsto en su acuerdo contractual</strong> con el proveedor del servicio.
                </p>
              </section>

              <p className={styles.docCrossLink}>
                Consulte también los{" "}
                <Link to="/terms">Términos y condiciones de uso</Link>.
              </p>

              <div className={styles.docActions}>
                <Link className={styles.backToLoginPrimary} to="/login">
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
