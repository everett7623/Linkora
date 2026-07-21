export const GLOBAL_DISTRIBUTION_COLORS = [
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-orange-500',
  'bg-fuchsia-500',
  'bg-teal-500',
] as const;

export const WORLD_TRAFFIC_COLORS = [
  'rgb(13 148 136)',
  'rgb(6 182 212)',
  'rgb(14 165 233)',
  'rgb(59 130 246)',
  'rgb(79 70 229)',
  'rgb(124 58 237)',
  'rgb(192 38 211)',
  'rgb(225 29 72)',
  'rgb(234 88 12)',
  'rgb(245 158 11)',
] as const;

export function globalDistributionColor(index: number): string {
  const normalizedIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  return GLOBAL_DISTRIBUTION_COLORS[normalizedIndex % GLOBAL_DISTRIBUTION_COLORS.length];
}

export function worldTrafficColor(value: number, max: number): string {
  if (value <= 0) return 'rgb(30 41 59)';
  const ratio = Math.min(1, value / Math.max(max, 1));
  const index = Math.min(WORLD_TRAFFIC_COLORS.length - 1, Math.ceil(ratio * 10) - 1);
  return WORLD_TRAFFIC_COLORS[index];
}
