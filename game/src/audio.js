// SPDX-License-Identifier: MIT
// Sound bank synthesised with WebAudio: knife taps, sizzle dings, the service bell, buzzers and fanfares.

export function createAudio() {
  let ac = null;
  let muted = false;

  function unlock() {
    if (!ac) {
      try { ac = new AudioContext(); } catch { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
  }

  function tone(freq, dur, type = 'sine', vol = 0.12, slideTo = 0, delay = 0) {
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator(); const gain = ac.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0); gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination); osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, freq, delay = 0) {
    const t0 = ac.currentTime + delay;
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ac.createBufferSource(); src.buffer = buf;
    const filter = ac.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = freq;
    const gain = ac.createGain(); gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(ac.destination); src.start(t0);
  }

  const BANK = {
    chop: () => { noise(0.05, 0.5, 2400); tone(180, 0.05, 'triangle', 0.08); },
    done: () => { tone(660, 0.08, 'triangle', 0.1); tone(990, 0.12, 'triangle', 0.1, 0, 0.07); },
    pick: () => tone(520, 0.06, 'square', 0.04, 700),
    drop: () => tone(420, 0.07, 'square', 0.04, 300),
    plate: () => { tone(784, 0.08, 'sine', 0.12); tone(1046, 0.14, 'sine', 0.1, 0, 0.06); },
    nope: () => tone(190, 0.15, 'square', 0.06, 140),
    ding: () => tone(1320, 0.35, 'sine', 0.1),
    warn: () => { tone(880, 0.1, 'square', 0.05); tone(880, 0.1, 'square', 0.05, 0, 0.16); },
    burnt: () => { noise(0.4, 0.4, 500); tone(110, 0.4, 'sawtooth', 0.06, 70); },
    ready: () => tone(1175, 0.2, 'triangle', 0.08),
    coins: () => [1760, 2093, 2637].forEach((f, i) => tone(f, 0.12, 'triangle', 0.06, 0, 0.12 + i * 0.07)),
    rain: () => { noise(1.2, 0.25, 3200); noise(0.8, 0.15, 900); },
    bell: () => { tone(1568, 0.9, 'sine', 0.16); tone(2093, 0.7, 'sine', 0.08); tone(3136, 0.3, 'sine', 0.04); },
    expire: () => { tone(220, 0.45, 'sawtooth', 0.09, 90); },
    rush: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'square', 0.06, 0, i * 0.09)),
    ticket: () => noise(0.08, 0.25, 5000),
    win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.3, 'triangle', 0.09, 0, i * 0.12)),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.35, 'triangle', 0.09, 0, i * 0.18)),
  };

  return {
    unlock,
    play(name) { if (ac && !muted && BANK[name]) BANK[name](); },
    toggleMute() { muted = !muted; return muted; },
  };
}
