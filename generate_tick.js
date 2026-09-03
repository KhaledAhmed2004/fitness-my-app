const fs = require('fs');
const { Buffer } = require('buffer');

// ─────────────────────────────────────────────────────────
// REALME UI / ColorOS — Effect_Tick.ogg approximation
// The classic Android clock alarm dial scroll sound.
// 
// Characteristics:
//   • Ultra-short: ~10ms (barely a whisper)
//   • Clean high-mid frequency (~3500Hz) — bright but not sharp
//   • Instant sharp attack, very fast decay
//   • No noise — 100% pure sine for that smooth Realme feel
//   • Very low volume — only felt, barely heard
// ─────────────────────────────────────────────────────────

const sampleRate = 44100;
const duration   = 0.010; // 10ms — exactly like Android Effect_Tick
const numFrames  = Math.floor(sampleRate * duration);

const wavData = Buffer.alloc(44 + numFrames * 2);

// ── WAV Header ──
wavData.write('RIFF', 0);
wavData.writeUInt32LE(36 + numFrames * 2, 4);
wavData.write('WAVE', 8);
wavData.write('fmt ', 12);
wavData.writeUInt32LE(16, 16);
wavData.writeUInt16LE(1,  20); // PCM
wavData.writeUInt16LE(1,  22); // Mono
wavData.writeUInt32LE(sampleRate, 24);
wavData.writeUInt32LE(sampleRate * 2, 28);
wavData.writeUInt16LE(2,  32);
wavData.writeUInt16LE(16, 34);
wavData.write('data', 36);
wavData.writeUInt32LE(numFrames * 2, 40);

// ── Audio ──
for (let i = 0; i < numFrames; i++) {
  const t = i / sampleRate;

  // Realme UI tick = warm high-mid, pure sine, no harmonics
  const freq = 3500; // Hz — bright but smooth, not sharp

  const wave = Math.sin(2 * Math.PI * freq * t);

  // Tiny 3-sample linear fade-in to prevent any pop/click at the start
  const attack = i < 3 ? i / 3 : 1;

  // Ultra-fast exponential decay — the key to the "barely there" feel
  const decay = Math.exp(-t / 0.0018); // ~1.8ms half-life

  // Volume: 4000 — clearly audible but soft and non-intrusive
  let value = Math.round(4000 * attack * decay * wave);
  value = Math.max(-32768, Math.min(32767, value));
  wavData.writeInt16LE(value, 44 + i * 2);
}

fs.writeFileSync('assets/audio/tick.wav', wavData);
console.log('✓ Realme UI Effect_Tick approximation generated — 10ms, 3500Hz, ultra-fast decay');
