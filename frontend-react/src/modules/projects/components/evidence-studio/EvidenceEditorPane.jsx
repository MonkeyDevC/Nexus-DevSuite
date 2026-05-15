/**
 * Panel editor: cromado único con mini navbar de formato y textarea con scroll propio.
 * La navbar queda fija encima del área que hace scroll (comportamiento estable en todos los navegadores).
 */
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import EvidenceEditorFormatToolbar from "./EvidenceEditorFormatToolbar.jsx";
import styles from "./EvidenceEditorPane.module.css";

const PLACEHOLDER = "Escribe evidencia técnica o pega capturas aquí…";

const MARKDOWN_IMAGE_LINE = (url) => `![descripción](${url})\n`;

export default forwardRef(function EvidenceEditorPane(
  {
    value,
    onChange,
    disabled,
    id,
    prepareDiscreteMutation,
    applyDiscrete,
    uploadImageFile,
    onUndo,
    onRedo,
    onImageUploadError,
    formatDisabled = false,
    onFormatAction,
  },
  ref,
) {
  const taRef = useRef(null);
  const [pasteBusy, setPasteBusy] = useState(false);

  const showFormatToolbar = typeof onFormatAction === "function";

  const focusTa = useCallback(() => {
    taRef.current?.focus();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focus: focusTa,
      getState() {
        const ta = taRef.current;
        if (!ta) return { text: value, selStart: 0, selEnd: 0 };
        return {
          text: value,
          selStart: ta.selectionStart,
          selEnd: ta.selectionEnd,
        };
      },
      getScrollTop() {
        return taRef.current?.scrollTop ?? 0;
      },
      /** Restaura selección y scroll del textarea. */
      setSelectionRange(start, end, scrollTopToRestore) {
        const ta = taRef.current;
        if (!ta) return;
        const st = scrollTopToRestore !== undefined ? scrollTopToRestore : ta.scrollTop;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              ta.setSelectionRange(start, end);
            } catch {
              /* ignore */
            }
            ta.scrollTop = st;
            try {
              ta.focus({ preventScroll: true });
            } catch {
              try {
                ta.focus();
              } catch {
                /* ignore */
              }
            }
          });
        });
      },
    }),
    [value, focusTa],
  );

  const handlePaste = useCallback(
    async (e) => {
      if (disabled || pasteBusy) return;
      const items = e.clipboardData?.files;
      if (!items || items.length === 0) return;

      let imageFile = null;
      for (let i = 0; i < items.length; i += 1) {
        const f = items[i];
        if (f.type && f.type.startsWith("image/")) {
          imageFile = f;
          break;
        }
      }
      if (!imageFile) return;
      if (
        typeof uploadImageFile !== "function" ||
        typeof prepareDiscreteMutation !== "function" ||
        typeof applyDiscrete !== "function"
      ) {
        e.preventDefault();
        onImageUploadError?.("Subida de imagen no disponible en este contexto.");
        return;
      }

      e.preventDefault();
      const ta = taRef.current;
      const selStart = ta ? ta.selectionStart : value.length;
      const selEnd = ta ? ta.selectionEnd : value.length;
      const scrollTopBefore = ta?.scrollTop ?? 0;
      const baseText = value;

      setPasteBusy(true);
      try {
        const { url } = await uploadImageFile(imageFile);
        if (!url || typeof url !== "string") {
          throw new Error("Respuesta de subida inválida");
        }
        prepareDiscreteMutation();
        const insert = MARKDOWN_IMAGE_LINE(url);
        const next = baseText.slice(0, selStart) + insert + baseText.slice(selEnd);
        applyDiscrete(next);
        const caret = selStart + insert.length;
        requestAnimationFrame(() => {
          const ta2 = taRef.current;
          if (!ta2) return;
          try {
            ta2.setSelectionRange(caret, caret);
          } catch {
            /* ignore */
          }
          ta2.scrollTop = scrollTopBefore;
          try {
            ta2.focus({ preventScroll: true });
          } catch {
            ta2.focus();
          }
        });
      } catch (err) {
        const msg = err && err.message ? String(err.message) : "Error al subir la imagen";
        onImageUploadError?.(msg);
      } finally {
        setPasteBusy(false);
      }
    },
    [
      disabled,
      pasteBusy,
      uploadImageFile,
      prepareDiscreteMutation,
      applyDiscrete,
      value,
      onImageUploadError,
    ],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (disabled) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
        return;
      }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        onRedo?.();
      }
    },
    [disabled, onUndo, onRedo],
  );

  const busy = disabled || pasteBusy;

  return (
    <div className={styles.pane} data-testid="evidence-editor-pane">
      <div className={styles.editorChrome}>
        {showFormatToolbar ? (
          <div className={styles.editorNav}>
            <EvidenceEditorFormatToolbar
              embedded
              formatDisabled={formatDisabled}
              onAction={onFormatAction}
            />
          </div>
        ) : null}
        <textarea
          ref={taRef}
          id={id}
          className={styles.textarea}
          value={value}
          onChange={(ev) => {
            if (!disabled) onChange(ev.target.value);
          }}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          disabled={busy}
          placeholder={PLACEHOLDER}
          aria-label="Editor de evidencia en Markdown"
          spellCheck
        />
        {pasteBusy ? (
          <p className={styles.uploadHint} data-evidence-upload-hint="true">
            Subiendo imagen…
          </p>
        ) : null}
      </div>
    </div>
  );
});
