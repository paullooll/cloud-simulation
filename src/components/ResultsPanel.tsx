import { makeInsight } from '../engine/insights';
import type { SimResult } from '../engine/types';
import { Term } from './Term';

interface ResultsPanelProps {
  result: SimResult;
}

interface MetricProps {
  label: string;
  term?: string;
  value: string;
  detail?: string;
  accent?: boolean;
}

function Metric({ label, term, value, detail, accent }: MetricProps) {
  return (
    <div className={`metric${accent ? ' is-accent' : ''}`}>
      <p className="metric-label">
        {label}
        {term ? <Term term={term} showText={false} /> : null}
      </p>
      <p className="metric-value">{value}</p>
      {detail ? <p className="metric-detail">{detail}</p> : null}
    </div>
  );
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const summary = result.summary;
  const insight = makeInsight(result);

  return (
    <section className="card results" aria-labelledby="results-title">
      <div className="card-head">
        <div>
          <h2 id="results-title" className="section-title">
            Results
          </h2>
          <p className="card-subtitle">Final numbers for the full run.</p>
        </div>
        <p className="run-tag">
          {result.config.policy.toUpperCase()} · {result.config.pricing} · {result.summary.duration}{' '}
          min
        </p>
      </div>

      <div className="metric-grid">
        <Metric
          label="Average wait"
          term="Wait time"
          value={`${summary.avgWait.toFixed(1)} min`}
          detail="Start minus arrival"
        />
        <Metric
          label="Average completion"
          term="Completion time"
          value={`${summary.avgCompletion.toFixed(1)} min`}
          detail="Finish minus arrival"
        />
        <Metric
          label="Server utilization"
          term="Utilization"
          value={`${Math.round(summary.utilizationPct)}%`}
          detail="Busy time ÷ available time"
        />
        <Metric
          label="Total cost"
          value={`$${summary.totalCost.toFixed(2)}`}
          detail="From server hours"
          accent
        />
        <Metric
          label="Tasks finished"
          value={`${summary.tasksFinished}/${summary.taskCount}`}
          detail={`${summary.totalTaskMinutes} min of work`}
        />
        <Metric
          label="Restarts (spot)"
          term="Restart"
          value={`${summary.restarts}`}
          detail="Tasks sent back to 0"
        />
        <Metric
          label="Peak servers used"
          value={`${summary.peakServers}`}
          detail={`max ${result.config.maxServers} allowed`}
        />
        <Metric
          label="Peak queue"
          term="Queue"
          value={`${summary.peakQueueLength}`}
          detail="Most tasks waiting"
        />
      </div>

      {summary.unfinished > 0 ? (
        <p className="warning">
          {summary.unfinished} tasks did not finish inside the {result.config.horizon}-minute
          window. Increase max servers or use a shorter workload.
        </p>
      ) : null}

      <div className="insight-card" aria-live="polite">
        <p className="insight-label">What this shows</p>
        <p>{insight}</p>
      </div>
    </section>
  );
}
