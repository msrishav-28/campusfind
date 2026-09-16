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
