import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, checkMe, type AuthResult } from '../api/auth';
import { getApiBaseOverride, getBuildApiBase, setApiBaseOverride } from '../api/client';

interface AuthState {
  authenticated: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => Promise<AuthResult>;
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
    checkMe().then(async (result) => {
      const overrideApiBase = getApiBaseOverride();
      const buildApiBase = getBuildApiBase();
      if (
        result === 'unreachable' &&
        overrideApiBase &&
        buildApiBase &&
        overrideApiBase !== buildApiBase
      ) {
        const buildResult = await checkMe(buildApiBase);
        if (buildResult === 'authenticated') {
          setApiBaseOverride('');
          result = buildResult;
        }
      }
      setState({ authenticated: result === 'authenticated', loading: false });
      if (result === 'unauthorized') localStorage.removeItem('linkora_token');
    });
  }, []);

  const login = useCallback(async (token: string): Promise<AuthResult> => {
    localStorage.setItem('linkora_token', token);
    const result = await apiLogin(token);
    if (result === 'authenticated') {
      setState({ authenticated: true, loading: false });
    } else {
      localStorage.removeItem('linkora_token');
      setState({ authenticated: false, loading: false });
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('linkora_token');
    setState({ authenticated: false, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
