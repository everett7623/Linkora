export interface DeploymentCapabilities {
  profile: 'basic' | 'advanced';
  core: {
    d1: true;
    kv: true;
  };
  advanced: {
    r2Backups: boolean;
    visitQueue: boolean;
    configuredDomains: number;
    multipleDomains: boolean;
  };
}
