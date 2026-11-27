// Meridian Courier: the game loop, screens and wiring. Title, flying, paused,
// mission-complete and game-over screens share one chase-view renderer; the
// `?shot=` query stages a deterministic scene and renders a single frame.
import { VIEW, WORLD, MISSIONS } from './config.js';
import { buildWorld, heightAt } from './world.js';
import { makePlane, stepFlight, stallSpeed } from './flight.js';
import { makeMissions, startMission, stepMissions, advanceMission, freeFlightScore, currentMission, showMessage } from './missions.js';
import { makeAudio, startAudio, updateAudio, playRingChime, playThud, playWarning, playFanfare, toggleMute } from './audio.js';
import { makeInput, bindInput, pollInput, pressed, takeClick } from './input.js';
import { makeCamera, updateChaseCamera, drawChaseView, drawHud, project } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || WORLD.seed);
const shotName = params.get('shot');
const world = buildWorld(seed);
const plane = makePlane();
const missions = makeMissions(world);
const audio = makeAudio();
const input = makeInput();
const cam = makeCamera();
bindInput(input, canvas);

let screen = 'title'; // title | play | pause | over | done
let last = performance.now();
let now = 0;
let best = 0;
let ringsBefore = 0;
let warnedAt = 0;
let titleAngle = 0;

function resetFlight() {
  const fresh = makePlane();
  Object.assign(plane, fresh);
  missions.index = 0;
  missions.score = 0;
  missions.ringsPassed = 0;
  startMission(missions, world, now);
  screen = 'play';
}

function drawTitle(time) {
  // Cinematic orbit: camera low behind the parked plane on the home runway,
  // at the plane's own height so it sits on the strip, not above it.
  titleAngle += 0.00012;
  const px = plane.x;
  const pz = plane.z;
  cam.x = px - Math.sin(titleAngle) * 24;
  cam.z = pz + Math.cos(titleAngle) * 24;
  cam.y = plane.y + 3.5;
  cam.yaw = Math.atan2(px - cam.x, -(pz - cam.z));
  cam.pitch = -0.12;
  cam.roll = 0;
  drawChaseView(ctx, world, plane, missions, cam, time);
  ctx.fillStyle = 'rgba(8,16,26,0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcf3d';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('MERIDIAN COURIER', VIEW.width / 2, 150);
  ctx.fillStyle = '#eaf6ff';
  ctx.font = '24px Georgia, serif';
  ctx.fillText('A bush-plane courier over the valley — rings, runways and fuel to mind', VIEW.width / 2, 192);
  ctx.fillStyle = '#dff3ff';
  ctx.font = '18px sans-serif';
  ctx.fillText('Arrows / WASD — fly      Shift — throttle up      Ctrl — throttle down', VIEW.width / 2, 300);
  ctx.fillText('G — gear      F — flaps      Space — airbrake      P — pause      M — mute', VIEW.width / 2, 330);
  ctx.fillStyle = '#ffcf3d';
  ctx.font = 'bold 22px sans-serif';
  const blink = Math.sin(time * 3) > -0.3;
  if (blink) ctx.fillText('PRESS ENTER OR CLICK TO FLY', VIEW.width / 2, 380);
  if (best > 0) {
    ctx.fillStyle = '#eaf6ff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Best score this session: ${best}`, VIEW.width / 2, 470);
  }
  ctx.fillStyle = 'rgba(223,243,255,0.75)';
  ctx.font = '14px sans-serif';
  ctx.fillText('Three sorties, then free flight. Land gently, gear down, on the strip.', VIEW.width / 2, 560);
}

function drawOverlay(title, lines, hint) {
  ctx.fillStyle = 'rgba(8,16,26,0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcf3d';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(title, VIEW.width / 2, 240);
  ctx.fillStyle = '#eaf6ff';
  ctx.font = '22px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 300 + i * 34));
  ctx.fillStyle = '#dff3ff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(hint, VIEW.width / 2, 300 + lines.length * 34 + 40);
}

function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  now += dt;
  const time = t / 1000;
  pollInput(input);

  if (pressed(input, 'Enter') && (screen === 'title' || screen === 'over' || screen === 'done')) {
    startAudio(audio);
    resetFlight();
  }
  if (pressed(input, 'KeyR') && (screen === 'over' || screen === 'done' || screen === 'pause')) {
    resetFlight();
  }
  if (pressed(input, 'KeyP') && (screen === 'play' || screen === 'pause')) {
    screen = screen === 'play' ? 'pause' : 'play';
    input.keys.delete('KeyP');
  }
  if (pressed(input, 'KeyM')) {
    toggleMute(audio);
    input.keys.delete('KeyM');
  }
  const click = takeClick(input);
  if (click && (screen === 'title' || screen === 'over' || screen === 'done')) {
    startAudio(audio);
    resetFlight();
  }

  if (screen === 'title') {
    drawTitle(time);
  } else if (screen === 'play') {
    const toggles = { gearToggle: false, flapToggle: false };
    const polled = pollInput(input);
    const flightInput = {
      roll: input.roll,
      pitch: input.pitch,
      throttle: input.throttle,
      gearToggle: polled.gear,
      flapToggle: polled.flap,
    };
    const beforeRings = missions.ringsPassed;
    stepFlight(plane, flightInput, dt, world);
    if (missions.index >= MISSIONS.length) {
      freeFlightScore(missions, plane, world, now);
    } else {
      stepMissions(missions, plane, world, dt, now);
    }
    if (missions.ringsPassed > beforeRings) playRingChime(audio);
    if (plane.landed && !plane.wasLanded) {
      playThud(audio);
      if (missions.state === 'done') playFanfare(audio);
    }
    plane.wasLanded = plane.landed;
    if (plane.stalling && plane.airborne && now - warnedAt > 1.2) {
      playWarning(audio);
      warnedAt = now;
    }
    if (plane.crashed) {
      best = Math.max(best, missions.score);
      screen = 'over';
    } else if (missions.state === 'done' && missions.index < MISSIONS.length) {
      screen = 'done';
    } else if (missions.state === 'failed') {
      best = Math.max(best, missions.score);
      screen = 'over';
    }
    updateChaseCamera(cam, plane, dt);
    drawChaseView(ctx, world, plane, missions, cam, time);
    drawHud(ctx, plane, missions, now, time);
    updateAudio(audio, plane);
  } else if (screen === 'pause') {
    drawChaseView(ctx, world, plane, missions, cam, time);
    drawHud(ctx, plane, missions, now, time);
    drawOverlay('PAUSED', ['Take a breath. The valley waits.'], 'Press P to keep flying');
  } else if (screen === 'over') {
    drawChaseView(ctx, world, plane, missions, cam, time);
    const reason = plane.crashed ? plane.crashReason : 'The sortie failed';
    drawOverlay('FLIGHT OVER', [reason, `Score ${missions.score} — best ${best}`], 'Press Enter or R to fly again');
  } else if (screen === 'done') {
    drawChaseView(ctx, world, plane, missions, cam, time);
    drawHud(ctx, plane, missions, now, time);
    const mission = currentMission(missions);
    drawOverlay('SORTIE COMPLETE', [`${mission ? mission.name : ''} done — score ${missions.score}`, 'The next sortie is waiting'], 'Press Enter to fly the next one');
  }

  if (screen === 'done' && pressed(input, 'Enter')) {
    advanceMission(missions, world, now);
    screen = 'play';
    input.keys.delete('Enter');
  }

  requestAnimationFrame(frame);
}

// A staged screenshot renders one frame and stops: the shot is deterministic.
if (shotName) {
  const staged = stageShot(shotName, world, plane, missions, 0);
  screen = staged.screen;
  if (staged.screen === 'title') {
    drawTitle(1.0);
  } else {
    updateChaseCamera(cam, plane, 1);
    drawChaseView(ctx, world, plane, missions, cam, 1.2);
    drawHud(ctx, plane, missions, 0, 1.2);
  }
  document.title = `shot:${shotName}`;
} else {
  requestAnimationFrame(frame);
}
