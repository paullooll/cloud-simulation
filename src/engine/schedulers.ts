import type { Policy, Task } from './types';

export interface QueueTask {
  id: string;
  arrival: number;
  length: number;
  remaining: number;
  priority: number;
}

const byId = (a: QueueTask, b: QueueTask) => a.id.localeCompare(b.id);

export function compareTasks(policy: Policy, a: QueueTask, b: QueueTask): number {
  switch (policy) {
    case 'sjf': {
      const length = a.remaining - b.remaining;
      if (length !== 0) return length;
      const arrival = a.arrival - b.arrival;
      if (arrival !== 0) return arrival;
      return byId(a, b);
    }
    case 'priority': {
      const priority = a.priority - b.priority;
      if (priority !== 0) return priority;
      const arrival = a.arrival - b.arrival;
      if (arrival !== 0) return arrival;
      return byId(a, b);
    }
    case 'fcfs':
    case 'rr':
    default: {
      const arrival = a.arrival - b.arrival;
      if (arrival !== 0) return arrival;
      return byId(a, b);
    }
  }
}

export function pickNext<T extends QueueTask>(queue: T[], policy: Policy): T | undefined {
  if (policy === 'rr') return queue[0];
  let best: T | undefined;
  for (const task of queue) {
    if (!best || compareTasks(policy, task, best) < 0) best = task;
  }
  return best;
}

export function orderTasks<T extends QueueTask>(tasks: T[], policy: Policy): T[] {
  return [...tasks].sort((a, b) => compareTasks(policy, a, b));
}

export interface SequentialTask {
  id: string;
  arrival: number;
  length: number;
  priority: number;
}

export interface SequentialResult {
  order: string[];
  waits: number[];
  completions: number[];
  avgWait: number;
}

export function scheduleSequential(
  tasks: SequentialTask[],
  policy: Policy,
): SequentialResult {
  const pending = tasks.map((task) => ({
    ...task,
    remaining: task.length,
  }));
  const order: string[] = [];
  const waits: number[] = [];
  const completions: number[] = [];
  let clock = 0;

  while (pending.length > 0) {
    const next = pickNext(pending, policy);
    if (!next) break;
    pending.splice(pending.indexOf(next), 1);
    const start = Math.max(clock, next.arrival);
    order.push(next.id);
    waits.push(start - next.arrival);
    clock = start + next.length;
    completions.push(clock - next.arrival);
  }

  const avgWait = waits.length > 0 ? waits.reduce((sum, w) => sum + w, 0) / waits.length : 0;
  return { order, waits, completions, avgWait };
}

export function makeTask(
  id: string,
  length: number,
  arrival = 0,
  priority: number = 2,
): Task {
  return {
    id,
    arrival,
    length,
    priority: priority as Task['priority'],
    remaining: length,
    firstStart: null,
    finish: null,
    restarts: 0,
  };
}

