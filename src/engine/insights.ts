import type { SimResult } from './types';

const oneDecimal = (value: number) => value.toFixed(1);
const whole = (value: number) => Math.round(value).toString();
const money = (value: number) => `$${value.toFixed(2)}`;

export function percentChange(from: number, to: number): number | null {
  if (from === 0) return null;
  return ((to - from) / from) * 100;
}

function amount(percent: number | null): string {
  if (percent === null) return 'a change';
  const rounded = Math.abs(percent);
  if (rounded < 1) return 'almost no change';
  return `${whole(rounded)}%`;
}

export function makeInsight(result: SimResult): string {
  const summary = result.summary;
  const first = `By minute ${summary.duration}, ${summary.tasksFinished} of ${summary.taskCount} tasks finished with an average wait of ${oneDecimal(summary.avgWait)} min.`;

  if (summary.unfinished > 0) {
    return `${first} Utilization was ${whole(summary.utilizationPct)}%, cost was ${money(summary.totalCost)}, and ${summary.unfinished} tasks did not finish inside the ${result.config.horizon}-minute window.`;
  }

  if (summary.restarts > 0) {
    return `${first} Utilization was ${whole(summary.utilizationPct)}%, cost was ${money(summary.totalCost)}, and spot interruptions restarted ${summary.restarts} ${summary.restarts === 1 ? 'task' : 'tasks'}.`;
  }

  return `${first} Utilization was ${whole(summary.utilizationPct)}%, cost was ${money(summary.totalCost)}, and the queue peaked at ${summary.peakQueueLength} tasks.`;
}

export function compareInsight(
  a: SimResult,
  b: SimResult,
  labelA = 'Setup A',
  labelB = 'Setup B',
): string {
  const wait = percentChange(a.summary.avgWait, b.summary.avgWait);
  const cost = percentChange(a.summary.totalCost, b.summary.totalCost);
  const waitWord = wait === null ? 'changed' : wait <= 0 ? 'cut' : 'raised';
  const costWord = cost === null ? 'changed' : cost <= 0 ? 'cut' : 'raised';
  const utilDelta = b.summary.utilizationPct - a.summary.utilizationPct;

  const first = `${labelB} ${waitWord} average wait by ${amount(wait)} and ${costWord} cost by ${amount(cost)} compared with ${labelA}.`;
  const second = `Utilization moved from ${whole(a.summary.utilizationPct)}% to ${whole(b.summary.utilizationPct)}% (${utilDelta >= 0 ? '+' : ''}${oneDecimal(utilDelta)} points).`;

  return `${first} ${second}`;
}

export function describeDifference(
  before: number,
  after: number,
  unit: 'percent' | 'money' | 'minutes',
): string {
  const change = percentChange(before, after);
  if (change === null) return 'No baseline value.';
  const direction = change <= 0 ? 'lower' : 'higher';
  const value = Math.abs(change).toFixed(0);
  if (unit === 'money') return `${value}% ${direction} cost`;
  if (unit === 'minutes') return `${value}% ${direction} wait`;
  return `${value}% ${direction}`;
}
