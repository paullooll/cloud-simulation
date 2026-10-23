import { scheduleSequential } from '../engine/schedulers';
import { TableWrap } from './TableWrap';

const exampleTasks = [
  { id: 'A', arrival: 0, length: 10, priority: 2 },
  { id: 'B', arrival: 0, length: 2, priority: 2 },
  { id: 'C', arrival: 0, length: 1, priority: 2 },
];

export function SchedulerExample() {
  const fcfs = scheduleSequential(exampleTasks, 'fcfs');
  const sjf = scheduleSequential(exampleTasks, 'sjf');

  return (
    <section className="card example-panel" id="scheduler-example" aria-labelledby="example-title">
      <div className="card-head">
        <div>
          <h2 id="example-title" className="section-title">
            Scheduler example
          </h2>
          <p className="card-subtitle">
            Three tasks arrive together: A = 10 min, B = 2 min, C = 1 min.
          </p>
        </div>
        <p className="run-tag">Computed live</p>
      </div>

      <TableWrap label="Scheduler example results">
        <table className="example-table">
          <caption className="sr-only">
            Wait times for the three tasks under FCFS and SJF
          </caption>
          <thead>
            <tr>
              <th scope="col">Scheduler</th>
              <th scope="col">Order</th>
              <th scope="col">Waits (min)</th>
              <th scope="col">Average wait</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">FCFS</th>
              <td>{fcfs.order.join(' → ')}</td>
              <td>{fcfs.waits.join(', ')}</td>
              <td>
                <strong>{fcfs.avgWait.toFixed(1)} min</strong>
              </td>
            </tr>
            <tr>
              <th scope="row">SJF</th>
              <td>{sjf.order.join(' → ')}</td>
              <td>{sjf.waits.join(', ')}</td>
              <td>
                <strong>{sjf.avgWait.toFixed(1)} min</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </TableWrap>

      <p className="example-note">
        These numbers come from the same scheduler functions the simulation uses. SJF cuts the
        average wait from 7.3 to 1.3 min. Short tasks still wait behind long ones in FCFS.
      </p>
    </section>
  );
}
