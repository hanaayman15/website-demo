export function getStorage(kind = 'local') {
  try {
    if (kind === 'session') {
      return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    }
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function safeGet(storage, key, fallback = '') {
  try {
    if (storage && typeof storage.getItem === 'function') {
      const value = storage.getItem(key);
      return value == null ? fallback : value;
    }
  } catch {
    // Ignore storage access errors in restricted runtimes.
  }
  return fallback;
}

export function safeSet(storage, key, value) {
  try {
    if (storage && typeof storage.setItem === 'function') {
      storage.setItem(key, String(value));
      return true;
    }
  } catch {
    // Ignore storage write errors in restricted runtimes.
  }
  return false;
}

export function safeRemove(storage, key) {
  try {
    if (storage && typeof storage.removeItem === 'function') {
      storage.removeItem(key);
      return true;
    }
  } catch {
    // Ignore storage delete errors in restricted runtimes.
  }
  return false;
}

export function safeJsonGet(storage, key, fallback = null) {
  const raw = safeGet(storage, key, '');
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function safeJsonSet(storage, key, value) {
  try {
    return safeSet(storage, key, JSON.stringify(value));
  } catch {
    return false;
  }
}
