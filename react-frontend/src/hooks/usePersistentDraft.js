import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStorage, safeJsonGet, safeJsonSet, safeRemove } from '../utils/storageSafe';

export function usePersistentDraft({ key, initialValue = null, enabled = true, debounceMs = 220 }) {
  const local = useMemo(() => getStorage('local'), []);
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  const [draft, setDraftState] = useState(() => {
    if (!enabled || !key) return initialValueRef.current;
    return safeJsonGet(local, key, initialValueRef.current);
  });

  useEffect(() => {
    if (!enabled || !key) {
      setDraftState(initialValueRef.current);
      return;
    }
    setDraftState(safeJsonGet(local, key, initialValueRef.current));
  }, [enabled, key, local]);

  useEffect(() => {
    if (!enabled || !key) return;
    const timeoutId = setTimeout(() => {
      safeJsonSet(local, key, draft);
    }, debounceMs);
    return () => clearTimeout(timeoutId);
  }, [debounceMs, draft, enabled, key, local]);

  const setDraft = useCallback((nextValue) => {
    setDraftState(nextValue);
  }, []);

  const clearDraft = useCallback(() => {
    if (enabled && key) {
      safeRemove(local, key);
    }
    setDraftState(initialValueRef.current);
  }, [enabled, key, local]);

  return {
    draft,
    setDraft,
    clearDraft,
    hasDraft: Boolean(draft && typeof draft === 'object' && Object.keys(draft).length > 0),
  };
}
