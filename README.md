# Fit Mamma

A private, local-first fitness PWA for Mamma: gentle weight loss to **Eid al-Fitr (about 10 March 2027)**, starting Monday 9 November 2026.

On first open she enters her weight, height, birth year and goal. Those numbers stay on her phone; none are in this repo.

Everything stays on her phone (IndexedDB). No accounts and no cloud. Nothing is shared.

## What's inside

- **First run:** a short profile form (weight, height in feet/inches, birth year, goal) builds the plan line.
- **Today:** weight vs plan line, quick log (meal, steps, water, weight), Ramadan guide, Sunday weekly report, supplements.
- **Gym plan (Mon–Fri):** Chest & Triceps · Back & Biceps · Legs · Shoulders & Abs · Full body & Glutes. Saturday walk, Sunday rest. Beginner machines first, 3 working sets.
  - Exercise animations (© Gym visual, credited) and a **▶ Watch Hindi video** button that opens a Hindi YouTube search.
  - Machine busy/broken swaps, rest timer, muscle recovery grid, new-best detection.
- **Phases:** Learn (wk 1–3) → Build (wk 4–7) → Deload over New Year → Strong (pause reps) → **Ramadan mode** (≈ 8 Feb – 9 Mar: 4 lighter sessions after iftar, sehri/iftar plate guide) → Eid.
- **Food:** 38 desi dishes with home portions (1 roti, 1 bowl salan…). Tap a dish, pick ½ / 1 / 1½ / 2; calories are estimated quietly.
- **Targets:** ~1,500 kcal (rest day 1,200), 110 g protein, steps 6k → 7k → 8k (6k in Ramadan).
- **Stickers:** celebrations for workout done, new best, new lowest weight, every kg lost, and the goal.
- **Language:** English or Urdu (Settings → Language). Main screens are translated; the rest stays English.
- Warm light theme (cream + rose), larger text.

## Run

```bash
npm install
npm run dev
npm run typecheck && npm test && npm run lint && npm run build
```

Rebuild the training plan (media ids from PulseCap's exercise library):

```bash
python3 scripts/build-plan.py scripts/gif-library.json
python3 scripts/build-media-map.py scripts/gif-library.json src/domain/trainingPlan.json src/domain/exerciseMedia.json
```

Install on iPhone: open the site in Safari → Share → **Add to Home Screen**.
