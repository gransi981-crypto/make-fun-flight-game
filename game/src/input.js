// Keyboard and mouse input: one small state object the flight model reads.
// Arrow keys / WASD fly the plane, Shift and Control work the throttle,
// G and F work the gear and flaps, P pauses, M mutes, Enter starts.
export function makeInput() {
  return {
    keys: new Set(),
    pitch: 0,
    roll: 0,
    throttle: 0,
    gearToggle: false,
    flapToggle: false,
    clicked: null,
  };
}

export function bindInput(input, canvas) {
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    input.keys.add(event.code);
    if (event.code === 'KeyG') input.gearToggle = true;
    if (event.code === 'KeyF') input.flapToggle = true;
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
  });
  window.addEventListener('blur', () => input.keys.clear());
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.clicked = {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  });
}

export function pollInput(input) {
  const held = (code) => input.keys.has(code);
  const pitchUp = held('ArrowUp') || held('KeyW');
  const pitchDown = held('ArrowDown') || held('KeyS');
  const rollLeft = held('ArrowLeft') || held('KeyA');
  const rollRight = held('ArrowRight') || held('KeyD');
  input.pitch = (pitchUp ? -1 : 0) + (pitchDown ? 1 : 0);
  input.roll = (rollLeft ? -1 : 0) + (rollRight ? 1 : 0);
  const up = held('ShiftLeft') || held('ShiftRight') || held('Equal');
  const down = held('ControlLeft') || held('ControlRight') || held('Minus');
  input.throttle = (up ? 1 : 0) + (down ? -1 : 0);
  if (held('Space')) input.throttle = -1; // airbrake: throttle closed, drag up
  const toggles = { gear: input.gearToggle, flap: input.flapToggle };
  input.gearToggle = false;
  input.flapToggle = false;
  return toggles;
}

export function pressed(input, code) {
  return input.keys.has(code);
}

export function takeClick(input) {
  const click = input.clicked;
  input.clicked = null;
  return click;
}
