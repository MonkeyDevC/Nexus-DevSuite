/**
 * Vista 403 dentro del layout principal (usuario autenticado sin autorización).
 */
import { Link } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import styles from "./ForbiddenPage.module.css";

export default function ForbiddenPage({ title, message }) {
  return (
    <div className={styles.root} data-testid="forbidden-root">
      <Breadcrumb items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Acceso denegado" }]} />
      <div className={styles.card}>
        <h3 className={styles.title}>{title || "Acceso denegado"}</h3>
        <p className={styles.text}>
          {message ||
            "No tienes permisos para ver esta sección. Si crees que es un error, contacta a un administrador."}
        </p>
        <Link className={styles.cta} to="/dashboard">
          Volver al panel
        </Link>
      </div>
    </div>
  );
}
