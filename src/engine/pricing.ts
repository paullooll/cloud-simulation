import type { PricingMode, Rates } from './types';

export const DEFAULT_RATES: Rates = {
  ondemand: 0.384,
  reserved: 0.24,
  spot: 0.115,
};

export const PRICING_INFO: Record<
  PricingMode,
  { label: string; short: string; description: string }
> = {
  ondemand: {
    label: 'On-demand',
    short: 'Flexible, full price',
    description: 'Pay for each server hour. No commitment.',
  },
  reserved: {
    label: 'Reserved',
    short: 'Lower base price',
    description: 'Starting servers get a lower rate. Extra servers pay on-demand.',
  },
  spot: {
    label: 'Spot',
    short: 'Cheap, can be taken back',
    description: 'Spare capacity at a low rate. A running task can be interrupted.',
  },
};

export function rateForServer(
  mode: PricingMode,
  isBase: boolean,
  rates: Rates,
): number {
  if (mode === 'reserved') return isBase ? rates.reserved : rates.ondemand;
  if (mode === 'spot') return rates.spot;
  return rates.ondemand;
}

export function costForServerMinutes(minutes: number, ratePerHour: number): number {
  if (minutes <= 0 || ratePerHour <= 0) return 0;
  return (minutes / 60) * ratePerHour;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value: number, digits = 2): string {
  return `$${value.toFixed(digits)}`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function serverHours(minutes: number): number {
  return minutes / 60;
}
