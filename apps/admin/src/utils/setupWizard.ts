export interface SetupWizardState {
  apiReady: boolean;
  domainReady: boolean;
  linkReady: boolean;
  completed: number;
  ready: boolean;
}

export function getSetupWizardState(
  apiReady: boolean,
  defaultDomain: string,
  totalLinks: number
): SetupWizardState {
  const domainReady = defaultDomain.trim().length > 0;
  const linkReady = Number.isFinite(totalLinks) && totalLinks > 0;
  const completed = [apiReady, domainReady, linkReady].filter(Boolean).length;
  return { apiReady, domainReady, linkReady, completed, ready: completed === 3 };
}
