import type { TaskPriority } from '../engine/types';

export function priorityLabel(priority: TaskPriority): string {
  if (priority === 1) return 'High';
  if (priority === 3) return 'Low';
  return 'Normal';
}

export function priorityShort(priority: TaskPriority): string {
  if (priority === 1) return 'P1';
  if (priority === 3) return 'P3';
  return 'P2';
}

export function minutesLabel(value: number): string {
  return `${value.toFixed(1)} min`;
}

export function intLabel(value: number): string {
  return Math.round(value).toString();
}
