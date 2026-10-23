import { useMemo, useState } from 'react';
import {
  NumberField,
  SelectField,
  ToggleField,
} from '../components/Controls';
import { TableWrap } from '../components/TableWrap';
import { Term } from '../components/Term';
import { makeConfig } from '../engine/defaults';
import { compareInsight, percentChange } from '../engine/insights';
import { randomSeed } from '../engine/rng';
import { simulate } from '../engine/simulate';
import type { Policy, Preset, PricingMode, SimConfig } from '../engine/types';
import { PRESETS } from '../engine/workload';

const POLICY_OPTIONS = [
  { value: 'fcfs' as Policy, label: 'FCFS' },
  { value: 'sjf' as Policy, label: 'SJF' },
  { value: 'rr' as Policy, label: 'Round Robin' },
  { value: 'priority' as Policy, label: 'Priority' },
];

const PRICING_OPTIONS = [
  { value: 'ondemand' as PricingMode, label: 'On-demand' },
  { value: 'reserved' as PricingMode, label: 'Reserved' },
  { value: 'spot' as PricingMode, label: 'Spot' },
];

interface SetupCardProps {
  id: 'a' | 'b';
  title: string;
  config: SimConfig;
  onChange: (patch: Partial<SimConfig>) => void;
}

function SetupCard({ id, title, config, onChange }: SetupCardProps) {
  return (
    <section className="card setup-card" aria-labelledby={`setup-${id}-title`}>
      <div className="card-head compact">
        <h3 id={`setup-${id}-title`} className="setup-title">
          <span className={`setup-letter is-${id}`} aria-hidden="true">
            {id.toUpperCase()}
          </span>
          {title}
        </h3>
      </div>
      <div className="field-grid">
        <SelectField
          id={`${id}-policy`}
          label="Scheduler"
          value={config.policy}
          options={POLICY_OPTIONS}
          onChange={(policy) => onChange({ policy })}
        />
        <SelectField
          id={`${id}-pricing`}
          label="Pricing"
          value={config.pricing}
          options={PRICING_OPTIONS}
          onChange={(pricing) => onChange({ pricing })}
        />
      </div>
      {config.policy === 'rr' ? (
        <NumberField
          id={`${id}-slice`}
          label="Time slice (min)"
          term="Time slice"
          value={config.timeSlice}
          min={1}
          max={20}
          onChange={(timeSlice) => onChange({ timeSlice })}
        />
      ) : null}
      <ToggleField
        id={`${id}-auto`}
        label="Auto-scaling"
        term="Auto-scaling"
        checked={config.autoScale}
        onChange={(autoScale) => onChange({ autoScale })}
      />
      <div className="field-grid">
        <NumberField
          id={`${id}-starting`}
          label="Starting servers"
          value={config.startingServers}
          min={1}
          max={12}
          onChange={(startingServers) =>
            onChange({
              startingServers,
              maxServers: Math.max(startingServers, config.maxServers),
            })
          }
        />
        <NumberField
          id={`${id}-max`}
          label="Max servers"
          value={config.maxServers}
          min={config.startingServers}
          max={16}
          onChange={(maxServers) =>
            onChange({
              maxServers,
              startingServers: Math.min(config.startingServers, maxServers),
            })
          }
        />
      </div>
      <p className="tiny-note">
        Thresholds 70% / 30%, cooldown 5 min, start delay 2 min. Rates are editable in the
        simulator.
      </p>
    </section>
  );
}

interface DiffCardProps {
  label: string;
  aValue: string;
  bValue: string;
  change: string;
}

function DiffCard({ label, aValue, bValue, change }: DiffCardProps) {
  return (
    <div className="diff-card">
      <p className="diff-label">{label}</p>
      <div className="diff-values">
        <span>
          <small>A</small> {aValue}
        </span>
        <span>
          <small>B</small> {bValue}
        </span>
      </div>
      <p className="diff-change">{change}</p>
    </div>
  );
}

function percentText(from: number, to: number): string {
  const change = percentChange(from, to);
  if (change === null) return 'No baseline';
  if (Math.abs(change) < 1) return 'About the same';
  return `B is ${Math.abs(change).toFixed(0)}% ${change < 0 ? 'lower' : 'higher'}`;
}

export function ComparePage() {
  const [preset, setPreset] = useState<Preset>('spike');
  const [seed, setSeed] = useState(16);
  const [configA, setConfigA] = useState<SimConfig>(() =>
    makeConfig({ autoScale: false, policy: 'fcfs', pricing: 'ondemand' }),
  );
  const [configB, setConfigB] = useState<SimConfig>(() =>
    makeConfig({ autoScale: true, policy: 'fcfs', pricing: 'ondemand' }),
  );

  const cfgA = useMemo(
    () => makeConfig({ ...configA, preset, seed, horizon: 600 }),
    [configA, preset, seed],
  );
  const cfgB = useMemo(
    () => makeConfig({ ...configB, preset, seed, horizon: 600 }),
    [configB, preset, seed],
  );
  const resultA = useMemo(() => simulate(cfgA), [cfgA]);
  const resultB = useMemo(() => simulate(cfgB), [cfgB]);
  const insight = compareInsight(resultA, resultB, 'Setup A', 'Setup B');
  const utilDelta = resultB.summary.utilizationPct - resultA.summary.utilizationPct;

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Compare mode</p>
        <h1 className="page-title">Two setups. One workload.</h1>
        <p className="page-lede">
          Both setups use the same seed and the same tasks. Change one choice and see what it costs.
        </p>
      </header>

      <section className="card shared-card" aria-labelledby="shared-title">
        <div className="card-head compact">
          <h2 id="shared-title" className="section-title">
            Shared workload
          </h2>
          <p className="card-subtitle">{resultA.summary.taskCount} tasks in both setups.</p>
        </div>
        <div className="shared-controls">
          <div className="field">
            <label htmlFor="compare-preset">Preset</label>
            <select
              id="compare-preset"
              value={preset}
              onChange={(event) => setPreset(event.target.value as Preset)}
            >
              {PRESETS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <span className="field-label-row">
              <label htmlFor="compare-seed">Seed</label>
              <Term term="Seed" showText={false} />
            </span>
            <input
              id="compare-seed"
              type="number"
              min={1}
              max={999999}
              value={seed}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next)) setSeed(Math.max(1, Math.min(999999, next)));
              }}
            />
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={() => setSeed(randomSeed())}
          >
            New seed
          </button>
        </div>
      </section>

      <div className="compare-grid">
        <SetupCard
          id="a"
          title="Setup A"
          config={configA}
          onChange={(patch) => setConfigA((current) => ({ ...current, ...patch }))}
        />
        <SetupCard
          id="b"
          title="Setup B"
          config={configB}
          onChange={(patch) => setConfigB((current) => ({ ...current, ...patch }))}
        />
      </div>

      <div className="compare-actions">
        <button
          type="button"
          className="button ghost"
          onClick={() => setConfigB({ ...configA })}
        >
          Copy A to B
        </button>
      </div>

      <section className="diff-grid" aria-label="Main differences">
        <DiffCard
          label="Total cost"
          aValue={`$${resultA.summary.totalCost.toFixed(2)}`}
          bValue={`$${resultB.summary.totalCost.toFixed(2)}`}
          change={percentText(resultA.summary.totalCost, resultB.summary.totalCost)}
        />
        <DiffCard
          label="Average wait"
          aValue={`${resultA.summary.avgWait.toFixed(1)} min`}
          bValue={`${resultB.summary.avgWait.toFixed(1)} min`}
          change={percentText(resultA.summary.avgWait, resultB.summary.avgWait)}
        />
        <DiffCard
          label="Utilization"
          aValue={`${Math.round(resultA.summary.utilizationPct)}%`}
          bValue={`${Math.round(resultB.summary.utilizationPct)}%`}
          change={
            Math.abs(utilDelta) < 0.1
              ? 'About the same'
              : `B is ${Math.abs(utilDelta).toFixed(1)} points ${utilDelta > 0 ? 'higher' : 'lower'}`
          }
        />
      </section>

      <div className="insight-card" aria-live="polite">
        <p className="insight-label">What this shows</p>
        <p>{insight}</p>
      </div>

      <section className="card" aria-labelledby="compare-table-title">
        <div className="card-head">
          <div>
            <h2 id="compare-table-title" className="section-title">
              Full comparison
            </h2>
            <p className="card-subtitle">Difference is B minus A.</p>
          </div>
        </div>
        <TableWrap label="Full comparison of setup A and setup B">
          <table className="compare-table">
            <caption className="sr-only">
              Metrics for setup A and setup B with the difference
            </caption>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col">A</th>
                <th scope="col">B</th>
                <th scope="col">Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Average wait</th>
                <td>{resultA.summary.avgWait.toFixed(1)} min</td>
                <td>{resultB.summary.avgWait.toFixed(1)} min</td>
                <td>{formatDelta(resultA.summary.avgWait, resultB.summary.avgWait, ' min')}</td>
              </tr>
              <tr>
                <th scope="row">Average completion</th>
                <td>{resultA.summary.avgCompletion.toFixed(1)} min</td>
                <td>{resultB.summary.avgCompletion.toFixed(1)} min</td>
                <td>
                  {formatDelta(
                    resultA.summary.avgCompletion,
                    resultB.summary.avgCompletion,
                    ' min',
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Utilization</th>
                <td>{Math.round(resultA.summary.utilizationPct)}%</td>
                <td>{Math.round(resultB.summary.utilizationPct)}%</td>
                <td>{formatDelta(resultA.summary.utilizationPct, resultB.summary.utilizationPct, ' pts')}</td>
              </tr>
              <tr>
                <th scope="row">Total cost</th>
                <td>${resultA.summary.totalCost.toFixed(2)}</td>
                <td>${resultB.summary.totalCost.toFixed(2)}</td>
                <td>{formatDelta(resultA.summary.totalCost, resultB.summary.totalCost, '', true)}</td>
              </tr>
              <tr>
                <th scope="row">Tasks finished</th>
                <td>
                  {resultA.summary.tasksFinished}/{resultA.summary.taskCount}
                </td>
                <td>
                  {resultB.summary.tasksFinished}/{resultB.summary.taskCount}
                </td>
                <td>{resultB.summary.tasksFinished - resultA.summary.tasksFinished}</td>
              </tr>
              <tr>
                <th scope="row">Restarts</th>
                <td>{resultA.summary.restarts}</td>
                <td>{resultB.summary.restarts}</td>
                <td>{resultB.summary.restarts - resultA.summary.restarts}</td>
              </tr>
              <tr>
                <th scope="row">Peak servers</th>
                <td>{resultA.summary.peakServers}</td>
                <td>{resultB.summary.peakServers}</td>
                <td>{resultB.summary.peakServers - resultA.summary.peakServers}</td>
              </tr>
              <tr>
                <th scope="row">Peak queue</th>
                <td>{resultA.summary.peakQueueLength}</td>
                <td>{resultB.summary.peakQueueLength}</td>
                <td>{resultB.summary.peakQueueLength - resultA.summary.peakQueueLength}</td>
              </tr>
            </tbody>
          </table>
        </TableWrap>
      </section>
    </div>
  );
}

function formatDelta(a: number, b: number, unit: string, money = false): string {
  const difference = b - a;
  if (Math.abs(difference) < 0.0001) return '0';
  const sign = difference > 0 ? '+' : '−';
  return money
    ? `${sign}$${Math.abs(difference).toFixed(2)}`
    : `${sign}${Math.abs(difference).toFixed(1)}${unit}`;
}
