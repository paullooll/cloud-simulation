import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Frame } from '../engine/types';
import { TableWrap } from './TableWrap';

interface LiveChartsProps {
  frames: Frame[];
  frameIndex: number;
  current: Frame;
}

interface ChartRow {
  minute: number;
  queue: number;
  utilization: number;
  cost: number;
  servers: number;
}

function useChartData(frames: Frame[], frameIndex: number): ChartRow[] {
  return useMemo(() => {
    const upto = frames.slice(0, frameIndex + 1);
    if (upto.length === 0) return [];
    const step = Math.max(1, Math.ceil(upto.length / 140));
    const sampled = upto.filter(
      (_, index) => index % step === 0 || index === upto.length - 1,
    );
    return sampled.map((frame) => ({
      minute: frame.minute,
      queue: frame.queueLength,
      utilization: Number(frame.utilizationPct.toFixed(1)),
      cost: Number(frame.totalCost.toFixed(3)),
      servers: frame.activeServers,
    }));
  }, [frames, frameIndex]);
}

interface ChartCardProps {
  title: string;
  summary: string;
  data: ChartRow[];
  dataKey: 'queue' | 'utilization' | 'cost';
  color: string;
  unit: string;
  formatValue: (value: number) => string;
}

function ChartCard({
  title,
  summary,
  data,
  dataKey,
  color,
  unit,
  formatValue,
}: ChartCardProps) {
  return (
    <figure className="chart-card">
      <figcaption>
        <h4>{title}</h4>
        <p>{summary}</p>
      </figcaption>
      <div
        className="chart-canvas"
        role="img"
        aria-label={`${title}. ${summary}`}
      >
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="#E7E2D9" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="minute"
              tick={{ fontSize: 10, fill: '#5B6273' }}
              tickLine={false}
              axisLine={{ stroke: '#D8D2C7' }}
              minTickGap={18}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#5B6273' }}
              tickLine={false}
              axisLine={false}
              width={44}
              allowDecimals={dataKey !== 'queue'}
            />
            <Tooltip
              cursor={{ stroke: '#B9B2A6', strokeDasharray: '3 3' }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #D8D2C7',
                background: '#FFFFFF',
              }}
              labelFormatter={(label) => `Minute ${label}`}
              formatter={(value) => [
                `${Number(value).toFixed(dataKey === 'cost' ? 2 : 0)}${unit}`,
                title,
              ]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name={title}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-mobile-value">
        Latest: <strong>{formatValue(Number(data[data.length - 1]?.[dataKey] ?? 0))}</strong>
      </p>
    </figure>
  );
}

export function LiveCharts({ frames, frameIndex, current }: LiveChartsProps) {
  const data = useChartData(frames, frameIndex);
  const minute = current.minute;

  const tableRows = useMemo(() => {
    const upto = frames.slice(0, frameIndex + 1);
    if (upto.length === 0) return [];
    const step = Math.max(1, Math.ceil(upto.length / 40));
    return upto.filter(
      (_, index) => index % step === 0 || index === upto.length - 1,
    );
  }, [frames, frameIndex]);

  return (
    <section className="charts" aria-label="Live charts">
      <div className="chart-grid">
        <ChartCard
          title="Queue length"
          summary={`${current.queueLength} tasks are waiting at minute ${minute}.`}
          data={data}
          dataKey="queue"
          color="#4F46E5"
          unit=" tasks"
          formatValue={(value) => `${Math.round(value)} tasks`}
        />
        <ChartCard
          title="CPU utilization"
          summary={`Utilization is ${Math.round(current.utilizationPct)}% at minute ${minute}.`}
          data={data}
          dataKey="utilization"
          color="#1F2533"
          unit="%"
          formatValue={(value) => `${Math.round(value)}%`}
        />
        <ChartCard
          title="Running cost"
          summary={`Running cost is $${current.totalCost.toFixed(2)} at minute ${minute}.`}
          data={data}
          dataKey="cost"
          color="#FF6B5E"
          unit=" USD"
          formatValue={(value) => `$${value.toFixed(2)}`}
        />
      </div>

      <details className="chart-data">
        <summary>Show chart data table</summary>
        <TableWrap label="Live chart data">
          <table>
            <caption>
              Live chart values up to minute {minute}. Sampled for reading.
            </caption>
            <thead>
              <tr>
                <th scope="col">Minute</th>
                <th scope="col">Queue</th>
                <th scope="col">Utilization</th>
                <th scope="col">Cost</th>
                <th scope="col">Servers</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((frame) => (
                <tr key={frame.minute}>
                  <td>{frame.minute}</td>
                  <td>{frame.queueLength}</td>
                  <td>{Math.round(frame.utilizationPct)}%</td>
                  <td>${frame.totalCost.toFixed(2)}</td>
                  <td>{frame.activeServers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </details>
    </section>
  );
}
