import { useCallback, useEffect, useRef } from "react";

const MAX_UNDO = 80;
const TYPING_DEBOUNCE_MS = 350;

/**
 * Deshacer / rehacer (agrupación corta de tecleo + mutaciones discretas).
 * @param {string} value
 * @param {(next: string) => void} onChange
 * @param {string} resetKey proyecto | contexto | nonce (cambio ⇒ historial limpio)
 */
export function useEvidenceMarkdownHistory(value, onChange, resetKey) {
  const liveRef = useRef(value);
  const committedRef = useRef(value);
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const debounceRef = useRef(null);
  const applyingRef = useRef(false);

  useEffect(() => {
    pastRef.current = [];
    futureRef.current = [];
    committedRef.current = value;
    liveRef.current = value;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    // Intencional: no depende de `value` en cada tecla; el reinicio es solo por resetKey (proyecto/contexto/nonce).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver comentario anterior
  }, [resetKey]);

  const flushTypingCommit = useCallback(() => {
    debounceRef.current = null;
    const live = liveRef.current;
    if (live === committedRef.current) return;
    pastRef.current.push(committedRef.current);
    if (pastRef.current.length > MAX_UNDO) pastRef.current.shift();
    futureRef.current = [];
    committedRef.current = live;
  }, []);

  const scheduleTypingCommit = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(flushTypingCommit, TYPING_DEBOUNCE_MS);
  }, [flushTypingCommit]);

  const onEditorChange = useCallback(
    (next) => {
      liveRef.current = next;
      onChange(next);
      scheduleTypingCommit();
    },
    [onChange, scheduleTypingCommit],
  );

  const prepareDiscreteMutation = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    flushTypingCommit();
  }, [flushTypingCommit]);

  const applyDiscrete = useCallback(
    (next) => {
      prepareDiscreteMutation();
      const prevLive = liveRef.current;
      if (next === prevLive) return;
      pastRef.current.push(committedRef.current);
      if (pastRef.current.length > MAX_UNDO) pastRef.current.shift();
      futureRef.current = [];
      committedRef.current = next;
      liveRef.current = next;
      onChange(next);
    },
    [onChange, prepareDiscreteMutation],
  );

  const undo = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    flushTypingCommit();
    if (pastRef.current.length === 0) return;
    const prev = pastRef.current.pop();
    futureRef.current.push(committedRef.current);
    committedRef.current = prev;
    liveRef.current = prev;
    applyingRef.current = true;
    onChange(prev);
  }, [flushTypingCommit, onChange]);

  const redo = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop();
    pastRef.current.push(committedRef.current);
    if (pastRef.current.length > MAX_UNDO) pastRef.current.shift();
    committedRef.current = next;
    liveRef.current = next;
    applyingRef.current = true;
    onChange(next);
  }, [onChange]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  /** Ecos de undo/redo: alinear refs sin otro efecto sobre `value`. */
  useEffect(() => {
    if (!applyingRef.current) return;
    applyingRef.current = false;
    committedRef.current = value;
    liveRef.current = value;
  }, [value]);

  return {
    onEditorChange,
    prepareDiscreteMutation,
    applyDiscrete,
    undo,
    redo,
  };
}
