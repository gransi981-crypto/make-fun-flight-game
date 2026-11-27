// The flight model: an arcade-realistic bush plane. Throttle makes thrust,
// bank turns the plane, lift needs speed, and a slow plane stalls. Fuel burns,
// gear and flaps add drag, and the ground is unforgiving.
import { PLANE, RUNWAY_HOME } from './config.js';
import { heightAt, onRunway } from './world.js';
import { clamp, wrapAngle } from './random.js';

export function makePlane() {
  return {
    x: RUNWAY_HOME.x - 180,
    z: RUNWAY_HOME.z,
    y: 6.5,
    heading: (RUNWAY_HOME.heading * Math.PI) / 180,
    pitch: 0,
    roll: 0,
    speed: 0,
    verticalSpeed: 0,
    throttle: 0,
    fuel: PLANE.fuelCapacity,
    gearDown: true,
    flaps: false,
    damage: 0,
    airborne: false,
    landed: false,
    crashed: false,
    crashReason: '',
    engineOut: false,
    onGround: true,
  };
}

export function stallSpeed(plane) {
  return plane.flaps ? PLANE.stallSpeedFlaps : PLANE.stallSpeed;
}

export function stepFlight(plane, input, dt, world) {
  if (plane.crashed) return plane;
  const p = plane;

  // Throttle and configuration.
  p.throttle = clamp(p.throttle + input.throttle * dt * 0.55, 0, 1);
  if (input.gearToggle) p.gearDown = !p.gearDown;
  if (input.flapToggle) p.flaps = !p.flaps;

  // Fuel burn and engine-out: a full tank lasts roughly seven minutes at
  // full throttle, so fuel is a real decision on the longer sorties.
  if (p.throttle > 0 && p.fuel > 0) {
    p.fuel = Math.max(0, p.fuel - PLANE.burnRate * p.throttle * dt);
  }
  p.engineOut = p.fuel <= 0;
  const thrust = p.engineOut ? 0 : p.throttle * PLANE.maxThrust;

  // Roll and pitch authority fade near the stall.
  const speedFactor = clamp(p.speed / PLANE.cruiseSpeed, 0.25, 1);
  p.roll = clamp(p.roll + input.roll * PLANE.rollRate * speedFactor * dt, -1.15, 1.15);
  p.roll *= Math.pow(0.12, dt); // ease back toward level when the stick is centred
  const pitchInput = input.pitch * PLANE.pitchRate * speedFactor * dt;
  p.pitch = clamp(p.pitch + pitchInput, -0.5, 0.42);

  // Turning: bank tilts the lift vector, so heading follows the roll.
  const turn = Math.sin(p.roll) * PLANE.turnRate * clamp(p.speed / 40, 0.3, 1.4);
  p.heading = wrapAngle(p.heading + turn * dt);

  // Speed: thrust minus drag (base + induced + gear + flaps), plus gravity along the pitch.
  const drag =
    PLANE.baseDrag +
    PLANE.inducedDrag * (p.speed * p.speed) / 900 +
    (p.gearDown ? PLANE.gearDrag : 0) +
    (p.flaps ? PLANE.flapDrag : 0);
  const accel = thrust - drag * p.speed - Math.sin(p.pitch) * 9.81 * 0.55;
  p.speed = clamp(p.speed + accel * dt, 0, PLANE.maxSpeed);

  // Lift and climb: below the stall the wing quits and the nose drops.
  const stalling = p.speed < stallSpeed(p);
  const lift = clamp((p.speed * p.speed * PLANE.liftFactor) / 9.81, 0, 1.6);
  let climb = Math.sin(p.pitch) * p.speed * lift;
  if (stalling) climb -= (stallSpeed(p) - p.speed) * 0.9;
  p.verticalSpeed = climb;
  p.y += climb * dt;

  // Move along the heading.
  const forward = Math.cos(p.pitch) * p.speed;
  p.x += Math.sin(p.heading) * forward * dt;
  p.z += -Math.cos(p.heading) * forward * dt;

  // World bounds: turn the plane gently back inside the valley.
  const bound = 1950;
  if (Math.abs(p.x) > bound || Math.abs(p.z) > bound) {
    const want = Math.atan2(-p.x, -p.z);
    p.heading = wrapAngle(p.heading + wrapAngle(want - p.heading) * dt * 0.8);
  }

  // Ground contact.
  const ground = heightAt(world, p.x, p.z);
  const runway = onRunway(p.x, p.z);
  if (p.y <= ground + 0.4) {
    p.y = ground + 0.4;
    p.onGround = true;
    const sink = -p.verticalSpeed;
    const rough = !runway && p.speed > 12;
    if (!p.gearDown && p.speed > 8) {
      return crash(p, 'Belly landing — the gear was up');
    }
    if (sink > 6.5) {
      return crash(p, 'Slammed into the ground');
    }
    if (rough && sink > 3.5) {
      return crash(p, 'Rough-field landing at speed');
    }
    if (sink > 3.5) {
      p.damage += (sink - 3.5) * 9;
      if (p.damage >= 100) return crash(p, 'Landing gear collapsed');
    }
    if (runway && p.speed < 46 && sink < 3.5 && p.gearDown) {
      p.landed = true;
    }
    // Rolling friction on the ground.
    p.speed = Math.max(0, p.speed - dt * (runway ? 6 : 14));
    p.pitch *= 0.9;
    p.roll *= 0.8;
  } else {
    p.onGround = false;
    p.landed = false;
  }

  // Water is a crash, not a landing.
  if (ground <= 2.5 && p.y <= 3 && !p.onGround) {
    return crash(p, 'Ditched in the water');
  }
  if (p.y <= 2.6 && ground <= 2.5 && p.onGround) {
    return crash(p, 'Ditched in the water');
  }

  p.airborne = !p.onGround;
  p.stalling = stalling;
  return p;
}

function crash(plane, reason) {
  plane.crashed = true;
  plane.crashReason = reason;
  plane.speed = 0;
  return plane;
}

export function knots(speedMs) {
  return Math.round(speedMs * 1.944);
}

export function feet(metres) {
  return Math.round(metres * 3.281);
}
