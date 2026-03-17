import { createContext, useContext, useMemo, useState } from 'react';
import {
  buildSessionSnapshot,
  clearSessionAuth,
  persistSessionAuth,
  resolveAuthRole,
  resolveAuthToken,
} from '../utils/authSession';

const AuthContext = createContext(null);

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
