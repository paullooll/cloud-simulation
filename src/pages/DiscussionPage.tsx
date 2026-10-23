import { useState } from 'react';
import { Term } from '../components/Term';

export function DiscussionPage() {
  const [show, setShow] = useState(false);

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Discussion</p>
        <h1 className="page-title">Two questions for the class.</h1>
        <p className="page-lede">
          Think first. Then open the guidance and compare your answer.
        </p>
      </header>

      <div className="discussion-actions">
        <button
          type="button"
          className="button primary"
          aria-expanded={show}
          aria-controls="guidance"
          onClick={() => setShow((value) => !value)}
        >
          {show ? 'Hide guidance' : 'Show guidance'}
        </button>
      </div>

      <div className="discussion-grid">
        <section className="card question-card" aria-labelledby="question-1">
          <p className="question-number">Question 1</p>
          <h2 id="question-1">
            A shop&apos;s website is busy only during sales. Which scaling and pricing choices would
            you use, and why?
          </h2>
          <p className="question-hint">
            Consider the base load, the sale spike, and the customer-facing risk.
          </p>
        </section>

        <section className="card question-card" aria-labelledby="question-2">
          <p className="question-number">Question 2</p>
          <h2 id="question-2">
            A nightly batch job can restart. When would you use spot instances, and what is the
            risk?
          </h2>
          <p className="question-hint">
            Consider urgency, restart cost, checkpoints, and a fallback plan.
          </p>
        </section>
      </div>

      <section
        id="guidance"
        className={`card guidance-card${show ? ' is-visible' : ''}`}
        aria-labelledby="guidance-title"
        hidden={!show}
      >
        <div className="card-head">
          <div>
            <p className="eyebrow">Guidance</p>
            <h2 id="guidance-title" className="section-title">
              Short answers
            </h2>
          </div>
        </div>

        <div className="guidance-grid">
          <div>
            <h3>Question 1</h3>
            <ul>
              <li>
                Use horizontal auto-scaling inside a small base and a higher maximum.
              </li>
              <li>
                Put the steady base on commitment pricing. Add sale-time servers on on-demand.
              </li>
              <li>
                Add a <Term term="Load balancer">load balancer</Term> and schedule extra capacity
                before the sale starts.
              </li>
              <li>Avoid spot for the customer-facing site. Interruptions hurt buyers.</li>
            </ul>
          </div>
          <div>
            <h3>Question 2</h3>
            <ul>
              <li>
                Use spot when the job is not urgent and can restart or resume from a{' '}
                <Term term="Checkpoint">checkpoint</Term>.
              </li>
              <li>Risk: interruption, wasted work, delay, and half-finished data.</li>
              <li>
                Reduce risk with checkpoints, small tasks, and an on-demand fallback for the last
                part.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className={`insight-card ${show ? '' : 'is-muted'}`}>
        <p className="insight-label">Big message</p>
        <p>Every choice trades something. Faster costs more. Cheaper adds risk.</p>
      </div>
    </div>
  );
}
