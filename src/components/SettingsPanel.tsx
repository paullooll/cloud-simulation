import { PRESETS, presetLabel } from '../engine/workload';
import { PRICING_INFO } from '../engine/pricing';
import { randomSeed } from '../engine/rng';
import type { Policy, PricingMode, SimConfig } from '../engine/types';
import {
  ControlSection,
  NumberField,
  RangeField,
  Segmented,
  ToggleField,
} from './Controls';
import { Term } from './Term';

interface SettingsPanelProps {
  config: SimConfig;
  taskCount: number;
  totalTaskMinutes: number;
  narrow: boolean;
  onChange: (patch: Partial<SimConfig>) => void;
}

const POLICY_INFO: Record<
  Policy,
  { label: string; line: string; analogy: string }
> = {
  fcfs: {
    label: 'FCFS',
    line: 'First come, first served. The oldest task runs first.',
    analogy: 'Like one bank line.',
  },
  sjf: {
    label: 'SJF',
    line: 'Shortest job first. The smallest task runs first.',
    analogy: 'Like an express lane for small baskets.',
  },
  rr: {
    label: 'Round Robin',
    line: 'Each task runs for one time slice, then goes to the back of the queue.',
    analogy: 'Like a teacher giving each student a turn.',
  },
  priority: {
    label: 'Priority',
    line: 'Tasks with a higher priority run first.',
    analogy: 'Like an emergency room.',
  },
};

export function SettingsPanel({
  config,
  taskCount,
  totalTaskMinutes,
  narrow,
  onChange,
}: SettingsPanelProps) {
  const policy = POLICY_INFO[config.policy];

  return (
    <aside className="settings" aria-label="Simulation settings">
      <div className="settings-head">
        <h2 className="section-title">Controls</h2>
        <p className="settings-note">Changes update the run.</p>
      </div>

      <ControlSection
        title="Workload"
        summary={`${taskCount} tasks · ${totalTaskMinutes} min of work`}
        defaultOpen={!narrow}
      >
        <Segmented
          legend="Preset"
          value={config.preset}
          options={PRESETS.map((preset) => ({
            value: preset.id,
            label:
              preset.id === 'spike' ? 'Spike' : preset.id === 'batch' ? 'Batch' : 'Steady',
            detail: preset.description,
          }))}
          onChange={(preset) => onChange({ preset })}
        />
        <p className="field-hint">
          {PRESETS.find((preset) => preset.id === config.preset)?.description}
        </p>
        <div className="inline-field">
          <NumberField
            id="seed"
            label="Seed"
            term="Seed"
            value={config.seed}
            min={1}
            max={999999}
            hint="Same seed, same tasks."
            onChange={(seed) => onChange({ seed })}
          />
          <button
            type="button"
            className="button secondary seed-button"
            onClick={() => onChange({ seed: randomSeed() })}
          >
            New seed
          </button>
        </div>
        <p className="tiny-note">
          Workload: {presetLabel(config.preset)}. {taskCount} tasks, {totalTaskMinutes} minutes of
          work in total.
        </p>
      </ControlSection>

      <ControlSection
        title="Scheduler"
        summary={policy.label}
        defaultOpen={!narrow}
      >
        <Segmented
          legend="Policy"
          value={config.policy}
          options={(Object.keys(POLICY_INFO) as Policy[]).map((key) => ({
            value: key,
            label: POLICY_INFO[key].label,
          }))}
          onChange={(nextPolicy) => onChange({ policy: nextPolicy })}
        />
        <div className="callout">
          <p>
            <strong>{policy.label}.</strong> {policy.line}
          </p>
          <p className="callout-analogy">Analogy: {policy.analogy}</p>
        </div>
        {config.policy === 'rr' ? (
          <RangeField
            id="time-slice"
            label="Time slice"
            term="Time slice"
            value={config.timeSlice}
            min={1}
            max={20}
            valueLabel={`${config.timeSlice} min`}
            onChange={(timeSlice) => onChange({ timeSlice })}
          />
        ) : (
          <p className="field-hint">
            Round Robin uses a time slice. Pick Round Robin to adjust it.
          </p>
        )}
        <a className="text-link" href="#scheduler-example">
          See the 3-task example
        </a>
      </ControlSection>

      <ControlSection
        title="Servers"
        summary={`${config.startingServers} start · ${config.maxServers} max`}
        defaultOpen={!narrow}
      >
        <div className="field-grid">
          <NumberField
            id="starting-servers"
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
            id="max-servers"
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
        <p className="field-hint">
          Each server has {config.slotsPerServer} task slot. A slot holds one task at a time.
        </p>
      </ControlSection>

      <ControlSection
        title="Auto-scaling"
        summary={config.autoScale ? 'On' : 'Off'}
        defaultOpen={!narrow}
      >
        <ToggleField
          id="auto-scale"
          label="Auto-scaling"
          term="Auto-scaling"
          checked={config.autoScale}
          hint={
            config.autoScale
              ? 'Servers are added and removed inside the starting and max limits.'
              : 'Only the starting servers are used.'
          }
          onChange={(autoScale) => onChange({ autoScale })}
        />
        <RangeField
          id="scale-out-threshold"
          label="Scale out above"
          term="Threshold"
          value={config.scaleOutThreshold}
          min={Math.min(95, config.scaleInThreshold + 5)}
          max={95}
          step={5}
          disabled={!config.autoScale}
          valueLabel={`${config.scaleOutThreshold}% CPU`}
          onChange={(scaleOutThreshold) =>
            onChange({
              scaleOutThreshold,
              scaleInThreshold: Math.min(config.scaleInThreshold, scaleOutThreshold - 5),
            })
          }
        />
        <RangeField
          id="scale-in-threshold"
          label="Scale in below"
          value={config.scaleInThreshold}
          min={5}
          max={Math.max(5, Math.min(60, config.scaleOutThreshold - 5))}
          step={5}
          disabled={!config.autoScale}
          valueLabel={`${config.scaleInThreshold}% CPU`}
          onChange={(scaleInThreshold) => onChange({ scaleInThreshold })}
        />
        <RangeField
          id="cooldown"
          label="Cooldown"
          term="Cooldown"
          value={config.cooldown}
          min={0}
          max={30}
          disabled={!config.autoScale}
          valueLabel={`${config.cooldown} min`}
          onChange={(cooldown) => onChange({ cooldown })}
        />
        <RangeField
          id="start-delay"
          label="Scale-out delay"
          term="Start delay"
          value={config.startupDelay}
          min={0}
          max={10}
          disabled={!config.autoScale}
          valueLabel={`${config.startupDelay} min`}
          hint="A new server bills from the request minute, even while it starts."
          onChange={(startupDelay) => onChange({ startupDelay })}
        />
      </ControlSection>

      <ControlSection
        title="Pricing"
        summary={PRICING_INFO[config.pricing].label}
        defaultOpen={!narrow}
      >
        <Segmented
          legend="Pricing model"
          value={config.pricing}
          options={(Object.keys(PRICING_INFO) as PricingMode[]).map((key) => ({
            value: key,
            label: PRICING_INFO[key].label,
          }))}
          onChange={(pricing) => onChange({ pricing })}
        />
        <p className="field-hint">{PRICING_INFO[config.pricing].description}</p>
        <div className="rate-grid">
          <NumberField
            id="rate-ondemand"
            label="On-demand"
            value={config.rates.ondemand}
            min={0}
            max={5}
            step={0.001}
            hint="$ per server hour"
            onChange={(ondemand) => onChange({ rates: { ...config.rates, ondemand } })}
          />
          <NumberField
            id="rate-reserved"
            label="Reserved"
            value={config.rates.reserved}
            min={0}
            max={5}
            step={0.001}
            hint="$ per server hour"
            onChange={(reserved) => onChange({ rates: { ...config.rates, reserved } })}
          />
          <NumberField
            id="rate-spot"
            label="Spot"
            value={config.rates.spot}
            min={0}
            max={5}
            step={0.001}
            hint="$ per server hour"
            onChange={(spot) => onChange({ rates: { ...config.rates, spot } })}
          />
        </div>
        <RangeField
          id="spot-chance"
          label="Spot interruption chance"
          term="Spot interruption"
          value={Math.round(config.spotInterruptionPerHour * 100)}
          min={1}
          max={50}
          disabled={config.pricing !== 'spot'}
          valueLabel={`${Math.round(config.spotInterruptionPerHour * 100)}% per hour`}
          hint="At each simulated hour, each spot server has this chance to be taken back."
          onChange={(value) => onChange({ spotInterruptionPerHour: value / 100 })}
        />
        {config.pricing === 'reserved' ? (
          <p className="tiny-note">
            Reserved price applies to the starting servers. Extra servers pay on-demand.
          </p>
        ) : null}
      </ControlSection>

      <div className="settings-foot">
        <p>
          <Term term="Server hour">Server hours</Term> are counted while a server bills. The start
          delay is included.
        </p>
      </div>
    </aside>
  );
}
