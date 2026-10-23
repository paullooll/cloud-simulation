import { useMemo, useState } from 'react';
import { TableWrap } from '../components/TableWrap';
import { Term } from '../components/Term';
import { makeConfig } from '../engine/defaults';
import { percentChange } from '../engine/insights';
import { PRICING_INFO } from '../engine/pricing';
import { simulate } from '../engine/simulate';
import type { SimConfig } from '../engine/types';

const DEMO_SEED = 16;

const base = {
  preset: 'spike' as const,
  seed: DEMO_SEED,
  startingServers: 1,
  maxServers: 4,
  horizon: 600,
};

const STEP_CONFIGS: SimConfig[] = [
  makeConfig({ ...base, autoScale: false, policy: 'fcfs', pricing: 'ondemand' }),
  makeConfig({ ...base, autoScale: true, policy: 'fcfs', pricing: 'ondemand' }),
  makeConfig({ ...base, autoScale: true, policy: 'fcfs', pricing: 'spot' }),
  makeConfig({
    ...base,
    autoScale: true,
    policy: 'rr',
    pricing: 'spot',
    timeSlice: 2,
  }),
];

const STEP_TITLES = [
  'Auto-scaling off',
  'Auto-scaling on',
  'Switch to spot',
  'Switch to Round Robin',
];

const STEP_ACTIONS = [
  'One server. No auto-scaling. FCFS scheduling. On-demand pricing.',
  'Same workload and seed. Auto-scaling is on, from 1 to 4 servers.',
  'Same settings. Pricing changes from on-demand to spot.',
  'Same settings. The scheduler changes from FCFS to Round Robin.',
];

function pct(from: number, to: number): string {
  const change = percentChange(from, to);
  if (change === null) return '0';
  return Math.abs(change).toFixed(0);
}

function direction(change: number): 'cuts' | 'raises' {
  return change <= 0 ? 'cuts' : 'raises';
}

interface DemoPageProps {
  onApplyConfig: (config: SimConfig) => void;
}

export function DemoPage({ onApplyConfig }: DemoPageProps) {
  const [step, setStep] = useState(0);
  const results = useMemo(() => STEP_CONFIGS.map((config) => simulate(config)), []);
  const current = results[step];
  const summary = current.summary;

  const waitChange = percentChange(results[0].summary.avgWait, results[1].summary.avgWait) ?? 0;
  const costChange = percentChange(results[0].summary.totalCost, results[1].summary.totalCost) ?? 0;
  const spotCostChange =
    percentChange(results[1].summary.totalCost, results[2].summary.totalCost) ?? 0;
  const maxWaitChange = percentChange(results[2].summary.maxWait, results[3].summary.maxWait) ?? 0;

  const sentences = [
    `With auto-scaling off, average wait is ${results[0].summary.avgWait.toFixed(1)} min and the queue peaks at ${results[0].summary.peakQueueLength} tasks.`,
    `Auto-scaling ${direction(waitChange)} average wait by ${pct(results[0].summary.avgWait, results[1].summary.avgWait)}% and ${direction(costChange)} cost by ${pct(results[0].summary.totalCost, results[1].summary.totalCost)}%.`,
    `Spot pricing ${direction(spotCostChange)} cost by ${pct(results[1].summary.totalCost, results[2].summary.totalCost)}%, and ${results[2].summary.restarts} ${results[2].summary.restarts === 1 ? 'task restarts' : 'tasks restart'} after an interruption.`,
    `Round Robin gives every task a turn, and ${direction(maxWaitChange)} the longest wait from ${results[2].summary.maxWait.toFixed(0)} to ${results[3].summary.maxWait.toFixed(0)} min.`,
  ];

  const config = STEP_CONFIGS[step];
  const last = STEP_CONFIGS.length - 1;

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Guided demo · 4 steps</p>
        <h1 className="page-title">Four choices, four results.</h1>
        <p className="page-lede">
          Each step changes one thing. The workload and seed stay the same, so the numbers are
          comparable.
        </p>
      </header>

      <nav className="stepper-nav" aria-label="Demo steps">
        <ol className="stepper">
          {STEP_TITLES.map((title, index) => (
            <li key={title}>
              <button
                type="button"
                className={`step-button${index === step ? ' is-active' : ''}`}
                aria-current={index === step ? 'step' : undefined}
                onClick={() => setStep(index)}
              >
                <span className="step-number">{index + 1}</span>
                <span>{title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section className="card demo-card" aria-labelledby="demo-step-title">
        <div className="card-head">
          <div>
            <p className="eyebrow">Step {step + 1} of 4</p>
            <h2 id="demo-step-title" className="section-title">
              {STEP_TITLES[step]}
            </h2>
            <p className="card-subtitle">{STEP_ACTIONS[step]}</p>
          </div>
          <p className="run-tag">Seed {DEMO_SEED}</p>
        </div>

        <div className="config-chips" aria-label="Current settings">
          <span className="config-chip">
            Auto-scaling: <strong>{config.autoScale ? 'On' : 'Off'}</strong>
          </span>
          <span className="config-chip">
            Pricing: <strong>{PRICING_INFO[config.pricing].label}</strong>
          </span>
          <span className="config-chip">
            Scheduler: <strong>{config.policy.toUpperCase()}</strong>
          </span>
          <span className="config-chip">
            Servers: <strong>{config.startingServers}</strong> start ·{' '}
            <strong>{config.maxServers}</strong> max
          </span>
        </div>

        <blockquote className="demo-sentence" aria-live="polite">
          {sentences[step]}
        </blockquote>

        <div className="metric-grid demo-metrics">
          <div className="metric">
            <p className="metric-label">
              Average wait <Term term="Wait time" showText={false} />
            </p>
            <p className="metric-value">{summary.avgWait.toFixed(1)} min</p>
          </div>
          <div className="metric">
            <p className="metric-label">Total cost</p>
            <p className="metric-value">${summary.totalCost.toFixed(2)}</p>
          </div>
          <div className="metric">
            <p className="metric-label">
              Utilization <Term term="Utilization" showText={false} />
            </p>
            <p className="metric-value">{Math.round(summary.utilizationPct)}%</p>
          </div>
          <div className="metric">
            <p className="metric-label">
              Restarts <Term term="Spot interruption" showText={false} />
            </p>
            <p className="metric-value">{summary.restarts}</p>
          </div>
          <div className="metric">
            <p className="metric-label">Peak servers</p>
            <p className="metric-value">{summary.peakServers}</p>
          </div>
        </div>

        <div className="demo-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
          >
            Back
          </button>
          {step < last ? (
            <button
              type="button"
              className="button primary"
              onClick={() => setStep((value) => Math.min(last, value + 1))}
            >
              Next step
            </button>
          ) : (
            <button type="button" className="button primary" onClick={() => setStep(0)}>
              Restart demo
            </button>
          )}
          <button
            type="button"
            className="button ghost"
            onClick={() => onApplyConfig(STEP_CONFIGS[step])}
          >
            Open this setup in the simulator
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="all-steps-title">
        <div className="card-head">
          <div>
            <h2 id="all-steps-title" className="section-title">
              All four steps
            </h2>
            <p className="card-subtitle">Same workload, same seed.</p>
          </div>
        </div>
        <TableWrap label="Results for all four demo steps">
          <table className="compare-table">
            <caption className="sr-only">
              Results for each guided demo step
            </caption>
            <thead>
              <tr>
                <th scope="col">Step</th>
                <th scope="col">Setup</th>
                <th scope="col">Average wait</th>
                <th scope="col">Cost</th>
                <th scope="col">Restarts</th>
                <th scope="col">Peak servers</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={STEP_TITLES[index]} className={index === step ? 'is-current' : ''}>
                  <td>{index + 1}</td>
                  <th scope="row">{STEP_TITLES[index]}</th>
                  <td>{result.summary.avgWait.toFixed(1)} min</td>
                  <td>${result.summary.totalCost.toFixed(2)}</td>
                  <td>{result.summary.restarts}</td>
                  <td>{result.summary.peakServers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>
    </div>
  );
}
