// The world: a seeded heightfield valley with a river, two airfields, a small
// town, ring gates and clouds. Everything is generated from the seed, so the
// same seed always builds the same valley.
import { WORLD, RUNWAY_HOME, RUNWAY_FAR, COLORS } from './config.js';
import { fbm, makeRng, clamp, valueNoise } from './random.js';

const HALF = WORLD.size / 2;
const CELL = WORLD.size / WORLD.grid;

function runwayDistance(x, z, runway) {
  // Distance from a point to the runway centreline segment, in metres.
  const heading = (runway.heading * Math.PI) / 180;
  const dx = x - runway.x;
  const dz = z - runway.z;
  const along = dx * Math.sin(heading) + dz * -Math.cos(heading);
  const across = dx * Math.cos(heading) + dz * Math.sin(heading);
  const clamped = clamp(along, -runway.length / 2, runway.length / 2);
  return { along, across, dist: Math.hypot(along - clamped, across) };
}

function rawHeight(x, z, seed) {
  // Rolling hills with a broad valley along the diagonal from home to far field.
  const hills = fbm(x / 620, z / 620, seed, 4);
  const detail = fbm(x / 170 + 40, z / 170 + 40, seed + 7, 3) * 0.35;
  let h = 34 + hills * 46 + detail * 14;
  // Valley floor: pull heights down near the line between the two runways.
  const vx = RUNWAY_FAR.x - RUNWAY_HOME.x;
  const vz = RUNWAY_FAR.z - RUNWAY_HOME.z;
  const len2 = vx * vx + vz * vz;
  let t = ((x - RUNWAY_HOME.x) * vx + (z - RUNWAY_HOME.z) * vz) / len2;
  t = clamp(t, 0, 1);
  const px = RUNWAY_HOME.x + vx * t;
  const pz = RUNWAY_HOME.z + vz * t;
  const valleyDist = Math.hypot(x - px, z - pz);
  const valley = clamp(1 - valleyDist / 620, 0, 1);
  h = h * (1 - valley * 0.82) + 6 * valley;
  // River carving along the south edge.
  const river = Math.abs(z - (620 + valueNoise(x / 900, 0, seed + 31) * 160));
  if (river < 130) h = h * (river / 130) * 0.5 + 1.5;
  // Rim mountains at the world edge.
  const edge = Math.max(Math.abs(x), Math.abs(z)) / HALF;
  if (edge > 0.82) h += (edge - 0.82) * 620;
  return h;
}

export function buildWorld(seed) {
  const rng = makeRng(seed);
  const n = WORLD.grid;
  const heights = new Float32Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j += 1) {
    for (let i = 0; i <= n; i += 1) {
      const x = -HALF + i * CELL;
      const z = -HALF + j * CELL;
      let h = rawHeight(x, z, seed);
      // Flatten both runways and their aprons so the strips sit on level ground.
      for (const runway of [RUNWAY_HOME, RUNWAY_FAR]) {
        const d = runwayDistance(x, z, runway);
        const flat = clamp(1 - d.dist / 90, 0, 1);
        if (flat > 0) h = h * (1 - flat) + 6 * flat;
      }
      heights[j * (n + 1) + i] = h;
    }
  }

  // Ring gates: a gentle arc over the valley for mission one, a second arc for the dash.
  const rings = [];
  const ringPath = (count, from, to, baseAlt, arc) => {
    for (let i = 0; i < count; i += 1) {
      const t = (i + 1) / (count + 1);
      const x = from.x + (to.x - from.x) * t + Math.sin(t * Math.PI) * arc;
      const z = from.z + (to.z - from.z) * t + Math.cos(t * Math.PI) * arc * 0.6;
      rings.push({ x, z, y: baseAlt + Math.sin(t * Math.PI) * 26, radius: 26, passed: false });
    }
  };
  ringPath(6, { x: -260, z: 260 }, { x: 1050, z: -780 }, 78, 260);
  ringPath(4, { x: 1050, z: -780 }, { x: -260, z: 260 }, 92, -220);

  // Town: a cluster of low blocks southwest of the home field, clear of the
  // ring corridor so the flight path never threads between rooftops.
  const town = [];
  for (let i = 0; i < 22; i += 1) {
    const x = -760 + rng() * 260;
    const z = 520 + rng() * 220;
    town.push({ x, z, w: 10 + rng() * 12, d: 10 + rng() * 12, h: 6 + rng() * 10, tone: rng() });
  }

  // Clouds: soft billboards drifting high over the valley.
  const clouds = [];
  for (let i = 0; i < 22; i += 1) {
    clouds.push({
      x: -1800 + rng() * 3600,
      z: -1800 + rng() * 3600,
      y: 260 + rng() * 160,
      s: 90 + rng() * 170,
      drift: 1.5 + rng() * 2.5,
    });
  }

  return { seed, heights, rings, town, clouds, grid: n, cell: CELL, half: HALF };
}

export function heightAt(world, x, z) {
  const { grid, cell, half, heights } = world;
  const gx = clamp((x + half) / cell, 0, grid - 0.001);
  const gz = clamp((z + half) / cell, 0, grid - 0.001);
  const i = Math.floor(gx);
  const j = Math.floor(gz);
  const fx = gx - i;
  const fz = gz - j;
  const row = grid + 1;
  const a = heights[j * row + i];
  const b = heights[j * row + i + 1];
  const c = heights[(j + 1) * row + i];
  const d = heights[(j + 1) * row + i + 1];
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

export function onRunway(x, z) {
  for (const runway of [RUNWAY_HOME, RUNWAY_FAR]) {
    const d = runwayDistance(x, z, runway);
    if (Math.abs(d.along) <= runway.length / 2 && Math.abs(d.across) <= runway.width / 2) return runway;
  }
  return null;
}

export function groundColor(world, x, z, h) {
  if (h <= WORLD.waterLevel + 0.6) return COLORS.waterDeep;
  if (h <= WORLD.waterLevel + 2.5) return COLORS.sand;
  for (const runway of [RUNWAY_HOME, RUNWAY_FAR]) {
    const d = runwayDistance(x, z, runway);
    if (Math.abs(d.along) <= runway.length / 2 + 6 && Math.abs(d.across) <= runway.width / 2 + 6) {
      return COLORS.runway;
    }
  }
  const n = valueNoise(x / 90, z / 90, world.seed + 5) * 0.5 + 0.5;
  if (h > 120) return COLORS.rock;
  const low = COLORS.grassLow;
  const high = COLORS.grassHigh;
  const t = clamp((h - 6) / 90, 0, 1) * 0.6 + n * 0.4;
  return shade(low, high, t);
}

export function shade(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
  return `rgb(${r},${g},${bl})`;
}
