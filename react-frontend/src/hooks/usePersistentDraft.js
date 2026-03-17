import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStorage, safeJsonGet, safeJsonSet, safeRemove } from '../utils/storageSafe';

export function usePersistentDraft({ key, initialValue = null, enabled = true, debounceMs = 220 }) {
  const local = useMemo(() => getStorage('local'), []);

  const [draft, setDraftState] = useState(() => {
    if (!enabled || !key) return initialValue;
    return safeJsonGet(local, key, initialValue);
  });

  useEffect(() => {
    if (!enabled || !key) {
      setDraftState(initialValue);
      return;
    }
    setDraftState(safeJsonGet(local, key, initialValue));
  }, [enabled, initialValue, key, local]);

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
    setDraftState(initialValue);
  }, [enabled, initialValue, key, local]);

  return {
    draft,
    setDraft,
    clearDraft,
    hasDraft: Boolean(draft && typeof draft === 'object' && Object.keys(draft).length > 0),
  };
}
