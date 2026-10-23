import { decideScale, serverTimes } from './autoscaler';
import { costForServerMinutes, rateForServer } from './pricing';
import { makeRng } from './rng';
import { pickNext } from './schedulers';
import type {
  Frame,
  ServerFrame,
  ServerInfo,
  ServerStatus,
  SimConfig,
  SimEvent,
  SimResult,
  Summary,
  Task,
} from './types';
import { generateWorkload } from './workload';

interface RuntimeServer {
  info: ServerInfo;
  slots: (Task | null)[];
  ratePerHour: number;
  billedMinutes: number;
}

export interface SimulateOptions {
  tasks?: Task[];
}

function cloneTasks(tasks: Task[]): Task[] {
  return tasks.map((task) => ({
    ...task,
    priority: task.priority,
    remaining: task.length,
    firstStart: null,
    finish: null,
    restarts: 0,
  }));
}

function countActive(servers: RuntimeServer[], minute: number): number {
  return servers.filter(
    (server) => server.info.terminatedAt === null && server.info.availableAt <= minute,
  ).length;
}

function countPending(servers: RuntimeServer[], minute: number): number {
  return servers.filter(
    (server) => server.info.terminatedAt === null && server.info.availableAt > minute,
  ).length;
}

function buildServerFrames(servers: RuntimeServer[], minute: number): ServerFrame[] {
  return servers
    .filter((server) => server.info.terminatedAt === null)
    .map((server) => {
      const ready = server.info.availableAt <= minute;
      const taskIds = server.slots
        .filter((task): task is Task => task !== null)
        .map((task) => task.id);
      const status: ServerStatus = !ready
        ? 'starting'
        : taskIds.length > 0
          ? 'busy'
          : 'idle';
      return {
        id: server.info.id,
        isBase: server.info.isBase,
        status,
        taskIds,
        readyIn: Math.max(0, server.info.availableAt - minute),
      };
    })
    .sort((a, b) => Number(b.isBase) - Number(a.isBase) || a.id.localeCompare(b.id));
}

export function simulate(config: SimConfig, options: SimulateOptions = {}): SimResult {
  const horizon = Math.max(1, Math.round(config.horizon || 600));
  const startingServers = Math.max(1, Math.round(config.startingServers));
  const maxServers = Math.max(startingServers, Math.round(config.maxServers));
  const slotsPerServer = Math.max(1, Math.round(config.slotsPerServer));
  const startupDelay = Math.max(0, config.startupDelay);
  const cooldown = Math.max(0, config.cooldown);
  const spotChance = Math.min(1, Math.max(0, config.spotInterruptionPerHour));
  const timeSlice = Math.max(1, Math.round(config.timeSlice));

  const tasks = cloneTasks(
    options.tasks ?? generateWorkload(config.preset, config.seed),
  );
  const arrivals = [...tasks].sort(
    (a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id),
  );

  const rng = makeRng((config.seed ^ 0x9e3779b9) >>> 0);
  const servers: RuntimeServer[] = [];
  let nextServerNumber = 1;

  const addServer = (
    requestedAt: number,
    availableAt: number,
    isBase: boolean,
  ): RuntimeServer => {
    const server: RuntimeServer = {
      info: {
        id: `S${nextServerNumber}`,
        isBase,
        billingStart: requestedAt,
        availableAt,
        terminatedAt: null,
      },
      slots: Array.from({ length: slotsPerServer }, () => null),
      ratePerHour: rateForServer(config.pricing, isBase, config.rates),
      billedMinutes: 0,
    };
    nextServerNumber += 1;
    servers.push(server);
    return server;
  };

  for (let i = 0; i < startingServers; i += 1) {
    addServer(0, 0, true);
  }

  let queue: Task[] = [];
  let nextArrivalIndex = 0;
  let minute = 0;
  let totalBusy = 0;
  let totalAvailable = 0;
  let finished = 0;
  let restarts = 0;
  let lastScaleAt = -Infinity;
  let peakServers = startingServers;
  let peakQueueLength = 0;
  const frames: Frame[] = [];
  const events: SimEvent[] = [];
  const quantumLeft = new Map<string, number>();

  while (minute < horizon) {
    const tickEvents: SimEvent[] = [];
    const addEvent = (eventMinute: number, type: SimEvent['type'], message: string) => {
      const event: SimEvent = { minute: eventMinute, type, message };
      tickEvents.push(event);
      events.push(event);
    };

    while (
      nextArrivalIndex < arrivals.length &&
      arrivals[nextArrivalIndex].arrival <= minute
    ) {
      queue.push(arrivals[nextArrivalIndex]);
      nextArrivalIndex += 1;
    }

    if (config.pricing === 'spot' && minute > 0 && minute % 60 === 0) {
      for (const server of servers) {
        if (server.info.terminatedAt !== null || server.info.availableAt > minute) continue;
        if (rng() >= spotChance) continue;
        for (let slotIndex = 0; slotIndex < server.slots.length; slotIndex += 1) {
          const task = server.slots[slotIndex];
          if (!task) continue;
          server.slots[slotIndex] = null;
          task.remaining = task.length;
          task.restarts += 1;
          restarts += 1;
          quantumLeft.delete(task.id);
          queue.push(task);
          addEvent(
            minute,
            'spot-interrupt',
            `${server.info.id} was interrupted. ${task.id} restarts from 0.`,
          );
        }
      }
    }

    if (config.policy === 'rr') {
      for (const server of servers) {
        if (server.info.terminatedAt !== null || server.info.availableAt > minute) continue;
        for (let slotIndex = 0; slotIndex < server.slots.length; slotIndex += 1) {
          const task = server.slots[slotIndex];
          if (!task) continue;
          if ((quantumLeft.get(task.id) ?? 0) <= 0) {
            server.slots[slotIndex] = null;
            quantumLeft.delete(task.id);
            queue.push(task);
          }
        }
      }
    }

    if (minute > 0) {
      for (const server of servers) {
        if (
          server.info.terminatedAt === null &&
          server.info.availableAt === minute
        ) {
          addEvent(minute, 'server-ready', `${server.info.id} is ready.`);
        }
      }
    }

    for (const server of servers) {
      if (server.info.terminatedAt !== null || server.info.availableAt > minute) continue;
      for (let slotIndex = 0; slotIndex < server.slots.length; slotIndex += 1) {
        if (server.slots[slotIndex]) continue;
        const task = pickNext(queue, config.policy);
        if (!task) break;
        queue.splice(queue.indexOf(task), 1);
        server.slots[slotIndex] = task;
        if (task.firstStart === null) task.firstStart = minute;
        if (config.policy === 'rr') quantumLeft.set(task.id, timeSlice);
      }
    }

    let busyThisTick = 0;
    let availableThisTick = 0;

    for (const server of servers) {
      if (server.info.terminatedAt !== null || server.info.availableAt > minute) continue;
      for (let slotIndex = 0; slotIndex < server.slots.length; slotIndex += 1) {
        availableThisTick += 1;
        const task = server.slots[slotIndex];
        if (!task) continue;
        busyThisTick += 1;
        task.remaining -= 1;
        if (config.policy === 'rr') {
          quantumLeft.set(task.id, (quantumLeft.get(task.id) ?? 1) - 1);
        }
        if (task.remaining <= 0) {
          task.finish = minute + 1;
          finished += 1;
          server.slots[slotIndex] = null;
          quantumLeft.delete(task.id);
        }
      }
    }

    totalBusy += busyThisTick;
    totalAvailable += availableThisTick;

    for (const server of servers) {
      if (server.info.terminatedAt !== null) continue;
      if (server.info.billingStart <= minute) server.billedMinutes += 1;
    }

    minute += 1;

    const tickUtilization =
      availableThisTick > 0 ? (busyThisTick / availableThisTick) * 100 : 0;
    const activeCount = countActive(servers, minute);
    const pendingCount = countPending(servers, minute);
    const startingCount = servers.filter(
      (server) => server.info.terminatedAt === null && server.info.isBase,
    ).length;

    const action = decideScale({
      autoScale: config.autoScale,
      utilizationPct: tickUtilization,
      activeServers: activeCount,
      pendingServers: pendingCount,
      startingServers: startingCount,
      maxServers,
      now: minute,
      lastScaleAt,
      cooldown,
      scaleOutThreshold: config.scaleOutThreshold,
      scaleInThreshold: config.scaleInThreshold,
    });

    if (action === 'out') {
      const times = serverTimes(minute, startupDelay);
      const server = addServer(times.billingStart, times.availableAt, false);
      lastScaleAt = minute;
      addEvent(
        minute,
        'scale-out',
        `Requested ${server.info.id}. Ready in ${startupDelay} min.`,
      );
    }

    if (action === 'in') {
      const idle = servers
        .filter(
          (server) =>
            server.info.terminatedAt === null &&
            !server.info.isBase &&
            server.info.availableAt <= minute &&
            server.slots.every((task) => task === null),
        )
        .sort((a, b) => a.info.id.localeCompare(b.info.id));
      const victim = idle[idle.length - 1];
      if (victim) {
        victim.info.terminatedAt = minute;
        lastScaleAt = minute;
        addEvent(minute, 'scale-in', `Removed idle ${victim.info.id}.`);
      }
    }

    const totalCost = servers.reduce(
      (sum, server) =>
        sum + costForServerMinutes(server.billedMinutes, server.ratePerHour),
      0,
    );

    peakServers = Math.max(peakServers, activeCount);
    peakQueueLength = Math.max(peakQueueLength, queue.length);

    frames.push({
      minute,
      servers: buildServerFrames(servers, minute),
      queue: queue.map((task) => task.id),
      utilizationPct: tickUtilization,
      activeServers: activeCount,
      busyServers: busyThisTick,
      totalCost,
      queueLength: queue.length,
      finished,
      restarts,
      events: tickEvents,
    });

    if (nextArrivalIndex >= arrivals.length && finished === tasks.length) break;
  }

  const lastFrame = frames[frames.length - 1];
  const finishedTasks = tasks.filter(
    (task) => task.finish !== null && task.firstStart !== null,
  );
  const avgWait =
    finishedTasks.length > 0
      ? finishedTasks.reduce(
          (sum, task) => sum + ((task.firstStart ?? 0) - task.arrival),
          0,
        ) / finishedTasks.length
      : 0;
  const avgCompletion =
    finishedTasks.length > 0
      ? finishedTasks.reduce(
          (sum, task) => sum + ((task.finish ?? 0) - task.arrival),
          0,
        ) / finishedTasks.length
      : 0;
  const maxWait =
    finishedTasks.length > 0
      ? Math.max(
          ...finishedTasks.map((task) => (task.firstStart ?? 0) - task.arrival),
        )
      : 0;

  const summary: Summary = {
    avgWait,
    avgCompletion,
    maxWait,
    utilizationPct:
      totalAvailable > 0 ? (totalBusy / totalAvailable) * 100 : 0,
    totalCost: lastFrame ? lastFrame.totalCost : 0,
    tasksFinished: finished,
    taskCount: tasks.length,
    restarts,
    peakServers,
    peakQueueLength,
    duration: lastFrame ? lastFrame.minute : 0,
    unfinished: tasks.length - finished,
    totalTaskMinutes: tasks.reduce((sum, task) => sum + task.length, 0),
  };

  return {
    frames,
    summary,
    tasks,
    events,
    config,
  };
}

export function resultToCsv(result: SimResult): string {
  const rows = ['minute,queue,utilizationPct,costUSD,servers'];
  for (const frame of result.frames) {
    rows.push(
      [
        frame.minute,
        frame.queueLength,
        frame.utilizationPct.toFixed(1),
        frame.totalCost.toFixed(2),
        frame.activeServers,
      ].join(','),
    );
  }
  return rows.join('\n');
}



