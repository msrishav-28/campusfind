export function nowIso(): string {
  return new Date().toISOString();
}

export function plusDaysIso(baseIso: string, days: number): string {
  const base = new Date(baseIso);
  base.setDate(base.getDate() + days);
  return base.toISOString();
}

export function hoursBetween(aIso: string, bIso: string): number {
  return Math.abs(new Date(aIso).getTime() - new Date(bIso).getTime()) / (1000 * 60 * 60);
}

export function formatTimeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(Math.max(0, diffMs) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
