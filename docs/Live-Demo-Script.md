# Cloud Resource Lab — Live Demo Script

**Site:** https://cloud-simulation.vercel.app/
**Length:** about 12 minutes (Simulate ≈ 7 min, Compare ≈ 5 min)
**Tabs used:** Simulate and Compare only.

Everything below was checked on the live site. The defaults are **Spike (sale event)** workload, **Seed 16**, **56 tasks**. Do not change the seed. The same seed gives the same numbers every time.

> Lines in **"quotes"** are what you say. Lines starting with **▶** are what you click.

---

## Before you start

- Open the site on the **Simulate** tab. Zoom the browser to about 125%.
- Check that the seed says **16** and the preset is **Spike**.
- Keep a second tab open on the same site as a backup.

---

# PART 1 — SIMULATE (about 7 minutes)

## 1. Introduce the screen (1 min)

▶ Stay on the top of the Simulate tab. Point to the headline, then the five control cards.

**"This is the Cloud Resource Lab. It shows what happens inside a cloud when many jobs arrive and have to share a few servers."**

**"There are five things we can change: the workload, the scheduler, the number of servers, auto-scaling, and the pricing. Under them, the Live view shows what happens, and the Results show the final numbers."**

**"One tick on the clock is one simulated minute. So a 101-minute run takes only seconds."**

## 2. Set the workload (30 sec)

▶ Open **Workload**. Point to **Spike**.

**"Our workload is a sale event. There are 56 tasks, about 214 minutes of work, and a rush of tasks in the middle. Think of an online shop on sale day."**

**"The seed is 16. A seed makes the run repeatable. Same seed and same settings always give the same result, so this is a fair experiment."**

## 3. Run the baseline: one fixed server (1.5 min)

▶ Open **Auto-scaling** and switch it **Off**. Open **Servers**, set **1 start, 4 max** (with auto-scaling off, only the one starting server runs).
▶ Press **Reset**, set Speed to **5x**, press **Play**.

**"First, the simplest setup. One server, no auto-scaling."**

▶ While it plays, point at the **Queue** box, then the **Servers** box.

**"Watch the queue. Tasks arrive faster than one server can finish them, so they line up. This is the problem every cloud has during a spike."**

▶ When it finishes, point to the Results cards. (Compare tab shows the same run: **average wait 61.1 min, utilization 100%, cost $1.38, peak queue 33**.)

**"The server is 100% busy and the cost is low, $1.38. But the average task waited 61 minutes, and 33 tasks were stuck in line at the worst moment. Cheap, but slow."**

## 4. Turn auto-scaling on (1.5 min)

▶ Switch **Auto-scaling On**. Keep **1 start, 4 max**. Press **Reset**, then **Play**.

**"Now the cloud can add servers by itself. The rule is simple: if CPU use goes above 70%, add a server. If it falls below 30%, remove one."**

▶ Point to the **Servers** box as S2, S3, S4 appear, then to the **Event timeline**.

**"Look at the timeline. Minute 2: scale out, server S2 is requested, and it is ready 2 minutes later. That is the start delay. A new server is not instant, and it bills from the moment it is requested."**

**"There is also a 5-minute cooldown, so the system does not add and remove servers every minute."**

▶ When it finishes, point to the Results.

**"Average wait dropped from 61 minutes to 3.9 minutes. The peak queue fell from 33 to 17. The cost went up from $1.38 to $2.12, and utilization fell from 100% to 67%, because some servers sit idle waiting for work."**

**"This is the first trade-off: faster service costs more money."**

## 5. Change the scheduler (1.5 min)

▶ Open **Scheduler**. Click each option and let the results update. Point to the **Scheduler example** table lower on the page.

**"A scheduler decides which waiting task runs next. Same servers, same tasks, same cost. Only the order changes."**

| Scheduler | Avg wait | Avg completion | Cost |
|---|---|---|---|
| FCFS (first come, first served) | 3.9 min | 7.7 min | $2.12 |
| SJF (shortest job first) | 3.0 min | 6.8 min | $2.12 |
| Round Robin | 2.3 min | 9.0 min | $2.12 |
| Priority | 4.1 min | 7.9 min | $2.00 |

**"FCFS is like one bank line. SJF lets short tasks go first, so the average wait falls to 3.0 minutes."**

**"Round Robin gives everyone a short turn, so the wait to start is the lowest, 2.3 minutes. But long tasks are interrupted, so the average completion time is the worst, 9.0 minutes."**

▶ Scroll to the **Scheduler example**.

**"The small example shows why. Three tasks arrive together: 10, 2 and 1 minutes long. FCFS gives an average wait of 7.3 minutes. SJF gives 1.3 minutes. Same work, different order."**

## 6. Change the pricing (1 min)

▶ Set the scheduler back to **FCFS**. Open **Pricing**. Click **On-demand**, **Reserved**, then **Spot**.

**"Last control: how we pay. The performance stays the same, but the bill changes."**

| Pricing | Cost | Wait | Restarts |
|---|---|---|---|
| On-demand | $2.12 | 3.9 min | 0 |
| Reserved | $1.88 | 3.9 min | 0 |
| Spot | $0.63 | 3.9 min | 1 |

**"On-demand is pay as you go. Reserved is cheaper because we commit to the starting servers. Spot is the cheapest, $0.63, about 70% less. But spot servers can be taken back. Here one task was interrupted and had to restart from zero."**

**"So: cheaper adds risk."**

---

# PART 2 — COMPARE (about 5 minutes)

▶ Click the **Compare** tab.

## 7. Explain the idea (1 min)

**"In Simulate we changed one thing at a time and had to remember the old numbers. Compare fixes that. It runs two setups, A and B, on the same workload and the same seed, side by side."**

▶ Point to **Shared workload** (Spike, seed 16, 56 tasks), then Setup A and Setup B.

**"Because the tasks are identical, any difference we see comes only from the choices we change. That is what makes it a fair test."**

▶ Point to the three big result cards (Total cost, Average wait, Utilization) and the **What this shows** sentence.

**"The cards show cost, wait and utilization for A and B, with the percent difference. Below is a full table. The difference is always B minus A."**

## 8. Comparison 1: fixed server vs auto-scaling (1.5 min)

▶ Set **A:** FCFS, On-demand, Auto-scaling **Off**, 1 server. Set **B:** FCFS, On-demand, Auto-scaling **On**, 1 start, 4 max.

| | A (fixed 1) | B (auto-scale) | Difference |
|---|---|---|---|
| Total cost | $1.38 | $2.12 | +$0.74 (54% higher) |
| Average wait | 61.1 min | 3.9 min | −57.2 min (94% lower) |
| Utilization | 100% | 67% | −32.9 points |
| Peak servers | 1 | 4 | +3 |
| Peak queue | 33 | 17 | −16 |

**"Setup B cut the wait by 94% and raised the cost by 54%. That is 74 cents more to save almost an hour of waiting per task."**

**"Notice utilization. A looks perfect at 100%, but customers wait an hour. High utilization is not always good. A little spare capacity is what keeps the queue short."**

## 9. Comparison 2: scheduler only (1 min)

▶ Click **Copy A to B**. Turn **Auto-scaling On** in both setups. Change only B's scheduler to **SJF**.

| | A (FCFS) | B (SJF) |
|---|---|---|
| Total cost | $2.12 | $2.12 |
| Average wait | 3.9 min | 3.0 min |

**"Same cost, but B waits 24% less. A smarter scheduler is a free improvement because it needs no extra servers."**

## 10. Comparison 3: pricing only (1 min)

▶ Change B's scheduler back to **FCFS**. Change B's pricing to **Spot**.

| | A (On-demand) | B (Spot) |
|---|---|---|
| Total cost | $2.12 | $0.63 |
| Average wait | 3.9 min | 3.9 min |

**"Same speed, 70% lower cost. In this run the only price was one restarted task. If a job is urgent, that risk matters. If it can be repeated safely, like a nightly batch, spot is a great choice."**

## 11. Close (30 sec)

**"To sum up. More servers cut waiting but cost more. A smarter scheduler can improve waiting for free. Cheaper pricing saves money but adds risk. There is no perfect setting, only the right trade-off for the job. Every choice trades something."**

**"Thank you. Any questions?"**

---

## If something goes wrong

- **Numbers look different:** check that the seed is 16 and the preset is Spike.
- **Page won't load:** use the backup tab, or run locally with `npm run preview`.
- **Short on time:** skip Round Robin and Priority in step 5, and skip Comparison 3.
- **Question about how it works:** open `Cloud-Resource-Lab-How-It-Works.pdf`.
