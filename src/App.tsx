import { useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from './hooks/useMediaQuery';
import { ComparePage } from './pages/ComparePage';
import { DemoPage } from './pages/DemoPage';
import { SimulatePage } from './pages/SimulatePage';
import { DEFAULT_CONFIG, makeConfig } from './engine/defaults';
import { simulate } from './engine/simulate';
import type { SimConfig } from './engine/types';

type Tab = 'simulate' | 'compare' | 'demo';

const TABS: { id: Tab; label: string; demo?: boolean }[] = [
  { id: 'simulate', label: 'Simulate' },
  { id: 'compare', label: 'Compare' },
  { id: 'demo', label: 'Guided demo', demo: true },
];

function getInitialLargeText(): boolean {
  try {
    return window.localStorage.getItem('crl-large-text') === 'true';
  } catch {
    return false;
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('simulate');
  const [config, setConfig] = useState<SimConfig>(() => makeConfig(DEFAULT_CONFIG));
  const [largeText, setLargeText] = useState(getInitialLargeText);
  const narrow = useMediaQuery('(max-width: 720px)');
  const result = useMemo(() => simulate(config), [config]);

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
    try {
      window.localStorage.setItem('crl-large-text', String(largeText));
    } catch {
      // Ignore storage failures. The toggle still works for this session.
    }
  }, [largeText]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const updateConfig = (patch: Partial<SimConfig>) => {
    setConfig((current) => makeConfig({ ...current, ...patch }));
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="shell header-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" width="40" height="40" role="presentation">
                <rect x="2" y="2" width="36" height="36" rx="11" fill="#1F2533" />
                <path
                  d="M12 24.5a4 4 0 0 1 .6-7.95A5.5 5.5 0 0 1 23.4 15a4.5 4.5 0 0 1 4.6 7.5H12Z"
                  fill="#F7F5F1"
                />
                <rect x="12" y="27" width="7" height="3" rx="1" fill="#FF6B5E" />
                <rect x="21" y="27" width="4" height="3" rx="1" fill="#4F46E5" />
              </svg>
            </span>
            <span className="brand-text">
              <span className="brand-name">Cloud Resource Lab</span>
              <span className="brand-sub">
                Management, scheduling, and cost optimization
              </span>
            </span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="text-toggle"
              aria-pressed={largeText}
              onClick={() => setLargeText((value) => !value)}
            >
              <span aria-hidden="true">A+</span>
              <span>{largeText ? 'Large text: on' : 'Large text: off'}</span>
            </button>
          </div>
        </div>

        <nav className="site-nav" aria-label="Sections">
          <div className="shell nav-inner">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-tab${item.demo ? ' is-demo' : ''}${tab === item.id ? ' is-active' : ''}`}
                aria-current={tab === item.id ? 'page' : undefined}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main id="main-content" className="shell main-shell">
        {tab === 'simulate' ? (
          <SimulatePage
            config={config}
            result={result}
            narrow={narrow}
            onChange={updateConfig}
          />
        ) : null}
        {tab === 'compare' ? <ComparePage /> : null}
        {tab === 'demo' ? (
          <DemoPage
            onApplyConfig={(next) => {
              setConfig(makeConfig(next));
              setTab('simulate');
            }}
          />
        ) : null}
      </main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <p>
            Cloud Resource Lab · frontend-only simulation. No accounts, no backend, no stored
            secrets.
          </p>
          <p>For a 15-minute class talk · WVSU CICT</p>
        </div>
      </footer>
    </>
  );
}
