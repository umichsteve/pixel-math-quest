# Pixel Math Quest

A pixel-art math practice game for kids. Five stages of increasing difficulty, 10 questions per run, star ratings, and locally saved progress. Runs as a web app (Vercel) and as a native iOS app via Capacitor.

## Stages

| # | Stage | Skill |
|---|-------|-------|
| 1 | Counting Meadow | Addition up to 10 |
| 2 | Subtraction Swamp | Subtraction within 20 |
| 3 | Multiply Mountain | Times tables up to 10 |
| 4 | Division Den | Division with whole-number results |
| 5 | Boss Battle | Mixed operations, bigger numbers |

Stages unlock sequentially. Clearing a stage requires at least 50% correct. Stars: 100% earns 3, 70%+ earns 2, 50%+ earns 1. Best scores and total stars persist in localStorage under `pixel-math-quest-progress`.

## Stack

- React 19 + Vite 8, plain CSS (no UI framework)
- Self-hosted Press Start 2P woff2 subsets, fully offline capable
- Synthesized WebAudio chiptune SFX, no audio assets
- node:test invariant suite for the question generator
- Capacitor 8 for the iOS shell (`ios/` is the checked-in Xcode project)

## Scripts

Run from this directory (`pixel-math-quest/`):

```
npm install
npm run dev        # local dev server
npm test           # question generator invariants
npm run lint       # eslint
npm run build      # production build to dist/
```

## Deployment

Web: Vercel builds from the repo root using the root `vercel.json`, which cds into this directory for install and build and serves `pixel-math-quest/dist`. The nested `vercel.json` covers the case where the Vercel project's Root Directory is set to `pixel-math-quest` instead.

iOS: `npm run build`, then `npx cap sync ios` and open `ios/App` in Xcode to archive. App ID: `com.umichsteve.pixelmathquest`.
