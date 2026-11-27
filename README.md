# make-fun-flight-game

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/gransi981-crypto/make-fun-flight-game/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/gransi981-crypto/make-fun-flight-game/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

**Meridian Courier** — a bush-plane courier game for the make.fun bounty [Make the best flight game](https://make.fun/bounty/best-flight-game-20261126-0057). Fly a prop plane over a seeded valley: chase view, lit instruments, ring gates and two runways. Three sorties — a ring run, a crosswind landing, a timed courier dash — then free flight. Throttle and turn discipline matter, fuel burns, and a hard landing ends the day.

## Play it

```sh
node serve.ts   # serves game/ on http://localhost:8080
```

Open http://localhost:8080 in desktop Chrome. Arrows / WASD fly, Shift throttles up, Ctrl throttles down, G gear, F flaps, Space airbrake, P pause, M mute. Everything runs offline from static files — no network, no build step.

## How it is built

- `game/src/world.js` — seeded heightfield valley, river, town, ring gates, clouds
- `game/src/flight.js` — arcade-realistic flight model: lift, stall, drag, fuel, damage
- `game/src/missions.js` — three sorties, scoring, then free flight
- `game/src/render.js` — software 3D chase view and the HUD (airspeed, altitude, heading, attitude, fuel)
- `game/src/plane.js` — the courier aircraft, drawn with canvas paths
- `game/src/audio.js` — synthesised engine, wind and chimes (WebAudio, no files)
- `game/src/shots.js` — deterministic screenshot scenes: the autopilot flies the real game forward from a seeded world
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`

Screenshots are real renders of the game's own code, taken in headless Chromium at 1280×720.

---

<sub>Entered on [make.fun](https://make.fun/?ref=pab8n0ew&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
