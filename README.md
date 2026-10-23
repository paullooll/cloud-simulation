# Cloud Resource Lab

A frontend-only simulation of cloud resource management, scheduling, and cost optimization. Change the workload, scheduler, servers, auto-scaling, and pricing. The app shows how wait time, utilization, and cost move.

Built for a 15-minute graduate IT class talk at West Visayas State University, CICT. No backend, login, API key, or database. Everything runs in the browser.

## What is inside

- **Simulate:** four schedulers (FCFS, SJF, Round Robin, Priority), auto-scaling with cooldown and start delay, on-demand / reserved / spot pricing, live servers and queue, live charts, results, scheduler example, and a trade-off calculator.
- **Compare:** two setups on the same workload and seed, with cost, wait, and utilization differences.
- **Guided demo:** four steps: no auto-scaling, auto-scaling on, spot pricing, Round Robin.
- **Learn:** short cards, definitions, and the AWS / Azure / Google Cloud pricing name table.
- **Discussion:** two class questions with hidden guidance.
- The engine is pure TypeScript under `src/engine/`. The UI only reads the result.
- A seed makes a run repeatable. Same seed + same settings = same result.

## Guides

- `Cloud-Resource-Lab-How-It-Works.pdf` is a 12-page, step-by-step guide to the simulation itself. It covers task generation, the initial state, all 10 phases of a tick, a worked micro-run, every scheduler, auto-scaling, pricing and spot interruptions, metrics, and seed-16 numbers to verify.
- `Cloud-Resource-Lab-Presentation-Guide.pdf` is a 10-page, click-by-click script for the 15-minute talk. It includes a pre-flight checklist, timed run sheet, exact demo numbers, speaker lines, discussion prompts, and a recovery plan.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the URL that Vite prints, usually `http://localhost:5173`.

## Test and build

```bash
npm test
npm run build
npm run preview
```

`npm test` runs the Vitest suite. It covers all four schedulers, the auto-scaler thresholds / cooldown / start delay, pricing math, spot interruption and restart, workload seed repeatability, and the textbook A/B/C example (FCFS 7.3 min vs SJF 1.3 min).

`npm run build` type-checks and writes the static site to `dist/`.

## Deploy

The app is a static site. `vite.config.ts` uses a relative base (`./`), so it also works under a subpath.

### Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Use the defaults: framework preset **Vite**, build command `npm run build`, output directory `dist`.

Or import the GitHub repository at <https://vercel.com/new>. Vercel detects Vite automatically.

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`

Or run `npx netlify deploy --prod --dir=dist` after `npx netlify login`.

### GitHub Pages

1. Push the project to a GitHub repository.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and deploys the site on each push to `main`.
4. The site URL is `https://<user>.github.io/<repo>/`.

If you prefer a manual deploy, run `npm run build` and publish the `dist` folder with any static host. There is no server-side routing, so no rewrite rule is needed.

## Source map

```
src/
  engine/        schedulers, autoscaler, pricing, workload, simulate, insights, tests
  components/    controls, live view, charts, results, calculator, example, tooltips
  pages/         Simulate, Compare, Demo, Learn, Discussion
  content/       term definitions
  ui/            display helpers
```

## Notes and limits

- One tick is one simulated minute. One server has one task slot in this simulation.
- Cost is server minutes × rate. The start delay is billed.
- Reserved pricing applies to the starting servers. Extra servers pay on-demand.
- Spot interruption is checked once per simulated hour for each spot server. An interrupted task returns to the queue and restarts from zero.
- Utilization is busy server time ÷ available server time.
- All results stay in the browser. Nothing is uploaded.
