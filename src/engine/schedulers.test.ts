import { describe, expect, it } from 'vitest';
import { makeConfig } from './defaults';
import { formatMoney } from './pricing';
import { makeTask, orderTasks, scheduleSequential } from './schedulers';
import { simulate } from './simulate';

function runSingleServer(tasks: ReturnType<typeof makeTask>[], policy: 'fcfs' | 'sjf' | 'rr' | 'priority', timeSlice = 2) {
  return simulate(
    makeConfig({
      policy,
      timeSlice,
      autoScale: false,
      startingServers: 1,
      maxServers: 1,
      pricing: 'ondemand',
      horizon: 120,
    }),
    { tasks },
  );
}

describe('scheduler ordering', () => {
  it('orders FCFS by arrival', () => {
    const tasks = [
      makeTask('A', 3, 4),
      makeTask('B', 2, 0),
      makeTask('C', 4, 2),
    ];
    expect(orderTasks(tasks, 'fcfs').map((task) => task.id)).toEqual(['B', 'C', 'A']);
  });

  it('orders SJF by shortest task', () => {
    const tasks = [
      makeTask('A', 10),
      makeTask('B', 2),
      makeTask('C', 1),
    ];
    expect(orderTasks(tasks, 'sjf').map((task) => task.id)).toEqual(['C', 'B', 'A']);
  });

  it('orders priority with 1 as highest', () => {
    const tasks = [
      makeTask('A', 5, 0, 3),
      makeTask('B', 5, 0, 1),
      makeTask('C', 5, 0, 2),
    ];
    expect(orderTasks(tasks, 'priority').map((task) => task.id)).toEqual(['B', 'C', 'A']);
  });

  it('runs FCFS in arrival order', () => {
    const result = runSingleServer(
      [makeTask('A', 10), makeTask('B', 2), makeTask('C', 1)],
      'fcfs',
    );
    const starts = Object.fromEntries(result.tasks.map((task) => [task.id, task.firstStart]));
    expect(starts).toEqual({ A: 0, B: 10, C: 12 });
  });

  it('runs SJF shortest first', () => {
    const result = runSingleServer(
      [makeTask('A', 10), makeTask('B', 2), makeTask('C', 1)],
      'sjf',
    );
    const starts = Object.fromEntries(result.tasks.map((task) => [task.id, task.firstStart]));
    expect(starts).toEqual({ C: 0, B: 1, A: 3 });
  });

  it('runs priority tasks first', () => {
    const result = runSingleServer(
      [makeTask('A', 10, 0, 3), makeTask('B', 2, 0, 1), makeTask('C', 1, 0, 2)],
      'priority',
    );
    const starts = Object.fromEntries(result.tasks.map((task) => [task.id, task.firstStart]));
    expect(starts).toEqual({ B: 0, C: 2, A: 3 });
  });

  it('runs Round Robin in slices and finishes short tasks first', () => {
    const result = runSingleServer(
      [makeTask('A', 10), makeTask('B', 2), makeTask('C', 1)],
      'rr',
      2,
    );
    const finishes = Object.fromEntries(result.tasks.map((task) => [task.id, task.finish]));
    expect(finishes).toEqual({ B: 4, C: 5, A: 13 });
    expect(result.tasks.find((task) => task.id === 'A')?.firstStart).toBe(0);
  });
});

describe('textbook example', () => {
  const tasks = [
    { id: 'A', arrival: 0, length: 10, priority: 2 },
    { id: 'B', arrival: 0, length: 2, priority: 2 },
    { id: 'C', arrival: 0, length: 1, priority: 2 },
  ];

  it('computes FCFS waits 0, 10, 12 for an average of 7.3', () => {
    const result = scheduleSequential(tasks, 'fcfs');
    expect(result.order).toEqual(['A', 'B', 'C']);
    expect(result.waits).toEqual([0, 10, 12]);
    expect(result.avgWait.toFixed(1)).toBe('7.3');
  });

  it('computes SJF waits 0, 1, 3 for an average of 1.3', () => {
    const result = scheduleSequential(tasks, 'sjf');
    expect(result.order).toEqual(['C', 'B', 'A']);
    expect(result.waits).toEqual([0, 1, 3]);
    expect(result.avgWait.toFixed(1)).toBe('1.3');
  });
});

describe('pricing display', () => {
  it('formats the deck daily prices', () => {
    expect(formatMoney(24 * 0.384)).toBe('$9.22');
    expect(formatMoney(96 * 0.384)).toBe('$36.86');
    expect(formatMoney(30 * 0.384)).toBe('$11.52');
  });
});
