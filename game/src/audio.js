// Synthesised sound: no audio files, just WebAudio oscillators and filtered
// noise. The engine drones with the throttle, the wind rises with speed, and
// rings, touchdowns and warnings get their own small voices.
export function makeAudio() {
  return {
    ctx: null,
    master: null,
    engineOsc: null,
    engineOsc2: null,
    engineGain: null,
    windSrc: null,
    windGain: null,
    muted: false,
    started: false,
  };
}

export function startAudio(audio) {
  if (audio.started) return;
  try {
    const Ctx = window.AudioContext ?? window.webkitAudioContext;
    audio.ctx = new Ctx();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.5;
    audio.master.connect(audio.ctx.destination);

    audio.engineOsc = audio.ctx.createOscillator();
    audio.engineOsc.type = 'sawtooth';
    audio.engineOsc.frequency.value = 55;
    audio.engineOsc2 = audio.ctx.createOscillator();
    audio.engineOsc2.type = 'square';
    audio.engineOsc2.frequency.value = 110;
    const engineFilter = audio.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 420;
    audio.engineGain = audio.ctx.createGain();
    audio.engineGain.gain.value = 0;
    audio.engineOsc.connect(engineFilter);
    audio.engineOsc2.connect(engineFilter);
    engineFilter.connect(audio.engineGain);
    audio.engineGain.connect(audio.master);
    audio.engineOsc.start();
    audio.engineOsc2.start();

    const noiseLen = audio.ctx.sampleRate * 2;
    const buffer = audio.ctx.createBuffer(1, noiseLen, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i += 1) data[i] = Math.random() * 2 - 1;
    audio.windSrc = audio.ctx.createBufferSource();
    audio.windSrc.buffer = buffer;
    audio.windSrc.loop = true;
    const windFilter = audio.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 900;
    windFilter.Q.value = 0.6;
    audio.windGain = audio.ctx.createGain();
    audio.windGain.gain.value = 0;
    audio.windSrc.connect(windFilter);
    windFilter.connect(audio.windGain);
    audio.windGain.connect(audio.master);
    audio.windSrc.start();

    audio.started = true;
  } catch {
    audio.started = false;
  }
}

export function updateAudio(audio, plane) {
  if (!audio.started || !audio.ctx) return;
  const rpm = 42 + plane.throttle * 68 + plane.speed * 0.35;
  audio.engineOsc.frequency.setTargetAtTime(rpm, audio.ctx.currentTime, 0.08);
  audio.engineOsc2.frequency.setTargetAtTime(rpm * 2, audio.ctx.currentTime, 0.08);
  const engineLevel = plane.crashed ? 0 : plane.onGround && plane.speed < 1 ? 0.02 + plane.throttle * 0.05 : 0.03 + plane.throttle * 0.09;
  audio.engineGain.gain.setTargetAtTime(audio.muted ? 0 : engineLevel, audio.ctx.currentTime, 0.1);
  const windLevel = plane.airborne ? Math.min(0.14, plane.speed * 0.0016) : 0;
  audio.windGain.gain.setTargetAtTime(audio.muted ? 0 : windLevel, audio.ctx.currentTime, 0.15);
}

function blip(audio, freq, dur, type, vol, when = 0) {
  if (!audio.started || !audio.ctx || audio.muted) return;
  const t = audio.ctx.currentTime + when;
  const osc = audio.ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = audio.ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export function playRingChime(audio) {
  blip(audio, 880, 0.35, 'sine', 0.22);
  blip(audio, 1318, 0.4, 'sine', 0.16, 0.08);
}

export function playThud(audio) {
  blip(audio, 90, 0.25, 'triangle', 0.3);
}

export function playWarning(audio) {
  blip(audio, 620, 0.12, 'square', 0.1);
  blip(audio, 620, 0.12, 'square', 0.1, 0.18);
}

export function playFanfare(audio) {
  [523, 659, 784, 1046].forEach((f, i) => blip(audio, f, 0.4, 'sine', 0.18, i * 0.12));
}

export function toggleMute(audio) {
  audio.muted = !audio.muted;
  if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.5;
  return audio.muted;
}
