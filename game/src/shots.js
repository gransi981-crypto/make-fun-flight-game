// Deterministic screenshot scenes: each shot plays the real game forward from
// a fresh world for a fixed number of steps, steered by a simple autopilot, so
// the frame is what a short game really looks like and the same seed always
// gives the same frame. The cover is the title view; the others are play.
import { makePlane, stepFlight } from './flight.js';
import { startMission, stepMissions, advanceMission } from './missions.js';
import { heightAt } from './world.js';

const STEP = 1 / 60;

function autopilot(plane, target, gentle, throttleTarget = 0.85) {
  // Steer toward a point: bank toward it, pitch to hold its altitude.
  const dx = target.x - plane.x;
  const dz = target.z - plane.z;
  const wantHeading = Math.atan2(dx, -dz);
  let headingError = wantHeading - plane.heading;
  while (headingError > Math.PI) headingError -= Math.PI * 2;
  while (headingError < -Math.PI) headingError += Math.PI * 2;
  const roll = Math.max(-0.9, Math.min(0.9, headingError * 1.4));
  const altError = target.y - plane.y;
  // A landing approach glides gently; a ring chase may dive harder.
  const gain = gentle ? 0.003 : 0.008;
  const pitch = gentle
    ? Math.max(-0.08, Math.min(0.12, altError * gain))
    : Math.max(-0.25, Math.min(0.3, altError * gain));
  return { roll, pitch, throttle: throttleTarget };
}

function runSteps(plane, world, missions, seconds, target, now, gentle = false, throttleTarget = 0.85) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const steer = autopilot(plane, target, gentle, throttleTarget);
    stepFlight(plane, { roll: steer.roll - plane.roll, pitch: steer.pitch - plane.pitch, throttle: steer.throttle - plane.throttle > 0 ? 1 : 0, gearToggle: false, flapToggle: false }, STEP, world);
    stepMissions(missions, plane, world, STEP, now);
    if (plane.crashed) break;
  }
}

/**
 * Stage the named scene (start | play | rings | land) on a fresh plane and
 * missions, and return the screen to draw. Any other name stages start.
 */
export function stageShot(name, world, plane, missions, now) {
  const rings = missions.rings;
  if (name === 'play' || name === 'rings') {
    // A straight-and-level run at one gate: the plane starts lined up with
    // the ring, so it flies clean through it instead of banking hard to
    // find it. 'play' runs at ring 1; 'rings' at ring 3, deeper in the
    // valley, with the first two already scored.
    const idx = name === 'rings' ? 2 : 0;
    const ring = rings[idx];
    const next = rings[idx + 1];
    const dx = next.x - ring.x;
    const dz = next.z - ring.z;
    const len = Math.hypot(dx, dz);
    const dist = name === 'rings' ? 300 : 350;
    plane.throttle = 0.85;
    plane.speed = 85;
    plane.y = ring.y;
    plane.x = ring.x - (dx / len) * dist;
    plane.z = ring.z - (dz / len) * dist;
    plane.heading = Math.atan2(dx, -dz);
    plane.gearDown = true;
    startMission(missions, world, now);
    if (name === 'rings') {
      missions.rings[0].passed = true;
      missions.rings[1].passed = true;
      missions.ringsPassed = 2;
      missions.score = 200;
    }
    runSteps(plane, world, missions, name === 'rings' ? 2 : 3, ring, now);
    return { screen: 'play' };
  }
  if (name === 'land') {
    // Final approach down the far runway's own axis: it runs north-south
    // (heading 0), so the approach flies north up its centreline from the
    // south end and the strip fills the frame ahead. Gear down, flaps out,
    // gentle descent.
    plane.throttle = 0.4;
    plane.speed = 40;
    plane.flaps = true;
    plane.gearDown = true;
    plane.y = 34;
    plane.x = 1400;
    plane.z = -800;
    plane.heading = 0;
    startMission(missions, world, now);
    advanceMission(missions, world, now); // landing mission
    const target = { x: 1400, y: 14, z: -1150 };
    runSteps(plane, world, missions, 7, target, now, true, 0.4);
    return { screen: 'play' };
  }
  // start: parked on the home runway at dawn light, title screen.
  plane.throttle = 0;
  plane.speed = 0;
  plane.y = heightAt(world, plane.x, plane.z) + 0.4;
  return { screen: 'title' };
}
