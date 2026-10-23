import { describe, expect, it } from 'vitest';
import { decideScale, serverTimes } from './autoscaler';
import { makeConfig } from './defaults';
import { makeTask } from './schedulers';
import { simulate } from './simulate';

const base = {
  autoScale: true,
  utilizationPct: 80,
  activeServers: 1,
  pendingServers: 0,
  startingServers: 1,
  maxServers: 4,
  now: 10,
  lastScaleAt: -Infinity,
  cooldown: 5,
  scaleOutThreshold: 70,
  scaleInThreshold: 30,
};

describe('auto-scaler decisions', () => {
  it('scales out above the upper threshold', () => {
    expect(decideScale(base)).toBe('out');
  });

  it('does not scale out at the threshold', () => {
    expect(decideScale({ ...base, utilizationPct: 70 })).toBe('none');
  });

  it('does not scale out at max servers', () => {
    expect(
      decideScale({ ...base, activeServers: 4, utilizationPct: 99 }),
    ).toBe('none');
  });

  it('counts pending servers toward the maximum', () => {
    expect(
      decideScale({ ...base, activeServers: 3, pendingServers: 1 }),
    ).toBe('none');
  });

  it('scales in below the lower threshold', () => {
    expect(
      decideScale({ ...base, utilizationPct: 20, activeServers: 2 }),
    ).toBe('in');
  });

  it('does not scale in below the starting count', () => {
    expect(
      decideScale({ ...base, utilizationPct: 20, activeServers: 1 }),
    ).toBe('none');
  });

  it('respects cooldown', () => {
    expect(
      decideScale({ ...base, now: 12, lastScaleAt: 10 }),
    ).toBe('none');
    expect(
      decideScale({ ...base, now: 15, lastScaleAt: 10 }),
    ).toBe('out');
  });

  it('does nothing when auto-scaling is off', () => {
    expect(decideScale({ ...base, autoScale: false })).toBe('none');
  });
});

describe('start delay', () => {
  it('bills from the request time and starts later', () => {
    expect(serverTimes(10, 2)).toEqual({ billingStart: 10, availableAt: 12 });
    expect(serverTimes(10, 0)).toEqual({ billingStart: 10, availableAt: 10 });
  });

  it('shows a new server as starting until the delay passes', () => {
    const result = simulate(
      makeConfig({
        autoScale: true,
        startingServers: 1,
        maxServers: 2,
        cooldown: 0,
        startupDelay: 5,
        pricing: 'ondemand',
        horizon: 120,
      }),
      { tasks: [makeTask('A', 100)] },
    );

    const second = result.frames.map((frame) =>
      frame.servers.find((server) => server.id === 'S2'),
    ).filter((server) => server !== undefined);

    expect(second.length).toBeGreaterThan(0);
    expect(second[0].status).toBe('starting');
    expect(second[0].readyIn).toBe(5);
    expect(second[5].status).toBe('idle');
    expect(second[5].readyIn).toBe(0);
    expect(result.events.some((event) => event.type === 'scale-out')).toBe(true);
  });
});
