import { useEffect, useState } from 'react';
import { LiveView } from '../components/LiveView';
import { ResultsPanel } from '../components/ResultsPanel';
import { SchedulerExample } from '../components/SchedulerExample';
import { SettingsPanel } from '../components/SettingsPanel';
import { TradeoffCalculator } from '../components/TradeoffCalculator';
import type { SimConfig, SimResult } from '../engine/types';

interface SimulatePageProps {
  config: SimConfig;
  result: SimResult;
  narrow: boolean;
  onChange: (patch: Partial<SimConfig>) => void;
}

const SPEED_DELAY: Record<number, number> = {
  1: 320,
  2: 160,
  5: 64,
  10: 32,
};

export function SimulatePage({ config, result, narrow, onChange }: SimulatePageProps) {
  const lastIndex = result.frames.length - 1;
  const [frameIndex, setFrameIndex] = useState(lastIndex);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);

  useEffect(() => {
    setPlaying(false);
    setFrameIndex(result.frames.length - 1);
  }, [result]);

  useEffect(() => {
    if (!playing) return;
    if (frameIndex >= lastIndex) {
      setPlaying(false);
      return;
    }
    const delay = SPEED_DELAY[speed] ?? 160;
    const timer = window.setTimeout(() => {
      setFrameIndex((value) => Math.min(value + 1, lastIndex));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [playing, frameIndex, lastIndex, speed]);

  const safeIndex = Math.min(frameIndex, lastIndex);
  const frame = result.frames[safeIndex];

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (frameIndex >= lastIndex) setFrameIndex(0);
    setPlaying(true);
  };

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Cloud resource management · scheduling · cost</p>
        <h1 className="page-title">Every choice trades something.</h1>
        <p className="page-lede">
          Faster costs more. Cheaper adds risk. Change the controls and watch wait time,
          utilization, and cost move.
        </p>
      </header>

      <div className="sim-layout">
        <SettingsPanel
          config={config}
          taskCount={result.tasks.length}
          totalTaskMinutes={result.summary.totalTaskMinutes}
          narrow={narrow}
          onChange={onChange}
        />

        <div className="sim-main">
          <LiveView
            result={result}
            frame={frame}
            frameIndex={safeIndex}
            playing={playing}
            speed={speed}
            onTogglePlay={togglePlay}
            onStep={() => {
              setPlaying(false);
              setFrameIndex((value) => Math.min(value + 1, lastIndex));
            }}
            onReset={() => {
              setPlaying(false);
              setFrameIndex(0);
            }}
            onSeek={(index) => {
              setPlaying(false);
              setFrameIndex(Math.min(lastIndex, Math.max(0, index)));
            }}
            onSpeed={setSpeed}
          />
          <ResultsPanel result={result} />
          <SchedulerExample />
          <TradeoffCalculator />
        </div>
      </div>
    </div>
  );
}
