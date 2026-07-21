import { useCallback, useEffect, useRef } from 'react';

export const SUCCESS_RELOAD_DELAY_MS = 500;
export const FINALIZING_RELOAD_DELAY_MS = 4_000;

export function useUpgradeReload() {
  const timerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const deadlineRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) globalThis.clearTimeout(timerRef.current);
      deadlineRef.current = null;
    },
    []
  );

  return useCallback((delayMs: number) => {
    const deadline = Date.now() + delayMs;
    if (deadlineRef.current !== null && deadlineRef.current <= deadline) return;
    if (timerRef.current !== null) globalThis.clearTimeout(timerRef.current);
    deadlineRef.current = deadline;
    timerRef.current = globalThis.setTimeout(() => {
      timerRef.current = null;
      deadlineRef.current = null;
      window.location.reload();
    }, delayMs);
  }, []);
}
