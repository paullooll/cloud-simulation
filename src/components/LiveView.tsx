import { useMemo } from 'react';
import type { Frame, SimEvent, SimResult, Task } from '../engine/types';
import { priorityLabel, priorityShort } from '../ui/format';
import { LiveCharts } from './LiveCharts';

interface LiveViewProps {
  result: SimResult;
  frame: Frame;
  frameIndex: number;
  playing: boolean;
  speed: number;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onSeek: (index: number) => void;
  onSpeed: (speed: number) => void;
}

const EVENT_LABEL: Record<SimEvent['type'], string> = {
  'scale-out': 'Scale out',
  'scale-in': 'Scale in',
  'spot-interrupt': 'Spot interrupt',
  'server-ready': 'Ready',
};

function TaskChip({ task }: { task: Task }) {
  return (
    <li className="task-chip">
      <span className="task-id">{task.id}</span>
      <span className="task-meta">{priorityShort(task.priority)}</span>
      <span className="task-meta">{task.remaining}m left</span>
    </li>
  );
}

export function LiveView({
  result,
  frame,
  frameIndex,
  playing,
  speed,
  onTogglePlay,
  onStep,
  onReset,
  onSeek,
  onSpeed,
}: LiveViewProps) {
  const tasksById = useMemo(
    () => new Map(result.tasks.map((task) => [task.id, task])),
    [result.tasks],
  );
  const lastIndex = result.frames.length - 1;
  const lastMinute = result.frames[lastIndex]?.minute ?? 0;
  const starting = frame.servers.filter((server) => server.status === 'starting').length;
  const scaleEvents = result.events.filter(
    (event) =>
      event.type === 'scale-out' || event.type === 'scale-in',
  );
  const visibleEvents = result.events.filter((event) => event.minute <= frame.minute);

  return (
    <section className="card live-view" aria-labelledby="live-title">
      <div className="card-head">
        <div>
          <h2 id="live-title" className="section-title">
            Live view
          </h2>
          <p className="card-subtitle">One tick is one simulated minute.</p>
        </div>
        <p className="minute-badge" aria-live="off">
          Minute <strong>{frame.minute}</strong> of {lastMinute}
        </p>
      </div>

      <div className="playback" role="group" aria-label="Playback controls">
        <button type="button" className="button primary" onClick={onTogglePlay}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={onStep}
          disabled={frameIndex >= lastIndex}
        >
          Step
        </button>
        <button
          type="button"
          className="button ghost"
          onClick={onReset}
          disabled={frameIndex === 0}
        >
          Reset
        </button>
        <label className="speed-field" htmlFor="playback-speed">
          Speed
          <select
            id="playback-speed"
            value={speed}
            onChange={(event) => onSpeed(Number(event.target.value))}
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
        </label>
      </div>

      <div className="timeline-scrub">
        <label htmlFor="timeline">Timeline</label>
        <input
          id="timeline"
          type="range"
          min={0}
          max={lastIndex}
          step={1}
          value={frameIndex}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </div>

      <div className="live-kpis" aria-label="Live numbers">
        <div className="live-kpi">
          <span className="live-kpi-label">Queue</span>
          <strong>{frame.queueLength} tasks</strong>
        </div>
        <div className="live-kpi">
          <span className="live-kpi-label">Utilization</span>
          <strong>{Math.round(frame.utilizationPct)}%</strong>
        </div>
        <div className="live-kpi">
          <span className="live-kpi-label">Servers</span>
          <strong>
            {frame.activeServers} active
            {starting > 0 ? ` · ${starting} starting` : ''}
          </strong>
        </div>
        <div className="live-kpi">
          <span className="live-kpi-label">Running cost</span>
          <strong>${frame.totalCost.toFixed(2)}</strong>
        </div>
        <div className="live-kpi">
          <span className="live-kpi-label">Finished</span>
          <strong>
            {frame.finished}/{result.summary.taskCount}
          </strong>
        </div>
      </div>

      <div className="live-grid">
        <div className="servers-panel">
          <div className="panel-head">
            <h3>Servers</h3>
            <p>
              {frame.servers.length} provisioned · max {result.config.maxServers}
            </p>
          </div>
          <div className="server-grid">
            {frame.servers.map((server) => {
              const statusLabel =
                server.status === 'starting'
                  ? `Starting · ${server.readyIn} min`
                  : server.status === 'busy'
                    ? 'Busy'
                    : 'Idle';
              return (
                <article
                  key={server.id}
                  className={`server-box is-${server.status}`}
                  aria-label={`${server.id}, ${statusLabel}`}
                >
                  <div className="server-head">
                    <h4>{server.id}</h4>
                    <span className={`status-badge is-${server.status}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="server-kind">
                    {server.isBase ? 'Base server' : 'Extra server'}
                  </p>
                  {server.taskIds.length > 0 ? (
                    <ul className="task-list">
                      {server.taskIds.map((taskId) => {
                        const task = tasksById.get(taskId);
                        return task ? <TaskChip key={taskId} task={task} /> : null;
                      })}
                    </ul>
                  ) : (
                    <p className="empty-slot">
                      {server.status === 'starting' ? 'Booting' : 'No task'}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div className="queue-panel">
          <div className="panel-head">
            <h3>Queue</h3>
            <p>{frame.queue.length} waiting</p>
          </div>
          {frame.queue.length > 0 ? (
            <ul className="queue-list" aria-label="Waiting tasks" tabIndex={0}>
              {frame.queue.map((taskId) => {
                const task = tasksById.get(taskId);
                return task ? <TaskChip key={taskId} task={task} /> : null;
              })}
            </ul>
          ) : (
            <p className="empty-state">Queue is empty.</p>
          )}
        </div>
      </div>

      <div className="events-panel">
        <div className="panel-head">
          <h3>Event timeline</h3>
          <p>Scale and spot events</p>
        </div>
        <div className="event-track" aria-hidden="true">
          <span className="event-track-line" />
          {scaleEvents.map((event) => (
            <span
              key={`${event.minute}-${event.type}-${event.message}`}
              className={`event-mark is-${event.type}`}
              style={{
                left: `${lastMinute > 0 ? (event.minute / lastMinute) * 100 : 0}%`,
              }}
            />
          ))}
        </div>
        {visibleEvents.length > 0 ? (
          <ol className="event-list" aria-label="Events in this run" tabIndex={0}>
            {visibleEvents.map((event) => (
              <li key={`${event.minute}-${event.type}-${event.message}`}>
                <time>min {event.minute}</time>
                <span className={`event-tag is-${event.type}`}>
                  {EVENT_LABEL[event.type]}
                </span>
                <span>{event.message}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-state">No events yet.</p>
        )}
      </div>

      <LiveCharts
        frames={result.frames}
        frameIndex={frameIndex}
        current={frame}
      />

      <p className="sr-only" aria-live={playing ? 'off' : 'polite'}>
        Minute {frame.minute}. Queue {frame.queueLength} tasks. Utilization{' '}
        {Math.round(frame.utilizationPct)} percent. {frame.activeServers} servers active. Cost $
        {frame.totalCost.toFixed(2)}.
      </p>
      <p className="priority-key">
        Task key: P1 = High priority, P2 = Normal, P3 = Low. Each chip shows the task, its
        priority, and minutes left.
      </p>
      <p className="sr-only">
        Task priorities use labels: {priorityLabel(1)}, {priorityLabel(2)}, {priorityLabel(3)}.
      </p>
    </section>
  );
}
