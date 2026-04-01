/**
 * ----
 * Modulo: Form
 * Descripcion: Formulario dinámico controlado por fields; mantiene estado interno y emite data en submit.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import { useMemo, useState } from "react";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import { Input } from "../../../design-system/components/Input/Input.jsx";
import styles from "./Form.module.css";

function buildInitialValues(fields) {
  const init = {};
  (Array.isArray(fields) ? fields : []).forEach((f) => {
    if (!f || !f.name) return;
    init[f.name] = f.defaultValue ?? "";
  });
  return init;
}

export default function Form({ fields = [], onSubmit, submitLabel }) {
  const safeFields = useMemo(() => (Array.isArray(fields) ? fields : []), [fields]);
  const [values, setValues] = useState(() => buildInitialValues(safeFields));
  const [errorMessage, setErrorMessage] = useState("");

  function onChangeField(name, nextValue) {
    setValues((prev) => ({ ...prev, [name]: nextValue }));
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const hasRequiredEmpty = safeFields.some((f) => f?.required && !String(values[f.name] ?? "").trim());
        if (hasRequiredEmpty) {
          setErrorMessage("Completa los campos requeridos.");
          return;
        }

        setErrorMessage("");
        if (typeof onSubmit === "function") {
          const result = await onSubmit(values);
          if (result !== false) {
            setValues(buildInitialValues(safeFields));
          }
        } else {
          setValues(buildInitialValues(safeFields));
        }
      }}
    >
      {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}
      {safeFields.map((f) => {
        const id = `field-${f.name}`;
        const type = f.type || "text";
        const value = values[f.name] ?? "";
        return (
          <div className={styles.fieldBlock} key={f.name}>
            <Input
              id={id}
              name={f.name}
              type={type}
              label={f.label || f.name}
              value={value}
              required={Boolean(f.required)}
              onChange={(e) => onChangeField(f.name, e.target.value)}
            />
          </div>
        );
      })}
      <Button type="submit" variant="primary">
        {submitLabel || "Enviar"}
      </Button>
    </form>
  );
}
