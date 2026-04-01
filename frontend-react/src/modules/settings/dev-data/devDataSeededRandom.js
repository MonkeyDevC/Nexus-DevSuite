/**
 * PRNG determinista (mulberry32) para builder/preview.
 * No usar Math.random() en código de generación de payload.
 */

function hashStringToUint32(seedString) {
  let h = 2166136261;
  const s = String(seedString || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * @param {number} seedUint32
 * @returns {() => number} devuelve float en [0, 1)
 */
export function createMulberry32(seedUint32) {
  let a = seedUint32 >>> 0;
  return function next() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {string} seed
 * @param {string} salt
 */
export function createSeededRng(seed, salt) {
  const combined = `${String(seed)}|${String(salt)}`;
  return createMulberry32(hashStringToUint32(combined));
}

export function randomIntInclusive(rng, min, max) {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  if (hi < lo) return lo;
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/** UUID v4-like con bytes del PRNG (válido para validación backend isUuid). */
export function nextUuid(rng) {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    bytes[i] = Math.floor(rng() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
