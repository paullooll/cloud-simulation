import { DEFAULT_RATES } from './pricing';
import type { SimConfig } from './types';

export const DEFAULT_CONFIG: SimConfig = {
  preset: 'spike',
  seed: 16,
  policy: 'fcfs',
  timeSlice: 2,
  startingServers: 1,
  maxServers: 4,
  slotsPerServer: 1,
  autoScale: true,
  scaleOutThreshold: 70,
  scaleInThreshold: 30,
  cooldown: 5,
  startupDelay: 2,
  pricing: 'ondemand',
  spotInterruptionPerHour: 0.05,
  rates: { ...DEFAULT_RATES },
  horizon: 600,
};

export function makeConfig(overrides: Partial<SimConfig> = {}): SimConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    rates: { ...DEFAULT_CONFIG.rates, ...(overrides.rates ?? {}) },
  };
}
