let ctx: AudioContext | null = null;
let lastScrape = 0;
let lastStep = 0;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockSound() {
  audio();
}

export function scrape() {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  if (now - lastScrape < 0.16) return;
  lastScrape = now;
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.09), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const gain = ac.createGain();
  gain.gain.value = 0.045;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  source.start();
}

export function chime() {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  for (const [freq, delay] of [
    [523, 0],
    [784, 0.08],
  ] as const) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.07, now + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.45);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.5);
  }
}

export function step() {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  if (now - lastStep < 0.28) return;
  lastStep = now;
  const osc = ac.createOscillator();
  const noise = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.05), ac.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const grain = ac.createBufferSource();
  grain.buffer = noise;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 380 + Math.random() * 140;
  const gain = ac.createGain();
  gain.gain.value = 0.028;
  osc.type = "sine";
  osc.frequency.value = 88 + Math.random() * 18;
  const body = ac.createGain();
  body.gain.setValueAtTime(0.018, now);
  body.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  osc.connect(body);
  body.connect(ac.destination);
  grain.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  grain.start();
  osc.start();
  osc.stop(now + 0.08);
}

export function tick() {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.value = 660;
  const now = ac.currentTime;
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(now + 0.09);
}
