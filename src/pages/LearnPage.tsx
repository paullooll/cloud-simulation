import type { ReactNode } from 'react';
import { TableWrap } from '../components/TableWrap';
import { Term } from '../components/Term';

interface LearnCard {
  title: string;
  body: ReactNode;
  wide?: boolean;
}

const cards: LearnCard[] = [
  {
    title: 'Resources and lifecycle',
    body: (
      <>
        <p>
          <Term term="Cloud resource">Cloud resources</Term> are servers, storage, and network
          capacity you rent. A resource has a <Term term="Lifecycle">lifecycle</Term>: create, use,
          stop, and delete.
        </p>
        <p>Forgotten resources still cost money in many cloud services.</p>
      </>
    ),
  },
  {
    title: 'Resource management goals',
    body: (
      <>
        <p>
          <Term term="Resource management">Resource management</Term> matches capacity to demand.
        </p>
        <p>
          The goals are short waits, high <Term term="Utilization">utilization</Term>, low cost, and
          a reliable service. These goals pull against each other.
        </p>
      </>
    ),
  },
  {
    title: 'Provisioning: static vs dynamic',
    body: (
      <>
        <p>
          <Term term="Static provisioning">Static provisioning</Term> reserves a fixed amount of
          capacity. <Term term="Dynamic provisioning">Dynamic provisioning</Term> adds or removes
          capacity as load changes.
        </p>
        <p>Static is simple but can waste money. Dynamic needs metrics and rules.</p>
      </>
    ),
  },
  {
    title: 'Auto-scaling: horizontal vs vertical',
    body: (
      <>
        <p>
          <Term term="Horizontal scaling">Horizontal scaling</Term> adds or removes servers (
          <Term term="Scale out">scale out</Term> and <Term term="Scale in">scale in</Term>).{' '}
          <Term term="Vertical scaling">Vertical scaling</Term> makes one server bigger or smaller.
        </p>
        <p>
          <Term term="Auto-scaling">Auto-scaling</Term> needs thresholds, a{' '}
          <Term term="Cooldown">cooldown</Term>, and time for a new server to start.
        </p>
      </>
    ),
  },
  {
    title: 'Metrics: latency, throughput, utilization, SLA',
    body: (
      <>
        <p>
          <Term term="Latency">Latency</Term> is the time from request to response.{' '}
          <Term term="Throughput">Throughput</Term> is the number of tasks finished per unit of
          time.
        </p>
        <p>
          <Term term="Utilization">Utilization</Term> is busy time divided by available time. An{' '}
          <Term term="SLA">SLA</Term> is a promise about service quality.
        </p>
      </>
    ),
  },
  {
    title: 'Scheduling basics',
    body: (
      <>
        <p>
          A <Term term="Scheduling">scheduler</Term> picks the next task for a free server.{' '}
          <Term term="FCFS">FCFS</Term> is fair, but a long task can block short ones.{' '}
          <Term term="SJF">SJF</Term> lowers average wait, but long tasks can starve.
        </p>
        <p>
          <Term term="Round Robin">Round Robin</Term> gives each task a turn.{' '}
          <Term term="Priority">Priority</Term> follows business importance.
        </p>
      </>
    ),
  },
  {
    title: 'Cloud scheduling levels',
    body: (
      <>
        <p>Cloud scheduling happens at more than one level.</p>
        <p>
          The provider places virtual machines on physical hosts. Your platform schedules
          containers or tasks on those virtual machines. Each level has its own view of capacity.
        </p>
      </>
    ),
  },
  {
    title: 'Advanced scheduling',
    body: (
      <>
        <p>Advanced schedulers look at more than arrival order.</p>
        <p>
          They may use deadlines, dependencies, data location, or cost. Some systems backfill small
          jobs into gaps while a large job waits.
        </p>
      </>
    ),
  },
  {
    title: 'Pricing models',
    wide: true,
    body: (
      <>
        <p>
          <Term term="On-demand">On-demand</Term> charges per hour with no commitment.{' '}
          <Term term="Reserved">Reserved</Term> or <Term term="Committed use">committed pricing</Term>{' '}
          lowers the rate when you promise to use capacity.{' '}
          <Term term="Spot">Spot</Term> uses spare capacity at a deep discount, but the provider can
          take it back.
        </p>
        <TableWrap label="Pricing model names by provider" className="pricing-table-wrap">
          <table className="pricing-table">
            <caption>Pricing model names by provider</caption>
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">AWS</th>
                <th scope="col">Azure</th>
                <th scope="col">Google Cloud</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Pay as you go</th>
                <td>On-Demand</td>
                <td>Pay-as-you-go</td>
                <td>On-demand</td>
              </tr>
              <tr>
                <th scope="row">Commitment</th>
                <td>
                  Reserved Instances / <Term term="Savings Plan">Savings Plans</Term>
                </td>
                <td>Reservations</td>
                <td>Committed use discounts</td>
              </tr>
              <tr>
                <th scope="row">Spare capacity</th>
                <td>Spot Instances</td>
                <td>
                  <Term term="Spot VM">Spot VMs</Term>
                </td>
                <td>
                  <Term term="Spot VM">Spot VMs</Term>
                </td>
              </tr>
            </tbody>
          </table>
        </TableWrap>
      </>
    ),
  },
  {
    title: 'Cost optimization methods',
    body: (
      <>
        <p>
          <Term term="Cost optimization">Cost optimization</Term> starts with right-sizing: do not
          pay for idle capacity.
        </p>
        <p>
          Use auto-scaling for changeable load, commitment pricing for steady work, and spot for
          restartable batch work. Delete unused resources and set budgets.
        </p>
      </>
    ),
  },
  {
    title: 'Trade-offs',
    body: (
      <>
        <p>Every choice trades something.</p>
        <p>
          More servers cut wait time and raise cost. Spot cuts cost but adds restart risk.
          Auto-scaling saves money, but new servers start late, so a spike still causes a short
          slowdown.
        </p>
      </>
    ),
  },
];

export function LearnPage() {
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Learn</p>
        <h1 className="page-title">The ideas behind the lab.</h1>
        <p className="page-lede">
          Short cards for the talk. Tap the ? marks for a definition.
        </p>
      </header>

      <div className="learn-grid">
        {cards.map((card) => (
          <section
            key={card.title}
            className={`card learn-card${card.wide ? ' is-wide' : ''}`}
            aria-labelledby={`learn-${card.title.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <h2 id={`learn-${card.title.replace(/\s+/g, '-').toLowerCase()}`}>{card.title}</h2>
            {card.body}
          </section>
        ))}
      </div>
    </div>
  );
}
