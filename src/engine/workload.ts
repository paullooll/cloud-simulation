import { makeRng } from './rng';
import type { Preset, Task, TaskPriority } from './types';

export interface PresetInfo {
  id: Preset;
  label: string;
  description: string;
}

export const PRESETS: PresetInfo[] = [
  {
    id: 'steady',
    label: 'Steady',
    description: 'Even load. 36 tasks over about 1.5 hours.',
  },
  {
    id: 'spike',
    label: 'Spike (sale event)',
    description: 'A short rush. 56 tasks, with one burst in the middle.',
  },
  {
    id: 'batch',
    label: 'Nightly batch',
    description: '26 long tasks arrive in a short window.',
  },
];

function priority(rng: () => number, highChance = 0.2, lowChance = 0.2): TaskPriority {
  const roll = rng();
  if (roll < highChance) return 1;
  if (roll < highChance + lowChance) return 3;
  return 2;
}

function makeTask(
  index: number,
  arrival: number,
  length: number,
  taskPriority: TaskPriority,
): Task {
  return {
    id: `T${String(index).padStart(2, '0')}`,
    arrival: Math.max(0, Math.round(arrival)),
    length,
    priority: taskPriority,
    remaining: length,
    firstStart: null,
    finish: null,
    restarts: 0,
  };
}

export function generateWorkload(preset: Preset, seed: number): Task[] {
  const rng = makeRng(seed);
  const tasks: Task[] = [];
  let index = 1;

  if (preset === 'steady') {
    for (let i = 0; i < 36; i += 1) {
      const arrival = i * 2.4 + rng() * 2;
      const length = 2 + Math.floor(rng() * 5);
      tasks.push(makeTask(index, arrival, length, priority(rng)));
      index += 1;
    }
  }

  if (preset === 'spike') {
    for (let i = 0; i < 16; i += 1) {
      const arrival = i * 1.9 + rng() * 1.5;
      const length = 2 + Math.floor(rng() * 5);
      tasks.push(makeTask(index, arrival, length, priority(rng, 0.15, 0.25)));
      index += 1;
    }
    for (let i = 0; i < 30; i += 1) {
      const arrival = 34 + rng() * 11;
      const length = 2 + Math.floor(rng() * 5);
      tasks.push(makeTask(index, arrival, length, priority(rng, 0.3, 0.1)));
      index += 1;
    }
    for (let i = 0; i < 10; i += 1) {
      const arrival = 58 + (i / 9) * 37 + rng() * 2;
      const length = 2 + Math.floor(rng() * 5);
      tasks.push(makeTask(index, arrival, length, priority(rng)));
      index += 1;
    }
  }

  if (preset === 'batch') {
    for (let i = 0; i < 26; i += 1) {
      const arrival = i * 0.8 + rng() * 2;
      const length = 8 + Math.floor(rng() * 8);
      tasks.push(makeTask(index, arrival, length, priority(rng, 0.05, 0.65)));
      index += 1;
    }
  }

  return tasks.sort((a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id));
}

export function presetLabel(preset: Preset): string {
  return PRESETS.find((item) => item.id === preset)?.label ?? preset;
}
