// Tuning constants for Meridian Courier — one place for every number that shapes
// how the plane flies, how the world looks and how missions score.
export const VIEW = { width: 1280, height: 720, fov: 68 };

export const WORLD = {
  size: 4096, // terrain spans -2048..2048 metres on x and z
  grid: 48, // heightfield cells per side (48x48 quads)
  waterLevel: 2.5,
  maxHeight: 175,
  seed: 20261127,
};

export const RUNWAY_HOME = { x: 0, z: 0, heading: 90, length: 620, width: 34 };
export const RUNWAY_FAR = { x: 1400, z: -1150, heading: 0, length: 560, width: 30 };

export const PLANE = {
  stallSpeed: 26, // m/s clean; flaps lower it
  stallSpeedFlaps: 21,
  maxSpeed: 95,
  cruiseSpeed: 58,
  maxThrust: 26, // m/s^2 at full throttle
  // Drag is sized so the level-flight terminal speed tracks the throttle:
  // ~45 m/s at 0.3, ~59 at 0.4, ~81 at 0.6, capped at 95 above 0.85.
  baseDrag: 0.16,
  inducedDrag: 0.004,
  gearDrag: 0.006,
  flapDrag: 0.008,
  liftFactor: 0.052,
  climbRate: 9.5,
  turnRate: 0.62, // heading change per second at 45 degrees of bank
  rollRate: 2.6, // radians per second of roll authority
  pitchRate: 1.15,
  fuelCapacity: 100,
  burnRate: 0.24, // fuel units per second at full throttle
  tankReserve: 12,
};

export const MISSIONS = [
  { id: 'rings', name: 'Ring Run', brief: 'Fly through all 6 rings over the valley', rings: 6, reward: 100 },
  { id: 'landing', name: 'Crosswind Landing', brief: 'Land on the far runway — gear down, gentle and slow', reward: 500 },
  { id: 'dash', name: 'Courier Dash', brief: '4 rings, then land home before the clock runs out', rings: 4, timeLimit: 150, reward: 400 },
];

export const SCORE = { ring: 100, landing: 500, timeBonus: 5, softTouch: 150 };

export const COLORS = {
  skyTop: '#2f6fb4',
  skyMid: '#7fb2dd',
  skyLow: '#cfe6f2',
  sun: '#fff3c4',
  grassLow: '#5d8a3c',
  grassHigh: '#7fae56',
  rock: '#8a7f72',
  sand: '#d9c48f',
  water: '#2e6f9e',
  waterDeep: '#1d4f78',
  runway: '#6b6f75',
  runwayMark: '#f2f2e8',
  ring: '#ffb020',
  ringNext: '#ffcf3d',
};
