import { useId } from "react";
import { Badge } from "../../../../../design-system/components/Badge/Badge.jsx";
import styles from "./RangeField.module.css";

function clampNumber(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

/**
 * Slider de rango (input[type=range]) estilado localmente.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {number} props.value
 * @param {number} props.min
 * @param {number} props.max
 * @param {number} [props.step]
 * @param {string} [props.unit]
 * @param {boolean} [props.disabled]
 * @param {string} [props.hint]
 * @param {(nextValue: number) => void} props.onChange
 */
export default function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  disabled = false,
  hint = "",
  onChange,
}) {
  const uid = useId();
  const id = `dev-data-range-${uid}`;
  const safe = clampNumber(value, min, max);
  const pct = max > min ? ((safe - min) / (max - min)) * 100 : 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <Badge variant="neutral" appearance="light" className={styles.valueBadge} title={`${safe}${unit}`}>
          {safe}
          {unit}
        </Badge>
      </div>

      <div className={styles.rangeRow}>
        <span className={styles.minMax}>{min}</span>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={safe}
          disabled={disabled}
          className={styles.range}
          style={{ ["--pct"]: `${pct}%` }}
          onChange={(e) => onChange(clampNumber(e.target.value, min, max))}
        />
        <span className={styles.minMax}>{max}</span>
      </div>

      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}
