export type ScaleAction = 'out' | 'in' | 'none';

export interface ScaleInput {
  autoScale: boolean;
  utilizationPct: number;
  activeServers: number;
  pendingServers: number;
  startingServers: number;
  maxServers: number;
  now: number;
  lastScaleAt: number;
  cooldown: number;
  scaleOutThreshold: number;
  scaleInThreshold: number;
}

export function decideScale(input: ScaleInput): ScaleAction {
  if (!input.autoScale) return 'none';

  const cooldownPassed = input.now - input.lastScaleAt >= input.cooldown;
  if (!cooldownPassed) return 'none';

  const provisioned = input.activeServers + input.pendingServers;
  if (provisioned < input.maxServers && input.utilizationPct > input.scaleOutThreshold) {
    return 'out';
  }

  if (input.activeServers > input.startingServers && input.utilizationPct < input.scaleInThreshold) {
    return 'in';
  }

  return 'none';
}

export interface ServerTimes {
  billingStart: number;
  availableAt: number;
}

export function serverTimes(requestedAt: number, startupDelay: number): ServerTimes {
  const delay = Math.max(0, startupDelay);
  return {
    billingStart: requestedAt,
    availableAt: requestedAt + delay,
  };
}

export function utilizationPct(busy: number, available: number): number {
  if (available <= 0) return 0;
  return (busy / available) * 100;
}
