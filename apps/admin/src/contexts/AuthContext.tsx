import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, checkMe } from '../api/auth';

interface AuthState {
  authenticated: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ authenticated: false, loading: true });

  useEffect(() => {
    const stored = localStorage.getItem('linkora_token');
    if (!stored) {
      setState({ authenticated: false, loading: false });
      return;
    }
    checkMe().then((ok) => {
      setState({ authenticated: ok, loading: false });
      if (!ok) localStorage.removeItem('linkora_token');
    });
  }, []);

  const login = useCallback(async (token: string): Promise<boolean> => {
    localStorage.setItem('linkora_token', token);
    const ok = await apiLogin(token);
    if (ok) {
      setState({ authenticated: true, loading: false });
    } else {
      localStorage.removeItem('linkora_token');
      setState({ authenticated: false, loading: false });
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('linkora_token');
    setState({ authenticated: false, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
