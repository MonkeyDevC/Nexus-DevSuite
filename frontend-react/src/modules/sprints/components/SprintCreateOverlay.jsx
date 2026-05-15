import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DetailWorkspaceShell } from "../../projects/components/workspace/DetailWorkspaceShell.jsx";
import WorkspaceHeader from "../../projects/components/workspace/WorkspaceHeader.jsx";
import { WorkspaceFooter } from "../../projects/components/workspace/WorkspaceFooter.jsx";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import { Input } from "../../../design-system/components/Input/Input.jsx";
import { Textarea } from "../../../design-system/components/Textarea/Textarea.jsx";
import AlertDialog from "../../../design-system/components/AlertDialog/AlertDialog.jsx";
import * as sprintApi from "../sprintsService.js";
import styles from "./SprintCreateOverlay.module.css";

const MSG_CREATE_FAIL = "No se pudo crear el sprint.";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** @param {number} y @param {number} m0 0-11 @param {number} d */
export function toIsoDateLocal(y, m0, d) {
  const mm = String(m0 + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/** @param {string} iso */
export function parseIsoLocal(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso == null ? "" : String(iso).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

/** @param {string} isoStart @param {string} isoEnd */
export function inclusiveDayCount(isoStart, isoEnd) {
  const a = parseIsoLocal(isoStart);
  const b = parseIsoLocal(isoEnd);
  if (!a || !b) return 0;
  const ms = 24 * 3600 * 1000;
  return Math.round((b.getTime() - a.getTime()) / ms) + 1;
}

/** @param {string} a0 @param {string} b0 */
export function intervalsOverlapInclusive(a0, a1, b0, b1) {
  if (!a0 || !a1 || !b0 || !b1) return false;
  return a0 <= b1 && b0 <= a1;
}

/**
 * @param {object} sp
 * @returns {{ id: string, name: string, start: string, end: string, status: string } | null}
 */
function sprintToInterval(sp) {
  if (!sp || typeof sp !== "object") return null;
  const s = sp.start_date != null ? String(sp.start_date).slice(0, 10) : "";
  const e = sp.end_date != null ? String(sp.end_date).slice(0, 10) : "";
  if (!s || !e || s > e) return null;
  const id = sp.id != null ? String(sp.id).trim() : "";
  if (!id) return null;
  const name = sp.name != null ? String(sp.name).trim() : "Sprint";
  const status = sp.status != null ? String(sp.status) : "";
  return { id, name, start: s, end: e, status };
}

/**
 * @param {string|null} selStart
 * @param {string|null} selEnd
 * @param {object[]} sprints
 */
export function findSprintDateConflicts(selStart, selEnd, sprints) {
  if (!selStart || !selEnd) return [];
  const lo = selStart <= selEnd ? selStart : selEnd;
  const hi = selStart <= selEnd ? selEnd : selStart;
  /** @type {{ id: string, name: string, start: string, end: string, status: string }[]} */
  const out = [];
  const list = Array.isArray(sprints) ? sprints : [];
  for (const sp of list) {
    const iv = sprintToInterval(sp);
    if (!iv) continue;
    if (intervalsOverlapInclusive(lo, hi, iv.start, iv.end)) {
      out.push(iv);
    }
  }
  return out;
}

/** Prioridad visual si varios sprints cubren el mismo día: en curso > planificado > cerrado */
function dominantStatusForDay(dayIso, sprints) {
  const list = Array.isArray(sprints) ? sprints : [];
  let best = null;
  let rank = -1;
  for (const sp of list) {
    const iv = sprintToInterval(sp);
    if (!iv || dayIso < iv.start || dayIso > iv.end) continue;
    const st = iv.status;
    let r = 0;
    if (st === "IN_PROGRESS") r = 3;
    else if (st === "PLANNED") r = 2;
    else if (st === "CLOSED") r = 1;
    else r = 0;
    if (r > rank) {
      rank = r;
      best = st;
    }
  }
  return best;
}

/**
 * @param {{
 *   project: { id: string, name?: string },
 *   sprints: object[],
 *   breadcrumbItems: { label: string, path?: string }[],
 *   onClose: () => void,
 *   onCreated?: (created: object) => void,
 *   disabled?: boolean,
 * }} props
 */
export default function SprintCreateOverlay({ project, sprints, breadcrumbItems, onClose, onCreated, disabled = false }) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [capacityPoints, setCapacityPoints] = useState("");
  const [visibleYear, setVisibleYear] = useState(() => new Date().getFullYear());
  const [visibleMonth0, setVisibleMonth0] = useState(() => new Date().getMonth());
  /** Rango lógico: end null = falta segundo click (modo dos clics) */
  const [rangeDraft, setRangeDraft] = useState(() => ({ start: null, end: null }));
  const [dragging, setDragging] = useState(() => ({ active: false, anchor: null, hover: null }));

  const [saving, setSaving] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const suppressNextDayClickRef = useRef(false);

  const normalizedRange = useMemo(() => {
    const s = rangeDraft.start;
    const e = rangeDraft.end;
    if (!s) return { start: null, end: null };
    if (!e) return { start: s, end: s };
    const lo = s <= e ? s : e;
    const hi = s <= e ? e : s;
    return { start: lo, end: hi };
  }, [rangeDraft.start, rangeDraft.end]);

  const displayRange = useMemo(() => {
    if (dragging.active && dragging.anchor) {
      const h = dragging.hover != null ? dragging.hover : dragging.anchor;
      const lo = dragging.anchor <= h ? dragging.anchor : h;
      const hi = dragging.anchor <= h ? h : dragging.anchor;
      return { start: lo, end: hi };
    }
    return normalizedRange;
  }, [dragging.active, dragging.anchor, dragging.hover, normalizedRange]);

  const conflicts = useMemo(
    () => findSprintDateConflicts(displayRange.start, displayRange.end, sprints),
    [displayRange.start, displayRange.end, sprints]
  );
  const hasConflict = conflicts.length > 0;
  const durationDays =
    displayRange.start && displayRange.end ? inclusiveDayCount(displayRange.start, displayRange.end) : 0;

  const canSubmit = useMemo(() => {
    if (disabled || saving) return false;
    if (!project?.id || !name.trim()) return false;
    if (!displayRange.start || !displayRange.end) return false;
    if (hasConflict) return false;
    return true;
  }, [disabled, saving, project, name, displayRange.start, displayRange.end, hasConflict]);

  const monthLabel = useMemo(() => {
    const d = new Date(visibleYear, visibleMonth0, 1);
    return d.toLocaleString("es", { month: "long", year: "numeric" });
  }, [visibleYear, visibleMonth0]);

  const calendarCells = useMemo(() => {
    const first = new Date(visibleYear, visibleMonth0, 1);
    const startPad = (first.getDay() + 6) % 7;
    const dim = new Date(visibleYear, visibleMonth0 + 1, 0).getDate();
    /** @type {{ key: string, inMonth: boolean, day: number }[]} */
    const cells = [];
    for (let i = 0; i < startPad; i += 1) {
      cells.push({ key: `pad-${visibleYear}-${visibleMonth0}-${i}`, inMonth: false, day: 0 });
    }
    for (let day = 1; day <= dim; day += 1) {
      cells.push({
        key: toIsoDateLocal(visibleYear, visibleMonth0, day),
        inMonth: true,
        day,
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ key: `trail-${cells.length}`, inMonth: false, day: 0 });
    }
    return cells;
  }, [visibleYear, visibleMonth0]);

  const goPrevMonth = useCallback(() => {
    setVisibleMonth0((m) => {
      if (m > 0) return m - 1;
      setVisibleYear((y) => y - 1);
      return 11;
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setVisibleMonth0((m) => {
      if (m < 11) return m + 1;
      setVisibleYear((y) => y + 1);
      return 0;
    });
  }, []);

  const commitDragRange = useCallback((anchor, hover) => {
    if (!anchor || !hover) return;
    const lo = anchor <= hover ? anchor : hover;
    const hi = anchor <= hover ? hover : anchor;
    setRangeDraft({ start: lo, end: hi });
  }, []);

  useEffect(() => {
    if (!dragging.active) return undefined;
    const onUp = () => {
      setDragging((d) => {
        if (d.active && d.anchor) {
          const h = d.hover != null ? d.hover : d.anchor;
          if (h !== d.anchor) {
            commitDragRange(d.anchor, h);
            suppressNextDayClickRef.current = true;
          }
        }
        return { active: false, anchor: null, hover: null };
      });
    };
    window.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onUp);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onUp);
    };
  }, [dragging.active, commitDragRange]);

  const onDayClick = useCallback((iso) => {
    if (!iso || disabled || saving) return;
    if (suppressNextDayClickRef.current) {
      suppressNextDayClickRef.current = false;
      return;
    }
    setRangeDraft((prev) => {
      if (!prev.start || prev.end != null) {
        return { start: iso, end: null };
      }
      const lo = prev.start <= iso ? prev.start : iso;
      const hi = prev.start <= iso ? iso : prev.start;
      return { start: lo, end: hi };
    });
  }, [disabled, saving]);

  const onDayMouseDown = useCallback(
    (iso) => {
      if (!iso || disabled || saving) return;
      setDragging({ active: true, anchor: iso, hover: iso });
    },
    [disabled, saving]
  );

  const onDayMouseEnter = useCallback((iso) => {
    if (!iso) return;
    setDragging((d) => {
      if (!d.active || !d.anchor) return d;
      return { ...d, hover: iso };
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!canSubmit || !project?.id) return;
    setSaving(true);
    setErrorMessage("");
    try {
      const created = await sprintApi.createSprint({
        projectId: project.id,
        name: name.trim(),
        goal: goal.trim() || undefined,
        start_date: normalizedRange.start,
        end_date: normalizedRange.end,
      });
      if (typeof onCreated === "function") onCreated(created);
    } catch (e) {
      const msg = e && e.message ? String(e.message) : MSG_CREATE_FAIL;
      setErrorMessage(msg);
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  }, [canSubmit, project, name, goal, normalizedRange.start, normalizedRange.end, onCreated]);

  function dayCellClassName(iso, inMonth) {
    if (!inMonth) return [styles.dayCell, styles.dayCellMuted].join(" ");
    const tiers = [];
    const st = dominantStatusForDay(iso, sprints);
    if (st === "CLOSED") tiers.push(styles.existingClosed);
    else if (st === "IN_PROGRESS") tiers.push(styles.existingActive);
    else if (st === "PLANNED") tiers.push(styles.existingPlanned);

    const inDisplay =
      displayRange.start &&
      displayRange.end &&
      iso >= displayRange.start &&
      iso <= displayRange.end;
    if (inDisplay) {
      if (hasConflict) tiers.push(styles.rangeConflict);
      else tiers.push(styles.rangeSelected);
      if (iso === displayRange.start || iso === displayRange.end) tiers.push(styles.rangeEndpoints);
    }

    return [styles.dayCell, ...tiers].join(" ");
  }

  return (
    <div className={styles.backdrop} role="presentation" data-testid="sprint-create-overlay-backdrop">
      <div
        className={styles.shellWrap}
        role="dialog"
        aria-modal="true"
        aria-label="Crear sprint"
        data-testid="sprint-create-overlay"
      >
        <DetailWorkspaceShell
          depth={1}
          rootDataTestId="sprint-create-shell"
          header={
            <WorkspaceHeader
              kicker="Planificación"
              breadcrumbItems={breadcrumbItems}
              breadcrumbDataTestId="breadcrumb-sprint-create-overlay"
              title="Nuevo sprint"
              onRequestClose={onClose}
              closeAriaLabel="Cerrar creación de sprint"
              closeDisabled={saving}
            />
          }
          chrome={null}
          footer={
            <WorkspaceFooter>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: "var(--ds-space-2)" }}>
                <div />
                <div style={{ display: "flex", gap: "var(--ds-space-2)" }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={saving}
                    data-testid="sprint-create-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCreate}
                    disabled={!canSubmit}
                    aria-busy={saving}
                    data-testid="sprint-create-submit"
                  >
                    {saving ? "Creando…" : "Crear sprint"}
                  </Button>
                </div>
              </div>
            </WorkspaceFooter>
          }
        >
          <AlertDialog
            isOpen={errorOpen}
            tone="error"
            title="No se pudo crear"
            description={errorMessage || MSG_CREATE_FAIL}
            confirmLabel="Entendido"
            cancelLabel=""
            onCancel={() => setErrorOpen(false)}
            onConfirm={() => setErrorOpen(false)}
          />

          <div className={styles.body} data-testid="sprint-create-form">
            {hasConflict ? (
              <div
                className={[styles.geminiPanel, styles.geminiPanelDanger].join(" ")}
                role="alert"
                data-testid="sprint-create-conflict-panel"
              >
                <div className={styles.geminiIcon} aria-hidden>
                  !
                </div>
                <div className={styles.geminiBody}>
                  <p className={styles.geminiTitle}>Las fechas se solapan con sprints existentes</p>
                  <p>Ajusta el rango en el calendario o modifica los sprints que chocan antes de crear.</p>
                  <ul className={styles.geminiList}>
                    {conflicts.map((c) => (
                      <li key={c.id}>
                        <strong>{c.name}</strong>
                        {" · "}
                        {c.start} → {c.end}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className={styles.geminiPanel} data-testid="sprint-create-hint-panel">
                <div className={styles.geminiIcon} aria-hidden>
                  i
                </div>
                <div className={styles.geminiBody}>
                  <p className={styles.geminiTitle}>Planificación visual</p>
                  <p>
                    Haz dos clics para definir inicio y fin, o arrastra entre días. Los sprint cerrados, en curso y
                    planificados se muestran con colores distintos.
                  </p>
                </div>
              </div>
            )}

            <div className={styles.gridMain}>
              <div className={styles.fieldStack}>
                <Input
                  label="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={disabled || saving}
                  maxLength={500}
                  data-testid="sprint-create-name"
                />
                <Textarea
                  label="Objetivo"
                  rows={5}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  disabled={disabled || saving}
                  data-testid="sprint-create-goal"
                />
                <Input
                  label="Capacidad (story points, opcional)"
                  type="number"
                  min={0}
                  step={1}
                  value={capacityPoints}
                  onChange={(e) => setCapacityPoints(e.target.value)}
                  disabled={disabled || saving}
                  data-testid="sprint-create-capacity"
                />
              </div>

              <div className={styles.fieldStack}>
                <div className={styles.summaryCard} data-testid="sprint-create-summary">
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Duración</span>
                    <span className={styles.summaryValue}>
                      {durationDays > 0 ? `${durationDays} día(s)` : "—"}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Estado al crear</span>
                    <span className={styles.summaryValue}>PLANNED</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Solapamiento</span>
                    <span className={styles.summaryValue}>{hasConflict ? "Sí" : "No"}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Inicio / fin</span>
                    <span className={styles.summaryValue}>
                      {displayRange.start && displayRange.end
                        ? `${displayRange.start} → ${displayRange.end}`
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className={styles.calendarCard}>
                  <div className={styles.calendarToolbar}>
                    <Button type="button" variant="outline" onClick={goPrevMonth} disabled={saving}>
                      ←
                    </Button>
                    <span className={styles.monthLabel}>{monthLabel}</span>
                    <Button type="button" variant="outline" onClick={goNextMonth} disabled={saving}>
                      →
                    </Button>
                  </div>
                  <div className={styles.weekdays}>
                    {WEEKDAY_LABELS.map((w) => (
                      <div key={w} className={styles.weekday}>
                        {w}
                      </div>
                    ))}
                  </div>
                  <div className={styles.days}>
                    {calendarCells.map((cell) => {
                      if (!cell.inMonth) {
                        return <div key={cell.key} className={dayCellClassName("", false)} />;
                      }
                      const iso = cell.key;
                      return (
                        <button
                          key={cell.key}
                          type="button"
                          className={dayCellClassName(iso, true)}
                          onClick={() => onDayClick(iso)}
                          onMouseDown={() => onDayMouseDown(iso)}
                          onMouseEnter={() => onDayMouseEnter(iso)}
                          disabled={disabled || saving}
                          data-day-iso={iso}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                  </div>
                  <div className={styles.legend}>
                    <span className={styles.legendItem}>
                      <span className={styles.legendSwatch} style={{ background: "var(--ds-color-text-muted)" }} />
                      Cerrado
                    </span>
                    <span className={styles.legendItem}>
                      <span className={styles.legendSwatch} style={{ background: "var(--ds-color-success-muted)" }} />
                      En curso
                    </span>
                    <span className={styles.legendItem}>
                      <span
                        className={styles.legendSwatch}
                        style={{ background: "var(--ds-color-primary-muted, rgba(99, 102, 241, 0.35))" }}
                      />
                      Planificado
                    </span>
                    <span className={styles.legendItem}>
                      <span
                        className={styles.legendSwatch}
                        style={{ background: "var(--ds-color-danger-muted, #fecaca)", borderColor: "#dc2626" }}
                      />
                      Conflicto
                    </span>
                  </div>
                  <p className={styles.hint}>
                    Primer clic: inicio del rango. Segundo clic: fin. También puedes mantener pulsado y arrastrar hasta
                    otra fecha.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DetailWorkspaceShell>
      </div>
    </div>
  );
}
