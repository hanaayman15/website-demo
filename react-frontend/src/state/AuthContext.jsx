import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  buildSessionSnapshot,
  clearSessionAuth,
  persistSessionAuth,
  resolveAuthRole,
  resolveAuthToken,
} from '../utils/authSession';

const AuthContext = createContext(null);
const AUTH_SESSION_UPDATED_EVENT = 'auth-session-updated';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => buildSessionSnapshot());

  const refreshSession = () => {
    setSession(buildSessionSnapshot());
  };

  const loginSession = (payload) => {
    persistSessionAuth(payload);
    refreshSession();
  };

  const logoutSession = () => {
    clearSessionAuth();
    refreshSession();
  };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return undefined;
    }

    const handleSessionUpdate = () => {
      refreshSession();
    };

    window.addEventListener('storage', handleSessionUpdate);
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);

    return () => {
      window.removeEventListener('storage', handleSessionUpdate);
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      refreshSession,
      loginSession,
      logoutSession,
      getToken: resolveAuthToken,
      getRole: resolveAuthRole,
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider.');
  }
  return context;
}
