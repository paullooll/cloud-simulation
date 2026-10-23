import { describe, expect, it } from 'vitest';
import { makeConfig } from './defaults';
import { makeTask } from './schedulers';
import { simulate } from './simulate';
import { generateWorkload } from './workload';

describe('workload seeds', () => {
  it('repeats the same tasks for the same seed', () => {
    const first = generateWorkload('spike', 4242);
    const second = generateWorkload('spike', 4242);
    expect(first).toEqual(second);
  });

  it('changes tasks with a new seed', () => {
    const first = generateWorkload('spike', 4242);
    const second = generateWorkload('spike', 9999);
    expect(first).not.toEqual(second);
  });

  it('repeats the same simulation for the same seed and settings', () => {
    const config = makeConfig({ seed: 77 });
    const first = simulate(config);
    const second = simulate(config);
    expect(first.summary).toEqual(second.summary);
    expect(first.frames).toEqual(second.frames);
  });
});

describe('spot interruption', () => {
  it('returns the task to the queue and restarts it from zero', () => {
    const result = simulate(
      makeConfig({
        autoScale: false,
        pricing: 'spot',
        spotInterruptionPerHour: 1,
        startingServers: 1,
        maxServers: 1,
        horizon: 180,
      }),
      { tasks: [makeTask('A', 5, 59)] },
    );

    const task = result.tasks[0];
    expect(task.restarts).toBe(1);
    expect(task.firstStart).toBe(59);
    expect(task.finish).toBe(65);
    expect(result.summary.restarts).toBe(1);
    expect(
      result.events.some((event) => event.type === 'spot-interrupt'),
    ).toBe(true);
  });

  it('leaves tasks alone when the interruption chance is zero', () => {
    const result = simulate(
      makeConfig({
        autoScale: false,
        pricing: 'spot',
        spotInterruptionPerHour: 0,
        horizon: 120,
      }),
      { tasks: [makeTask('A', 5, 59)] },
    );
    expect(result.tasks[0].restarts).toBe(0);
    expect(result.tasks[0].finish).toBe(64);
  });
});

describe('core metrics', () => {
  it('computes wait and completion', () => {
    const result = simulate(
      makeConfig({ autoScale: false, horizon: 60 }),
      { tasks: [makeTask('A', 4, 3)] },
    );
    expect(result.tasks[0].firstStart).toBe(3);
    expect(result.tasks[0].finish).toBe(7);
    expect(result.summary.avgWait).toBe(0);
    expect(result.summary.avgCompletion).toBe(4);
  });

  it('counts idle server time in utilization', () => {
    const result = simulate(
      makeConfig({
        autoScale: false,
        startingServers: 2,
        maxServers: 2,
        horizon: 60,
      }),
      { tasks: [makeTask('A', 4, 0)] },
    );
    expect(result.summary.utilizationPct).toBeCloseTo(50, 5);
  });

  it('shows scale events and peak servers', () => {
    const result = simulate(
      makeConfig({
        autoScale: true,
        startingServers: 1,
        maxServers: 4,
        cooldown: 2,
        startupDelay: 1,
        horizon: 600,
      }),
      {
        tasks: Array.from({ length: 20 }, (_, index) => makeTask(`T${index}`, 10, 0)),
      },
    );
    expect(result.events.some((event) => event.type === 'scale-out')).toBe(true);
    expect(result.summary.peakServers).toBeGreaterThan(1);
    expect(result.summary.tasksFinished).toBe(20);
  });
});
