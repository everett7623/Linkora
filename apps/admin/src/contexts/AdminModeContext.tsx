import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { resolveInitialAdminMode, type AdminMode } from '../utils/adminMode';
import { readBrowserSetting, writeBrowserSetting } from '../utils/browserStorage';
import { IS_PUBLIC_DEMO } from '../config/demo';

export type { AdminMode } from '../utils/adminMode';

interface AdminModeContextValue {
  mode: AdminMode;
  isAdvanced: boolean;
  setMode: (mode: AdminMode) => void;
}

const AdminModeContext = createContext<AdminModeContextValue | null>(null);

function readStoredMode(): AdminMode {
  try {
    return resolveInitialAdminMode(readBrowserSetting('adminMode'), IS_PUBLIC_DEMO);
  } catch {
    return resolveInitialAdminMode(null, IS_PUBLIC_DEMO);
  }
}

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, updateMode] = useState<AdminMode>(readStoredMode);
  const setMode = useCallback((nextMode: AdminMode) => {
    updateMode(nextMode);
    try {
      writeBrowserSetting('adminMode', nextMode);
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
