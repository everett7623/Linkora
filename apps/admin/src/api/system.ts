import type { DeploymentCapabilities } from '@linkora/shared';
import { apiGet, getApiBase } from './client';

export function getAdminApiOrigin(): string {
  return getApiBase() || window.location.origin;
}

export function getDeploymentCapabilities(): Promise<DeploymentCapabilities> {
  return apiGet('/api/system/capabilities');
}
