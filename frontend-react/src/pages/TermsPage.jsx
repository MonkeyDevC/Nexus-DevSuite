/**
 * ----
 * Modulo: TermsPage
 * Descripcion: Terminos y condiciones de uso v1 (Nexus DevSuite). Texto informativo; revision legal recomendada.
 * ----
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LEGAL_LAST_UPDATED } from "../legal/legalMeta.js";
import loginStyles from "./LoginPage.module.css";
import styles from "./LegalPages.module.css";

export default function TermsPage() {
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
              <h1 className={styles.docTitle}>Términos y condiciones de uso</h1>
              <p className={styles.docUpdated}>Última actualización: {LEGAL_LAST_UPDATED}</p>

              <section className={styles.docSection} aria-labelledby="terms-intro">
                <h2 id="terms-intro">1. Introducción</h2>
                <p>
                  Bienvenido a Nexus DevSuite. Estos términos regulan el acceso y uso de la plataforma SaaS de
                  gestión del ciclo de vida del desarrollo de software (proyectos, backlog, sprints, releases,
                  incidentes, documentación de calidad, flujos de trabajo y trazabilidad), en el marco de la
                  organización a la que pertenezca su cuenta.
                </p>
                <p>
                  Al utilizar el servicio, usted declara haber leído y aceptado estas condiciones. Si no está de
                  acuerdo, debe abstenerse de usar la plataforma.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="terms-use">
                <h2 id="terms-use">2. Uso del servicio</h2>
                <p>
                  El servicio está destinado a un uso profesional y conforme a la ley. El usuario se compromete a no
                  emplear la plataforma para fines ilícitos, a no intentar vulnerar su seguridad ni la de otras
                  cuentas u organizaciones, y a respetar las políticas internas de su organización.
                </p>
                <p>
                  Ciertas funcionalidades pueden depender de la configuración habilitada para su organización y de los
                  permisos asignados a su perfil.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="terms-accounts">
                <h2 id="terms-accounts">3. Cuentas de usuario</h2>
                <p>
                  Las cuentas están asociadas a una organización (entorno multi-organización).{" "}
                  <strong>
                    El acceso y los permisos del usuario están definidos por la organización a la que pertenece
                  </strong>
                  , incluidos roles, visibilidad de datos y restricciones operativas.
                </p>
                <p>
                  El usuario es responsable de mantener la confidencialidad de sus credenciales y de notificar de forma
                  razonable a su administrador ante un uso no autorizado presunto.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="terms-resp">
                <h2 id="terms-resp">4. Responsabilidades del usuario</h2>
                <p>
                  El usuario es responsable de la información que introduce en la plataforma, de la exactitud de los
                  datos que registra y del cumplimiento de las obligaciones laborales o contractuales que le correspondan
                  en su organización.
                </p>
                <p>
                  No debe cargar contenido que infrinja derechos de terceros ni que viole políticas aplicables.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="terms-ip">
                <h2 id="terms-ip">5. Propiedad intelectual</h2>
                <p>
                  Nexus DevSuite, su marca, interfaz, documentación asociada al producto y el software que lo sustenta
                  están protegidos por las leyes aplicables. No se concede ninguna licencia sobre ellos salvo el derecho
                  limitado a usar el servicio según estos términos.
                </p>
                <p>
                  Los datos y contenidos que su organización y usted incorporen a la plataforma permanecen bajo su
                  responsabilidad y titularidad conforme a lo acordado con su organización y, en su caso, contractualmente
                  con el proveedor del servicio.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="terms-avail">
                <h2 id="terms-avail">6. Disponibilidad del servicio</h2>
                <p>
                  Procuramos mantener el servicio operativo, pero{" "}
                  <strong>no garantizamos un nivel de disponibilidad específico ni la ausencia de interrupciones</strong>.
                  Pueden producirse cortes por mantenimiento, incidencias técnicas o causas fuera de nuestro control
                  razonable. Cualquier compromiso de nivel de servicio (SLA) debería constar expresamente en el acuerdo
                  comercial aplicable entre las partes, no en este texto público.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="terms-liab">
                <h2 id="terms-liab">7. Limitación de responsabilidad</h2>
                <p>
                  En la medida permitida por la ley aplicable, el uso del servicio se ofrece sin garantías expresas o
                  implícitas adicionales a las que no puedan excluirse legalmente.{" "}
                  <strong>
                    No nos hacemos responsables, en la medida en que la ley lo permita, por daños indirectos, lucro
                    cesante, pérdidas incidentales o consecuenciales, ni por pérdida de datos derivada del uso del
                    servicio
                  </strong>
                  , salvo disposición imperativa en contrario.
                </p>
                <p>
                  El usuario es responsable de mantener copias de respaldo o procedimientos adecuados para información
                  crítica según las políticas de su organización.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="terms-changes">
                <h2 id="terms-changes">8. Cambios en el servicio y en los términos</h2>
                <p>
                  <strong>
                    El servicio se proporciona &quot;tal cual&quot; y puede evolucionar con el tiempo. Nexus DevSuite
                    está en mejora continua; algunas funcionalidades pueden cambiar, actualizarse o descontinuarse
                  </strong>
                  . No existe garantía de permanencia de características concretas más allá de lo acordado
                  contractualmente, en su caso.
                </p>
                <p>
                  Podremos actualizar estos términos. La fecha de &quot;Última actualización&quot; indicará revisiones
                  relevantes. El uso continuado del servicio tras cambios materiales puede implicar la aceptación de los
                  términos revisados, salvo que la ley o su contrato disponga otra cosa.
                </p>
              </section>

              <section className={styles.docSection} aria-labelledby="terms-contact">
                <h2 id="terms-contact">9. Contacto</h2>
                <p>
                  Para consultas relacionadas con estos términos o con el uso del servicio en su entorno, diríjase al{" "}
                  <strong>administrador de su organización</strong> o al <strong>canal de soporte definido en su acuerdo
                  contractual</strong> con el proveedor. No utilice este documento como sustituto de esos canales
                  oficiales.
                </p>
              </section>

              <p className={styles.docCrossLink}>
                Consulte también la{" "}
                <Link to="/privacy">Política de privacidad</Link>.
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
