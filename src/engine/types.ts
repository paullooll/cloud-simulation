export type Preset = 'steady' | 'spike' | 'batch';

export type Policy = 'fcfs' | 'sjf' | 'rr' | 'priority';

export type PricingMode = 'ondemand' | 'reserved' | 'spot';

export type TaskPriority = 1 | 2 | 3;

export interface Task {
  id: string;
  arrival: number;
  length: number;
  priority: TaskPriority;
  remaining: number;
  firstStart: number | null;
  finish: number | null;
  restarts: number;
}

export interface Rates {
  ondemand: number;
  reserved: number;
  spot: number;
}

export interface SimConfig {
  preset: Preset;
  seed: number;
  policy: Policy;
  timeSlice: number;
  startingServers: number;
  maxServers: number;
  slotsPerServer: number;
  autoScale: boolean;
  scaleOutThreshold: number;
  scaleInThreshold: number;
  cooldown: number;
  startupDelay: number;
  pricing: PricingMode;
  spotInterruptionPerHour: number;
  rates: Rates;
  horizon: number;
}

export interface ServerInfo {
  id: string;
  isBase: boolean;
  billingStart: number;
  availableAt: number;
  terminatedAt: number | null;
}

export type EventType = 'scale-out' | 'scale-in' | 'spot-interrupt' | 'server-ready';

export interface SimEvent {
  minute: number;
  type: EventType;
  message: string;
}

export type ServerStatus = 'starting' | 'busy' | 'idle';

export interface ServerFrame {
  id: string;
  isBase: boolean;
  status: ServerStatus;
  taskIds: string[];
  readyIn: number;
}

export interface Frame {
  minute: number;
  servers: ServerFrame[];
  queue: string[];
  utilizationPct: number;
  activeServers: number;
  busyServers: number;
  totalCost: number;
  queueLength: number;
  finished: number;
  restarts: number;
  events: SimEvent[];
}

export interface Summary {
  avgWait: number;
  avgCompletion: number;
  maxWait: number;
  utilizationPct: number;
  totalCost: number;
  tasksFinished: number;
  taskCount: number;
  restarts: number;
  peakServers: number;
  peakQueueLength: number;
  duration: number;
  unfinished: number;
  totalTaskMinutes: number;
}

export interface SimResult {
  frames: Frame[];
  summary: Summary;
  tasks: Task[];
  events: SimEvent[];
  config: SimConfig;
}
