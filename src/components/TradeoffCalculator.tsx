import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_TRADEOFF_ROWS,
  percentDifference,
  tradeoffCost,
} from '../engine/tradeoff';
import { TableWrap } from './TableWrap';
import { Term } from './Term';

interface RowState {
  id: string;
  label: string;
  hours: number;
}

interface DraftNumberProps {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  label?: string;
  onChange: (value: number) => void;
}

function DraftNumber({
  id,
  value,
  min,
  max,
  step,
  label,
  onChange,
}: DraftNumberProps) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  return (
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      aria-label={label}
      onFocus={() => setEditing(true)}
      onBlur={() => {
        setEditing(false);
        const parsed = Number(draft);
        const next =
          draft.trim() === '' || !Number.isFinite(parsed)
            ? value
            : Math.min(max, Math.max(min, parsed));
        setDraft(String(next));
        if (next !== value) onChange(next);
      }}
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);
        const next = Number(raw);
        if (raw.trim() !== '' && Number.isFinite(next)) {
          onChange(Math.min(max, Math.max(min, next)));
        }
      }}
    />
  );
}

export function TradeoffCalculator() {
  const [rate, setRate] = useState(0.384);
  const [rows, setRows] = useState<RowState[]>(
    DEFAULT_TRADEOFF_ROWS.map((row) => ({ ...row })),
  );

  const costs = useMemo(
    () => rows.map((row) => tradeoffCost(row.hours, rate)),
    [rows, rate],
  );
  const base = costs[0] ?? 0;

  return (
    <section className="card tradeoff-panel" aria-labelledby="tradeoff-title">
      <div className="card-head">
        <div>
          <h2 id="tradeoff-title" className="section-title">
            Trade-off calculator
          </h2>
          <p className="card-subtitle">
            One day is 24 hours. Change the rate or the server hours.
          </p>
        </div>
      </div>

      <div className="rate-line">
        <label htmlFor="tradeoff-rate">Rate per server hour ($)</label>
        <DraftNumber
          id="tradeoff-rate"
          value={rate}
          min={0}
          max={5}
          step={0.001}
          onChange={setRate}
        />
      </div>

      <TableWrap label="Daily cost by setup">
        <table className="tradeoff-table">
          <caption>
            Daily cost by setup. The last column compares each setup with fixed 1 server.
          </caption>
          <thead>
            <tr>
              <th scope="col">Setup</th>
              <th scope="col">Server hours</th>
              <th scope="col">Cost per day</th>
              <th scope="col">vs fixed 1</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const difference = percentDifference(costs[index], base);
              return (
                <tr key={row.id}>
                  <th scope="row">
                    {row.label}
                    {row.id === 'auto' ? (
                      <span className="inline-term">
                        {' '}
                        <Term term="Auto-scaling" showText={false} />
                      </span>
                    ) : null}
                  </th>
                  <td>
                    <DraftNumber
                      id={`hours-${row.id}`}
                      value={row.hours}
                      min={0}
                      max={1000}
                      step={1}
                      label={`Server hours for ${row.label}`}
                      onChange={(hours) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id ? { ...item, hours } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <strong>${costs[index].toFixed(2)}</strong>
                  </td>
                  <td>
                    {index === 0
                      ? 'Baseline'
                      : `${difference >= 0 ? '+' : ''}${difference.toFixed(0)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>

      <p className="tradeoff-note">
        Auto-scaling is not instant. Users see a short slowdown at the start of a spike. That delay
        is why auto-scale hours (30) are above one fixed server (24), but well below four (96).
      </p>
    </section>
  );
}
