export interface TradeoffRow {
  id: string;
  label: string;
  hours: number;
}

export const DEFAULT_TRADEOFF_ROWS: TradeoffRow[] = [
  { id: 'fixed-1', label: 'Fixed 1 server', hours: 24 },
  { id: 'fixed-4', label: 'Fixed 4 servers', hours: 96 },
  { id: 'auto', label: 'Auto-scale 1 to 4', hours: 30 },
];

export function tradeoffCost(hours: number, rate: number): number {
  return hours * rate;
}

export function percentDifference(value: number, base: number): number {
  if (base === 0) return 0;
  return ((value - base) / base) * 100;
}
