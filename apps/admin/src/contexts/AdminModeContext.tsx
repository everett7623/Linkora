import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { normalizeAdminMode, type AdminMode } from '../utils/adminMode';

export type { AdminMode } from '../utils/adminMode';

interface AdminModeContextValue {
  mode: AdminMode;
  isAdvanced: boolean;
  setMode: (mode: AdminMode) => void;
}

const STORAGE_KEY = 'linkora_admin_mode';
const AdminModeContext = createContext<AdminModeContextValue | null>(null);

function readStoredMode(): AdminMode {
  try {
    return normalizeAdminMode(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'simple';
  }
}

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, updateMode] = useState<AdminMode>(readStoredMode);
  const setMode = useCallback((nextMode: AdminMode) => {
    updateMode(nextMode);
    try {
      localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // The current session still keeps the selected mode when storage is unavailable.
    }
  }, []);
  const value = useMemo(
    () => ({ mode, isAdvanced: mode === 'advanced', setMode }),
    [mode, setMode]
  );

  return <AdminModeContext.Provider value={value}>{children}</AdminModeContext.Provider>;
}

export function useAdminMode(): AdminModeContextValue {
  const context = useContext(AdminModeContext);
  if (!context) throw new Error('useAdminMode must be used within AdminModeProvider');
  return context;
}
