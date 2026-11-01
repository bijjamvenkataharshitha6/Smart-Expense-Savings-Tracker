import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "smartspend-token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    authApi.me(token).then((profile) => {
      if (active) setUser(profile);
    }).catch(() => {
      if (active) signOut();
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [token, signOut]);

  const acceptSession = useCallback((session) => {
    localStorage.setItem(TOKEN_KEY, session.access_token);
    setToken(session.access_token);
    setUser(session.user);
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    loading,
    signIn: async (values) => acceptSession(await authApi.login(values)),
    register: async (values) => acceptSession(await authApi.register(values)),
    signOut
  }), [token, user, loading, acceptSession, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
