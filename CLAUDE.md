# Fit Mamma — Claude Code

Personal fitness PWA for Shamikh's mother (forked from Project 85, separate repo and data). Capricorn Systems / personal.

**path:** `~/Projects/fit-mamma`
**Brain note:** `~/Capricorn-Brain/01 Projects/Fit-Mamma.md`

## Rules of the road

- Local-first IndexedDB (`fitmamma` db); private to her, no sharing features
- Public repo: never commit her weight, height or birth date. They come from the first-run form (`ProfileSetup`)
- Warm light theme only: cream `#FBF5EF`, rose `#C8456B`, teal `#2A7F8F`; system fonts only
- Gentle copy, desi food, Hindi demo links (`… kaise kare hindi`), English/Urdu via `src/i18n`
- Plan: `src/domain/plan.ts` (9 Nov 2026 → Eid 10 Mar 2027, Ramadan ≈ 8 Feb – 9 Mar) + `scripts/build-plan.py` → `trainingPlan.json`
- Session keys reuse the engine slots: push=Chest&Tri, pull=Back&Bi, legs, upper=Shoulders&Abs, lower=Full body, saturday=Walk
- No fake Apple Health "connected" states

## Verify

```bash
npm run typecheck && npm test && npm run lint && npm run build
```
