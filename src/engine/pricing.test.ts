import { describe, expect, it } from 'vitest';
import { makeConfig } from './defaults';
import {
  DEFAULT_RATES,
  costForServerMinutes,
  rateForServer,
  roundMoney,
} from './pricing';
import { makeTask } from './schedulers';
import { simulate } from './simulate';
import {
  DEFAULT_TRADEOFF_ROWS,
  percentDifference,
  tradeoffCost,
} from './tradeoff';

describe('pricing rates', () => {
  it('uses the on-demand rate', () => {
    expect(rateForServer('ondemand', true, DEFAULT_RATES)).toBe(0.384);
    expect(rateForServer('ondemand', false, DEFAULT_RATES)).toBe(0.384);
  });

  it('uses reserved for base servers and on-demand for extra servers', () => {
    expect(rateForServer('reserved', true, DEFAULT_RATES)).toBe(0.24);
    expect(rateForServer('reserved', false, DEFAULT_RATES)).toBe(0.384);
  });

  it('uses the spot rate', () => {
    expect(rateForServer('spot', true, DEFAULT_RATES)).toBe(0.115);
    expect(rateForServer('spot', false, DEFAULT_RATES)).toBe(0.115);
  });

  it('prices server hours', () => {
    expect(costForServerMinutes(60, 0.384)).toBeCloseTo(0.384);
    expect(roundMoney(costForServerMinutes(1440, 0.384))).toBe(9.22);
    expect(roundMoney(costForServerMinutes(5760, 0.384))).toBe(36.86);
  });

  it('matches the day table', () => {
    expect(DEFAULT_TRADEOFF_ROWS.map((row) => roundMoney(tradeoffCost(row.hours, 0.384)))).toEqual([
      9.22,
      36.86,
      11.52,
    ]);
    expect(percentDifference(tradeoffCost(30, 0.384), tradeoffCost(24, 0.384))).toBeCloseTo(25);
  });
});

describe('pricing in the simulation', () => {
  const tasks = [makeTask('A', 60)];

  it('charges on-demand for one server hour', () => {
    const result = simulate(
      makeConfig({ autoScale: false, pricing: 'ondemand', horizon: 120 }),
      { tasks },
    );
    expect(result.summary.totalCost).toBeCloseTo(0.384, 5);
  });

  it('charges reserved for the starting server', () => {
    const result = simulate(
      makeConfig({ autoScale: false, pricing: 'reserved', horizon: 120 }),
      { tasks },
    );
    expect(result.summary.totalCost).toBeCloseTo(0.24, 5);
  });

  it('charges spot for the starting server', () => {
    const result = simulate(
      makeConfig({
        autoScale: false,
        pricing: 'spot',
        spotInterruptionPerHour: 0,
        horizon: 120,
      }),
      { tasks },
    );
    expect(result.summary.totalCost).toBeCloseTo(0.115, 5);
  });
});
