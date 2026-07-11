export const DEFAULT_HEALTH_FAILURE_THRESHOLD = 2;
export const DEFAULT_HEALTH_SUPPRESSION_MINUTES = 1440;

export interface HealthAlertState {
  failures: Record<string, number>;
  alerted: string[];
  lastAlertAt?: string;
}

export interface HealthAlertDecision {
  nextState: HealthAlertState;
  notifyFailure: boolean;
  newlyFailed: string[];
  recovered: string[];
}

export function parseHealthAlertState(value?: string): HealthAlertState {
  if (!value) return { failures: {}, alerted: [] };
  try {
    const parsed = JSON.parse(value) as Partial<HealthAlertState>;
    return {
      failures:
        parsed.failures && typeof parsed.failures === 'object' ? parsed.failures : {},
      alerted: Array.isArray(parsed.alerted)
        ? parsed.alerted.filter((id): id is string => typeof id === 'string')
        : [],
      ...(typeof parsed.lastAlertAt === 'string' ? { lastAlertAt: parsed.lastAlertAt } : {}),
    };
  } catch {
    return { failures: {}, alerted: [] };
  }
}

export function normalizeFailureThreshold(value?: string): number {
  const parsed = Number.parseInt(value ?? String(DEFAULT_HEALTH_FAILURE_THRESHOLD), 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 10
    ? parsed
    : DEFAULT_HEALTH_FAILURE_THRESHOLD;
}

export function normalizeSuppressionMinutes(value?: string): number {
  const parsed = Number.parseInt(value ?? String(DEFAULT_HEALTH_SUPPRESSION_MINUTES), 10);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10080
    ? parsed
    : DEFAULT_HEALTH_SUPPRESSION_MINUTES;
}

export function evaluateHealthAlerts(
  checkedIds: string[],
  failedIds: string[],
  previous: HealthAlertState,
  threshold: number,
  suppressionMinutes: number,
  evaluatedAt: string
): HealthAlertDecision {
  const failedSet = new Set(failedIds);
  const checkedSet = new Set(checkedIds);
  const previousAlerted = new Set(previous.alerted);
  const failures = { ...previous.failures };

  for (const id of checkedSet) {
    if (failedSet.has(id)) failures[id] = (failures[id] ?? 0) + 1;
    else delete failures[id];
  }

  const newlyFailed = failedIds.filter(
    (id) => (failures[id] ?? 0) >= threshold && !previousAlerted.has(id)
  );
  const recovered = previous.alerted.filter((id) => checkedSet.has(id) && !failedSet.has(id));
  const alerted = [
    ...previous.alerted.filter((id) => !checkedSet.has(id)),
    ...failedIds.filter((id) => previousAlerted.has(id) || (failures[id] ?? 0) >= threshold),
  ];
  const lastAlertMs = previous.lastAlertAt ? Date.parse(previous.lastAlertAt) : Number.NaN;
  const suppressionElapsed =
    suppressionMinutes === 0 ||
    !Number.isFinite(lastAlertMs) ||
    Date.parse(evaluatedAt) - lastAlertMs >= suppressionMinutes * 60_000;
  const notifyFailure = newlyFailed.length > 0 || (alerted.length > 0 && suppressionElapsed);

  return {
    notifyFailure,
    newlyFailed,
    recovered,
    nextState: {
      failures,
      alerted,
      ...(notifyFailure
        ? { lastAlertAt: evaluatedAt }
        : previous.lastAlertAt
          ? { lastAlertAt: previous.lastAlertAt }
          : {}),
    },
  };
}
